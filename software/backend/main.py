"""
Smart Bijuka — FastAPI Backend Application.
Provides REST and SSE/MJPEG streaming endpoints for AI detection,
selective deterrence, audio management, hardware configuration, and system logs.
"""
import io
import time
import uuid
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, List

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, Query, HTTPException, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from config import settings, STATIC_DIR, AUDIO_DIR, UPLOADS_DIR
from schemas import (
    DetectionResponse,
    DecisionResult,
    ActuatorStatus,
    ConfigUpdateRequest,
    EventLogRecord
)
from detection_service import DetectionService
from decision_service import DecisionService
from response_service import ResponseService
from event_logger import EventLogger
from webcam_manager import WebcamManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("smart_bijuka.api")

# Initialize services
detection_service = DetectionService()
decision_service = DecisionService()
response_service = ResponseService()
event_logger = EventLogger()
webcam_manager = WebcamManager()

app = FastAPI(
    title="Smart Bijuka — AI Animal Detection & Selective Deterrence API",
    version="2.0.0",
    description="Backend microservice integrating YOLOv8 computer vision with selective deterrence decision policy and IoT actuators."
)

# Enable CORS for local web dashboards
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for audio previews and detection snapshots
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
def root():
    return {
        "project": "Smart Bijuka — AI-Powered Crop Protection System",
        "status": "online",
        "version": "2.0.0",
        "docs_url": "/docs",
        "model_loaded": detection_service.is_loaded
    }


# =========================================================================
# System Status & Configuration
# =========================================================================

@app.get("/api/status")
def get_system_status():
    """Returns real-time status of all subsystems (AI, Camera, Actuator, Audio)."""
    return {
        "timestamp": datetime.now().isoformat(),
        "ai": {
            "model_loaded": detection_service.is_loaded,
            "model_path": detection_service.model_path,
            "classes_count": len(detection_service.model_classes),
            "load_error": detection_service.load_error
        },
        "camera": webcam_manager.get_status(),
        "actuator": response_service.actuator_status.model_dump(),
        "audio": {
            "selected_file": response_service.selected_audio_file,
            "available_files": response_service.list_audio_files(),
            "audio_enabled": settings.audio_enabled,
            "audio_volume": settings.audio_volume,
            "is_playing": response_service.is_playing_audio
        },
        "policy": {
            "confidence_threshold": settings.confidence_threshold,
            "cooldown_seconds": settings.cooldown_seconds,
            "supported_animal_classes": settings.supported_animal_classes
        }
    }


@app.get("/api/classes")
def get_supported_classes():
    """Returns actual classes present in the loaded YOLO model and current configured animal classes."""
    return detection_service.get_supported_classes()


@app.post("/api/config")
def update_configuration(req: ConfigUpdateRequest):
    """Updates runtime configuration settings."""
    if req.confidence_threshold is not None:
        settings.confidence_threshold = req.confidence_threshold
    if req.cooldown_seconds is not None:
        settings.cooldown_seconds = req.cooldown_seconds
    if req.supported_animal_classes is not None:
        settings.supported_animal_classes = req.supported_animal_classes
    if req.hardware_enabled is not None:
        settings.hardware_enabled = req.hardware_enabled
        response_service.actuator_status.hardware_enabled = req.hardware_enabled
    if req.hardware_type is not None:
        settings.hardware_type = req.hardware_type
        response_service.actuator_status.hardware_type = req.hardware_type
    if req.esp32_ip is not None:
        settings.esp32_ip = req.esp32_ip
    if req.esp32_serial_port is not None:
        settings.esp32_serial_port = req.esp32_serial_port
    if req.audio_enabled is not None:
        settings.audio_enabled = req.audio_enabled
    if req.audio_volume is not None:
        settings.audio_volume = req.audio_volume
    if req.selected_audio_file is not None:
        response_service.selected_audio_file = req.selected_audio_file

    return {
        "success": True,
        "message": "Configuration updated successfully",
        "current_config": {
            "confidence_threshold": settings.confidence_threshold,
            "cooldown_seconds": settings.cooldown_seconds,
            "supported_animal_classes": settings.supported_animal_classes,
            "hardware_enabled": settings.hardware_enabled,
            "hardware_type": settings.hardware_type,
            "audio_enabled": settings.audio_enabled,
            "audio_volume": settings.audio_volume,
            "selected_audio_file": response_service.selected_audio_file
        }
    }


# =========================================================================
# Mode 1: Image Upload Detection
# =========================================================================

@app.post("/api/detect/image", response_model=DetectionResponse)
async def detect_image(
    file: UploadFile = File(...),
    simulate_response: bool = Form(False)
):
    """
    Runs YOLOv8 object detection on an uploaded image.
    Generates annotated image, evaluates selective deterrence policy,
    and returns rich detection details.
    
    Image upload defaults to safe preview/simulation. It will NOT repeatedly
    fire physical hardware unless simulate_response is explicitly True.
    """
    if not detection_service.is_loaded:
        raise HTTPException(status_code=503, detail="YOLO AI model is not loaded.")

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid image format. Could not decode image.")

    # 1. Run Detection
    detections, infer_ms = detection_service.detect(image_bgr)

    # 2. Evaluate Policy
    decision = decision_service.evaluate(
        detections=detections,
        mode="image",
        force_simulation=simulate_response
    )

    # 3. Handle Deterrence side-effects if authorized & requested
    audio_played = False
    if decision.should_deter:
        audio_played = response_service.play_audio()
        response_service.trigger_actuator(command="scare_cycle", angle=180)
    elif decision.human_present:
        response_service.actuator_status.ui_animation_state = "human_detected"
    else:
        response_service.actuator_status.ui_animation_state = "monitoring"

    # 4. Draw annotations and save snapshot
    annotated = detection_service.draw_annotations(image_bgr, detections)
    snapshot_filename = f"detect_{int(time.time())}_{uuid.uuid4().hex[:6]}.jpg"
    snapshot_path = UPLOADS_DIR / snapshot_filename
    cv2.imwrite(str(snapshot_path), annotated)
    snapshot_url = f"/static/uploads/{snapshot_filename}"

    # 5. Record Event Log
    event_logger.log_event(
        mode="Upload Image",
        detections=detections,
        decision=decision,
        audio_played=audio_played,
        actuator_fired=decision.should_deter,
        hardware_mode="Physical" if settings.hardware_enabled else "Simulation",
        snapshot_url=snapshot_url
    )

    return DetectionResponse(
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        mode="image",
        detections=detections,
        decision=decision,
        actuator=response_service.actuator_status,
        audio_played=audio_played,
        audio_file=response_service.selected_audio_file,
        annotated_image_url=snapshot_url,
        inference_time_ms=infer_ms
    )


# =========================================================================
# Mode 2: Laptop Camera Controls & Frame Processing
# =========================================================================

@app.post("/api/camera/start")
def start_camera(camera_index: int = Query(0, ge=0)):
    """Starts the laptop webcam capture."""
    success, message = webcam_manager.start(camera_index)
    if not success:
        response_service.actuator_status.ui_animation_state = "camera_unavailable"
        raise HTTPException(status_code=500, detail=message)
    
    response_service.actuator_status.ui_animation_state = "monitoring"
    return {"success": True, "message": message, "camera_index": camera_index}


@app.post("/api/camera/stop")
def stop_camera():
    """Stops the laptop webcam capture and releases hardware."""
    webcam_manager.stop()
    response_service.actuator_status.ui_animation_state = "monitoring"
    return {"success": True, "message": "Camera stopped"}


@app.post("/api/detect/frame", response_model=DetectionResponse)
def detect_camera_frame():
    """
    Grabs the latest camera frame, performs YOLOv8 detection,
    and applies the selective deterrence policy in live mode.
    """
    if not webcam_manager.is_running:
        response_service.actuator_status.ui_animation_state = "camera_unavailable"
        raise HTTPException(status_code=400, detail="Webcam is not running. Please start camera first.")

    success, frame = webcam_manager.read_frame()
    if not success or frame is None:
        raise HTTPException(status_code=500, detail="Failed to read frame from webcam.")

    # 1. Run Detection
    detections, infer_ms = detection_service.detect(frame)

    # 2. Evaluate Policy
    decision = decision_service.evaluate(detections=detections, mode="camera")

    # 3. Selective Deterrence Side-Effects
    audio_played = False
    if decision.should_deter:
        audio_played = response_service.play_audio()
        response_service.trigger_actuator(command="scare_cycle", angle=180)
    elif decision.human_present:
        response_service.actuator_status.ui_animation_state = "human_detected"
    else:
        response_service.actuator_status.ui_animation_state = "monitoring"

    # 4. Draw annotations and save current frame preview
    annotated = detection_service.draw_annotations(frame, detections)
    snapshot_filename = "current_camera_frame.jpg"
    snapshot_path = UPLOADS_DIR / snapshot_filename
    cv2.imwrite(str(snapshot_path), annotated)
    snapshot_url = f"/static/uploads/{snapshot_filename}?t={int(time.time()*1000)}"

    # 5. Log significant events (animals or humans)
    if decision.should_deter or decision.human_present:
        event_logger.log_event(
            mode="Laptop Camera",
            detections=detections,
            decision=decision,
            audio_played=audio_played,
            actuator_fired=decision.should_deter,
            hardware_mode="Physical" if settings.hardware_enabled else "Simulation",
            snapshot_url=snapshot_url
        )

    return DetectionResponse(
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        mode="camera",
        detections=detections,
        decision=decision,
        actuator=response_service.actuator_status,
        audio_played=audio_played,
        audio_file=response_service.selected_audio_file,
        annotated_image_url=snapshot_url,
        inference_time_ms=infer_ms
    )


def generate_mjpeg_stream():
    """Generates an annotated MJPEG video stream from the webcam."""
    while webcam_manager.is_running:
        success, frame = webcam_manager.read_frame()
        if not success or frame is None:
            time.sleep(0.05)
            continue

        try:
            detections, _ = detection_service.detect(frame)
            annotated = detection_service.draw_annotations(frame, detections)
        except Exception:
            annotated = frame

        ret, buffer = cv2.imencode('.jpg', annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
        if not ret:
            continue

        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.033)  # ~30 FPS throttle


@app.get("/api/camera/stream")
def camera_video_stream():
    """Returns continuous multipart/x-mixed-replace MJPEG video stream."""
    if not webcam_manager.is_running:
        raise HTTPException(status_code=400, detail="Webcam is not active.")
    return StreamingResponse(
        generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


# =========================================================================
# Audio Management & Testing
# =========================================================================

@app.get("/api/audio/files")
def list_audio_files():
    """Lists all available pre-recorded deterrent voice tracks."""
    files = response_service.list_audio_files()
    return {
        "files": files,
        "selected": response_service.selected_audio_file,
        "audio_enabled": settings.audio_enabled,
        "audio_volume": settings.audio_volume
    }


@app.post("/api/audio/select")
def select_audio_file(filename: str = Query(...)):
    """Selects the active pre-recorded deterrent voice file."""
    if filename not in response_service.list_audio_files():
        raise HTTPException(status_code=404, detail="Audio file not found in library.")
    response_service.selected_audio_file = filename
    return {"success": True, "selected": filename}


@app.post("/api/audio/upload")
async def upload_audio_file(file: UploadFile = File(...)):
    """Uploads a new deterrent audio file (WAV/MP3)."""
    allowed_exts = (".mp3", ".wav", ".ogg")
    suffix = Path(file.filename).suffix.lower()
    if suffix not in allowed_exts:
        raise HTTPException(status_code=400, detail="Only .mp3, .wav, or .ogg audio files are supported.")

    dest_path = AUDIO_DIR / file.filename
    with open(dest_path, "wb") as f:
        content = await file.read()
        f.write(content)

    response_service.selected_audio_file = file.filename
    logger.info(f"New audio file uploaded: {file.filename}")
    return {"success": True, "filename": file.filename, "message": "Audio file uploaded and selected."}


@app.post("/api/audio/test")
def test_audio_playback(filename: Optional[str] = Query(None)):
    """Tests audio playback immediately for the operator."""
    target = filename or response_service.selected_audio_file
    played = response_service.play_audio(target)
    return {"success": played, "audio_file": target, "message": "Playing audio test preview" if played else "Failed to play audio"}


@app.post("/api/audio/stop")
def stop_audio_playback():
    """Stops audio preview/alarm playback immediately."""
    response_service.stop_audio()
    return {"success": True, "message": "Audio stopped"}


# =========================================================================
# Actuator & Scarecrow State Testing
# =========================================================================

@app.post("/api/actuator/test")
def test_actuator_response():
    """Manual trigger to test scarecrow arm movement (simulation or physical)."""
    result = response_service.trigger_actuator(command="manual_test", angle=180)
    return result


@app.post("/api/actuator/reset")
def reset_actuator_state():
    """Resets scarecrow arm state back to idle monitoring."""
    response_service.reset_actuator_state()
    return {"success": True, "state": response_service.actuator_status.ui_animation_state}


# =========================================================================
# Event Activity Logs
# =========================================================================

@app.get("/api/logs", response_model=List[EventLogRecord])
def get_system_logs(limit: int = Query(50, ge=1, le=200)):
    """Returns recent detection events, decisions, and outcomes."""
    return event_logger.get_recent_events(limit)


@app.delete("/api/logs")
def clear_system_logs():
    """Clears the in-memory event activity log."""
    event_logger.clear()
    return {"success": True, "message": "Logs cleared"}

