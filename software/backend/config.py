"""
Smart Bijuka — Central Configuration Module.
Loads environment variables and sets defaults for paths, classes, and thresholds.
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Absolute directories
BACKEND_DIR = Path(__file__).resolve().parent
SOFTWARE_DIR = BACKEND_DIR.parent
PROJECT_ROOT = SOFTWARE_DIR.parent

DEFAULT_MODEL_PATH = SOFTWARE_DIR / "yolov8n.pt"
STATIC_DIR = BACKEND_DIR / "static"
AUDIO_DIR = STATIC_DIR / "audio"
UPLOADS_DIR = STATIC_DIR / "uploads"
EVENT_LOG_CSV = SOFTWARE_DIR / "logs" / "events.csv"

# Ensure all essential runtime directories exist
for path in (STATIC_DIR, AUDIO_DIR, UPLOADS_DIR, EVENT_LOG_CSV.parent):
    path.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    host: str = "127.0.0.1"
    port: int = 8000
    model_path: str = str(DEFAULT_MODEL_PATH)
    confidence_threshold: float = 0.50
    cooldown_seconds: float = 6.0
    
    # Supported deterrence classes (COCO animal labels detected by YOLOv8)
    # Humans ('person') are strictly handled by human safety policy
    supported_animal_classes: list[str] = [
        "bird", "cat", "dog", "horse", "sheep", "cow", 
        "elephant", "bear", "zebra", "giraffe"
    ]
    
    # Actuator & Hardware Integration Settings
    hardware_enabled: bool = False
    hardware_type: str = "simulation"  # 'simulation', 'wifi', or 'serial'
    esp32_ip: str = "192.168.1.150"
    esp32_port: int = 80
    esp32_serial_port: str = "COM3"
    esp32_baud_rate: int = 115200
    
    # Audio Alert Configuration
    default_audio_file: str = "animal_alert.mp3"
    audio_enabled: bool = True
    audio_volume: float = 0.85
    
    class Config:
        env_file = str(BACKEND_DIR / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

