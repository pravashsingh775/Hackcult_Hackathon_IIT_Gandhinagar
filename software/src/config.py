"""
Smart Bijuka — Central configuration (single source of truth).

Paths, detection thresholds, threat classes and UI theme live here so
the rest of the codebase never hard-codes values.

Author: Pravash Singh | License: MIT
"""

from __future__ import annotations

import os
from pathlib import Path

# ---------------------------------------------------------------- paths ----
SRC_DIR = Path(__file__).resolve().parent
SOFTWARE_DIR = SRC_DIR.parent
PROJECT_ROOT = SOFTWARE_DIR.parent

MODEL_PATH = SOFTWARE_DIR / "yolov8n.pt"
ASSETS_DIR = SOFTWARE_DIR / "assets"
ALERT_SOUND = ASSETS_DIR / "animal_alert.mp3"
DETECTIONS_DIR = SOFTWARE_DIR / "detections"
LOGS_DIR = SOFTWARE_DIR / "logs"
EVENT_LOG_CSV = LOGS_DIR / "events.csv"

for _d in (DETECTIONS_DIR, LOGS_DIR):
    _d.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------- detection ----
MODEL_NAME = str(MODEL_PATH)
CONFIDENCE_THRESHOLD = 0.45  # min confidence to accept a YOLO detection
CAMERA_INDEX = 0  # default webcam; override with --camera
FRAME_WIDTH = 1280
FRAME_HEIGHT = 720
PROCESS_EVERY_N_FRAMES = 2  # run inference every Nth frame for speed
TARGET_FPS = 30

# COCO classes considered threats (animals). Humans are safe.
ANIMAL_CLASSES: dict[int, str] = {
    15: "bird",
    16: "cat",
    17: "dog",
    18: "horse",
    19: "sheep",
    20: "cow",
    21: "elephant",
    22: "bear",
    23: "zebra",
    24: "giraffe",
}
HUMAN_CLASS_ID = 0
HUMAN_LABEL = "human"

# Cooldown so one animal visit doesn't spam snapshots/alerts (seconds).
ALERT_COOLDOWN = 8.0

# ----------------------------------------------------------------- audio ----
AUDIO_ENABLED = True
AUDIO_VOLUME = 0.8  # 0.0 – 1.0

# ------------------------------------------------------------------ theme ----
THEME: dict[str, str] = {
    "bg": "#0f172a",
    "panel": "#1e293b",
    "accent": "#22c55e",
    "danger": "#ef4444",
    "warning": "#f59e0b",
    "text": "#e2e8f0",
    "text_dim": "#94a3b8",
    "font_family": "Segoe UI",
}

# ------------------------------------------------------------------ flags ----
HEADLESS = os.environ.get("SMART_BIJUKA_HEADLESS", "").lower() in {"1", "true", "yes"}
