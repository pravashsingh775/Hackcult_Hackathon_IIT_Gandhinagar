"""
Response Service: Coordinates bioacoustic audio playback and
physical actuator / ESP32 servo command transmission.
Clearly separates visual UI simulation from real physical actuation.
"""
import logging
import threading
from pathlib import Path
from typing import Optional, Dict, Any, List

import requests

from config import settings, AUDIO_DIR
from schemas import ActuatorStatus

logger = logging.getLogger("smart_bijuka.response")

# Try initializing Pygame mixer for audio
_pygame_initialized = False
try:
    import pygame
    pygame.mixer.init()
    _pygame_initialized = True
    logger.info("Pygame audio mixer initialized.")
except Exception as e:
    logger.warning(f"Pygame audio mixer not available: {e}. Audio playback will run in simulation mode.")


class ResponseService:
    def __init__(self):
        self.selected_audio_file: str = settings.default_audio_file
        self.is_playing_audio: bool = False
        self.actuator_status: ActuatorStatus = ActuatorStatus(
            hardware_enabled=settings.hardware_enabled,
            hardware_type=settings.hardware_type,
            esp32_connected=False,
            last_command_sent=None,
            last_command_status="Idle / Simulation Mode",
            ui_animation_state="monitoring"
        )
        self._sound_cache = {}

    def list_audio_files(self) -> List[str]:
        """Lists available audio files in the static/audio directory."""
        if not AUDIO_DIR.exists():
            return []
        files = [f.name for f in AUDIO_DIR.glob("*") if f.suffix.lower() in (".mp3", ".wav", ".ogg")]
        return sorted(files)

    def play_audio(self, filename: Optional[str] = None) -> bool:
        """Plays the designated deterrent voice file using pygame mixer asynchronously."""
        if not settings.audio_enabled:
            logger.info("Audio is globally disabled in settings.")
            return False

        target_name = filename or self.selected_audio_file
        audio_path = AUDIO_DIR / target_name
        
        if not audio_path.exists():
            logger.error(f"Audio file not found: {audio_path}")
            return False

        if not _pygame_initialized:
            logger.info(f"[SIMULATION] Audio playback simulated for: {target_name}")
            return True

        def _play_thread():
            try:
                import pygame
                sound = pygame.mixer.Sound(str(audio_path))
                sound.set_volume(max(0.0, min(1.0, settings.audio_volume)))
                self.is_playing_audio = True
                sound.play()
                logger.info(f"Audio playback started: {target_name} at volume {settings.audio_volume}")
            except Exception as exc:
                logger.error(f"Pygame playback error for {target_name}: {exc}")
            finally:
                self.is_playing_audio = False

        threading.Thread(target=_play_thread, daemon=True).start()
        return True

    def stop_audio(self):
        """Stops any currently playing audio immediately."""
        if _pygame_initialized:
            try:
                import pygame
                pygame.mixer.stop()
                self.is_playing_audio = False
                logger.info("Audio playback stopped.")
            except Exception as e:
                logger.warning(f"Error stopping audio: {e}")

    def trigger_actuator(self, command: str = "scare_cycle", angle: int = 180) -> Dict[str, Any]:
        """
        Actuates scarecrow deterrence.
        Always updates UI animation state.
        Only sends real network/serial command if hardware_enabled is explicitly set to True.
        """
        self.actuator_status.ui_animation_state = "deterrent_activated"
        self.actuator_status.last_command_sent = command

        # Check if physical hardware actuation is enabled
        if not settings.hardware_enabled:
            self.actuator_status.last_command_status = "UI Animation simulated (Physical hardware disabled)"
            self.actuator_status.esp32_connected = False
            return {
                "success": True,
                "mode": "simulation",
                "message": "Scarecrow arm movement visualized on dashboard. Physical hardware is disabled by default for safety."
            }

        # Physical hardware branch: Wi-Fi REST command
        if settings.hardware_type == "wifi":
            url = f"http://{settings.esp32_ip}:{settings.esp32_port}/trigger"
            payload = {"action": command, "servo_angle": angle}
            try:
                logger.info(f"Transmitting actuator command to ESP32 at {url}")
                resp = requests.post(url, json=payload, timeout=2.0)
                if resp.status_code == 200:
                    self.actuator_status.esp32_connected = True
                    self.actuator_status.last_command_status = "Physical arm movement triggered on ESP32"
                    return {"success": True, "mode": "wifi", "response": resp.json()}
                else:
                    self.actuator_status.esp32_connected = False
                    self.actuator_status.last_command_status = f"ESP32 returned error: {resp.status_code}"
                    return {"success": False, "mode": "wifi", "error": f"HTTP {resp.status_code}"}
            except Exception as exc:
                self.actuator_status.esp32_connected = False
                self.actuator_status.last_command_status = f"ESP32 connection failed: {exc}"
                logger.warning(f"ESP32 Wi-Fi dispatch failed: {exc}")
                return {"success": False, "mode": "wifi", "error": str(exc)}

        # Physical hardware branch: Serial USB command
        if settings.hardware_type == "serial":
            try:
                import serial
                with serial.Serial(settings.esp32_serial_port, settings.esp32_baud_rate, timeout=1.0) as ser:
                    ser.write(f"TRIGGER:{command}:{angle}\n".encode("utf-8"))
                self.actuator_status.esp32_connected = True
                self.actuator_status.last_command_status = f"Sent to {settings.esp32_serial_port}"
                return {"success": True, "mode": "serial"}
            except Exception as exc:
                self.actuator_status.esp32_connected = False
                self.actuator_status.last_command_status = f"Serial port error: {exc}"
                return {"success": False, "mode": "serial", "error": str(exc)}

        return {"success": False, "mode": "unknown", "error": "Invalid hardware type"}

    def reset_actuator_state(self):
        """Returns the scarecrow state to idle monitoring."""
        self.actuator_status.ui_animation_state = "monitoring"
        self.actuator_status.last_command_status = "Idle"

