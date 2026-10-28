"""
Smart Bijuka — YOLOv8 threat detection engine.

ThreatDetector wraps an Ultralytics YOLO model and classifies each frame
into one of three threat levels:

    clear   — nothing of interest
    human   — human present (safe, but tracked)
    animal  — animal intruder (alerts: snapshot + audio + log)

Author: Pravash Singh | License: MIT
"""

from __future__ import annotations

import csv
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import cv2
import numpy as np

try:
    from ultralytics import YOLO
except ImportError:  # pragma: no cover - handled gracefully at runtime
    YOLO = None

from config import (
    ALERT_COOLDOWN,
    ALERT_SOUND,
    ANIMAL_CLASSES,
    AUDIO_ENABLED,
    AUDIO_VOLUME,
    CONFIDENCE_THRESHOLD,
    DETECTIONS_DIR,
    EVENT_LOG_CSV,
    HUMAN_CLASS_ID,
    HUMAN_LABEL,
    MODEL_NAME,
    THEME,
)

log = logging.getLogger("bijuka.detection")

def hex_to_bgr(hex_color: str) -> tuple[int, int, int]:
    """'#ef4444' -> (68, 68, 239) BGR tuple for OpenCV."""
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return (b, g, r)


COLOR_OK = hex_to_bgr(THEME["accent"])
COLOR_WARN = hex_to_bgr(THEME["warning"])
COLOR_BAD = hex_to_bgr(THEME["danger"])
COLOR_PANEL = hex_to_bgr(THEME["bg"])

THEME_COLORS = {
    "animal": COLOR_BAD,
    "human": COLOR_WARN,
    "clear": COLOR_OK,
}


@dataclass
class Threat:
    """Result of analysing a single frame."""

    kind: str = "clear"  # clear | human | animal
    label: str = "all clear"
    confidence: float = 0.0
    box: Optional[tuple[int, int, int, int]] = None  # x1, y1, x2, y2
    all_detections: list[dict] = field(default_factory=list)


class ThreatDetector:
    """YOLOv8-powered threat classifier with alert side effects."""

    def __init__(self, model_path: str = MODEL_NAME):
        if YOLO is None:
            raise ImportError(
                "ultralytics is not installed. Run: pip install -r requirements.txt"
            )
        self.model = YOLO(model_path)
        self.class_names = self.model.names  # {id: label}
        self._last_alert_ts = 0.0
        self._alert_sound = None
        log.info("ThreatDetector ready — model: %s", model_path)

    # ------------------------------------------------------------- public --
    def analyse(self, frame: np.ndarray) -> Threat:
        """Run inference on one BGR frame and return a Threat."""
        results = self.model.predict(frame, conf=CONFIDENCE_THRESHOLD, verbose=False)
        threat = Threat()

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                name = self.class_names.get(cls_id, str(cls_id))
                x1, y1, x2, y2 = (int(v) for v in box.xyxy[0])
                det = {
                    "name": name,
                    "conf": conf,
                    "box": (x1, y1, x2, y2),
                }
                threat.all_detections.append(det)

                if cls_id in ANIMAL_CLASSES and threat.kind != "animal":
                    threat.kind = "animal"
                    threat.label = ANIMAL_CLASSES[cls_id]
                    threat.confidence = conf
                    threat.box = det["box"]
                elif cls_id == HUMAN_CLASS_ID and threat.kind == "clear":
                    threat.kind = "human"
                    threat.label = HUMAN_LABEL
                    threat.confidence = conf
                    threat.box = det["box"]

        if (
            threat.kind == "animal"
            and time.time() - self._last_alert_ts >= ALERT_COOLDOWN
        ):
            self._last_alert_ts = time.time()
            self._on_animal(frame, threat)

        return threat

    # ------------------------------------------------------------ private --
    def _on_animal(self, frame: np.ndarray, threat: Threat) -> None:
        """Side effects for an animal intrusion: snapshot + log + audio."""
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = DETECTIONS_DIR / f"{threat.label}_{stamp}.jpg"
        cv2.imwrite(str(path), frame)
        self._log_event(threat, path.name)
        if AUDIO_ENABLED:
            self._play_alert()
        log.warning(
            "ANIMAL ALERT: %s (%.0f%%) — saved %s",
            threat.label,
            threat.confidence * 100,
            path.name,
        )

    def _log_event(self, threat: Threat, snapshot: str) -> None:
        new_file = not EVENT_LOG_CSV.exists()
        with open(EVENT_LOG_CSV, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if new_file:
                writer.writerow(
                    ["timestamp", "label", "confidence", "snapshot", "n_detections"]
                )
            writer.writerow(
                [
                    datetime.now().isoformat(timespec="seconds"),
                    threat.label,
                    f"{threat.confidence:.2f}",
                    snapshot,
                    len(threat.all_detections),
                ]
            )

    def _play_alert(self) -> None:
        """Best-effort audio alarm; never crashes the pipeline."""
        try:
            import pygame

            if self._alert_sound is None and ALERT_SOUND.exists():
                pygame.mixer.init()
                self._alert_sound = pygame.mixer.Sound(str(ALERT_SOUND))
            if self._alert_sound is not None:
                self._alert_sound.set_volume(max(0.0, min(1.0, float(AUDIO_VOLUME))))
                self._alert_sound.play()
        except Exception as exc:  # noqa: BLE001 - audio is optional
            log.debug("Audio alert unavailable: %s", exc)


def annotate(frame: np.ndarray, threat: Threat) -> np.ndarray:
    """Draw boxes/labels for every detection onto a copy of the frame."""
    out = frame.copy()
    color = THEME_COLORS[threat.kind]
    for det in threat.all_detections:
        is_threat = det["name"] in ANIMAL_CLASSES.values()
        c = COLOR_BAD if is_threat else COLOR_OK
        x1, y1, x2, y2 = det["box"]
        cv2.rectangle(out, (x1, y1), (x2, y2), c, 2)
        tag = f"{det['name']} {det['conf']:.0%}"
        cv2.rectangle(out, (x1, y1 - 24), (x1 + 10 * len(tag), y1), c, -1)
        cv2.putText(out, tag, (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    status = (
        f"{threat.kind.upper()}: {threat.label}"
        if threat.kind != "clear"
        else "STATUS: ALL CLEAR"
    )
    cv2.rectangle(out, (0, 0), (out.shape[1], 34), COLOR_PANEL, -1)
    cv2.putText(out, status, (10, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
    return out
