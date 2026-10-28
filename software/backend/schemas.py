"""
Data schemas for detection requests, results, system state, and event logs.
"""
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int


class DetectionItem(BaseModel):
    class_id: int
    class_name: str
    confidence: float
    box: BoundingBox
    is_supported_animal: bool
    is_human: bool


class DecisionResult(BaseModel):
    status_code: Literal[
        "ANIMAL_DETERRENCE_ACTIVATED",
        "HUMAN_NO_REACTION",
        "NO_SUPPORTED_ANIMAL",
        "COOLDOWN_ACTIVE",
        "DETERRENCE_DISABLED",
        "ERROR_OR_NO_DETECTION"
    ]
    status_message: str
    should_deter: bool
    trigger_animal: Optional[str] = None
    trigger_confidence: Optional[float] = None
    human_present: bool = False
    cooldown_remaining: float = 0.0
    action_taken: str


class ActuatorStatus(BaseModel):
    hardware_enabled: bool = False
    hardware_type: str = "simulation"
    esp32_connected: bool = False
    last_command_sent: Optional[str] = None
    last_command_status: str = "Idle"
    ui_animation_state: str = "monitoring"  # 'monitoring', 'animal_detected', 'deterrent_activated', 'human_detected', 'camera_unavailable', 'ai_unavailable'


class DetectionResponse(BaseModel):
    timestamp: str
    mode: Literal["image", "camera"]
    detections: List[DetectionItem]
    decision: DecisionResult
    actuator: ActuatorStatus
    audio_played: bool
    audio_file: Optional[str] = None
    annotated_image_url: Optional[str] = None
    inference_time_ms: float = 0.0


class EventLogRecord(BaseModel):
    id: str
    timestamp: str
    mode: str
    primary_class: str
    confidence: float
    decision_status: str
    action_taken: str
    audio_played: bool
    actuator_fired: bool
    hardware_mode: str
    snapshot_url: Optional[str] = None


class ConfigUpdateRequest(BaseModel):
    confidence_threshold: Optional[float] = Field(None, ge=0.1, le=1.0)
    cooldown_seconds: Optional[float] = Field(None, ge=0.5, le=60.0)
    supported_animal_classes: Optional[List[str]] = None
    hardware_enabled: Optional[bool] = None
    hardware_type: Optional[str] = None
    esp32_ip: Optional[str] = None
    esp32_serial_port: Optional[str] = None
    audio_enabled: Optional[bool] = None
    audio_volume: Optional[float] = Field(None, ge=0.0, le=1.0)
    selected_audio_file: Optional[str] = None

