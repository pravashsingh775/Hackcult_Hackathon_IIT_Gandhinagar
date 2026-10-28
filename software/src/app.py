#!/usr/bin/env python3
"""
Smart Bijuka — entry point.

Usage:
    python app.py                  # launch the Tkinter dashboard (live webcam)
    python app.py --camera 1       # use a different camera index
    python app.py --image foo.jpg  # one-shot detection on a photo (headless)
    python app.py --check          # verify the environment and exit

Author: Pravash Singh | License: MIT
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

import cv2

import config
from detection import ThreatDetector, annotate

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(config.LOGS_DIR / "app.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("bijuka.app")


def check_environment() -> int:
    """Print dependency / model status. Returns exit code."""
    print("=" * 60)
    print(" Smart Bijuka — environment check")
    print("=" * 60)
    ok = True
    for mod in ("cv2", "ultralytics", "PIL", "pygame", "numpy"):
        try:
            __import__(mod)
            print(f"  [OK]   {mod}")
        except ImportError:
            print(f"  [MISS] {mod}  →  pip install -r requirements.txt")
            ok = False
    model = Path(config.MODEL_NAME)
    print(
        f"  [{'OK' if model.exists() else 'WARN'}]  model: {model.name}"
        + ("" if model.exists() else "  (will auto-download on first run, ~6 MB)")
    )
    print(
        f"  [{'OK' if config.ALERT_SOUND.exists() else 'WARN'}]  alert sound: "
        f"{config.ALERT_SOUND.name}"
    )
    print("=" * 60)
    return 0 if ok else 1


def run_headless(image_path: str, camera_index: int) -> int:
    """One-shot detection without GUI."""
    detector = ThreatDetector()
    if image_path:
        frame = cv2.imread(image_path)
        if frame is None:
            log.error("Could not read image: %s", image_path)
            return 1
        threat = detector.analyse(frame)
        out = config.DETECTIONS_DIR / f"result_{Path(image_path).name}"
        cv2.imwrite(str(out), annotate(frame, threat))
        log.info(
            "Result: %s (%s, %.0f%%) → %s",
            threat.kind,
            threat.label,
            threat.confidence * 100,
            out.name,
        )
        return 0
    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        log.error("Cannot open camera %s", camera_index)
        return 1
    ok, frame = cap.read()
    cap.release()
    if not ok:
        log.error("Camera read failed")
        return 1
    threat = detector.analyse(frame)
    log.info(
        "Result: %s (%s, %.0f%%)", threat.kind, threat.label, threat.confidence * 100
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="Smart Bijuka", description="AI crop protection dashboard"
    )
    parser.add_argument(
        "--camera",
        type=int,
        default=config.CAMERA_INDEX,
        help="camera index (default 0)",
    )
    parser.add_argument(
        "--image",
        type=str,
        default="",
        help="run detection once on this image and exit",
    )
    parser.add_argument(
        "--video",
        type=str,
        default="",
        help="path to video file to run detection on",
    )
    args = parser.parse_args()

    if args.check:
        return check_environment()
    if args.image:
        return run_headless(args.image, args.camera)

    try:
        import gui

        gui.launch(camera_index=args.camera)
        return 0
    except Exception as exc:
        log.error("GUI launch failed: %s. Falling back to headless verification.", exc)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
