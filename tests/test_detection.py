"""
Tests for Smart Bijuka configuration and threat detection data models.
"""

import sys
from pathlib import Path

# Add software/src to python path
SRC_DIR = Path(__file__).resolve().parent.parent / "software" / "src"
sys.path.insert(0, str(SRC_DIR))

import config
from detection import Threat, hex_to_bgr


def test_config_paths():
    assert config.SRC_DIR.exists()
    assert config.SOFTWARE_DIR.exists()
    assert config.PROJECT_ROOT.exists()
    assert config.DETECTIONS_DIR.exists()
    assert config.LOGS_DIR.exists()


def test_threat_classes():
    assert 0 not in config.ANIMAL_CLASSES
    assert config.HUMAN_CLASS_ID == 0
    assert "bird" in config.ANIMAL_CLASSES.values()
    assert "cow" in config.ANIMAL_CLASSES.values()


def test_hex_to_bgr():
    # Red: #ff0000 -> BGR (0, 0, 255)
    assert hex_to_bgr("#ff0000") == (0, 0, 255)
    # Green: #00ff00 -> BGR (0, 255, 0)
    assert hex_to_bgr("#00ff00") == (0, 255, 0)
    # Blue: #0000ff -> BGR (255, 0, 0)
    assert hex_to_bgr("#0000ff") == (255, 0, 0)


def test_threat_dataclass_defaults():
    t = Threat()
    assert t.kind == "clear"
    assert t.label == "all clear"
    assert t.confidence == 0.0
    assert t.box is None
    assert len(t.all_detections) == 0


def test_threat_dataclass_custom():
    t = Threat(
        kind="animal",
        label="bird",
        confidence=0.88,
        box=(10, 20, 100, 200),
        all_detections=[{"name": "bird", "conf": 0.88, "box": (10, 20, 100, 200)}],
    )
    assert t.kind == "animal"
    assert t.label == "bird"
    assert t.confidence == 0.88
    assert t.box == (10, 20, 100, 200)
    assert len(t.all_detections) == 1


if __name__ == "__main__":
    test_config_paths()
    test_threat_classes()
    test_hex_to_bgr()
    test_threat_dataclass_defaults()
    test_threat_dataclass_custom()
    print("All tests passed successfully!")

