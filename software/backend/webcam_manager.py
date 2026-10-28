"""
Webcam Manager: Safe OpenCV video capture pipeline for streaming frames to frontend.
Handles device selection, connection errors, and frame reading.
"""
import logging
import threading
import time
from typing import Optional, Generator, Tuple
import cv2

logger = logging.getLogger("smart_bijuka.webcam")


class WebcamManager:
    def __init__(self, camera_index: int = 0):
        self.camera_index = camera_index
        self.cap: Optional[cv2.VideoCapture] = None
        self.is_running: bool = False
        self.last_frame: Optional[any] = None
        self.error_message: Optional[str] = None
        self._lock = threading.Lock()

    def start(self, camera_index: Optional[int] = None) -> Tuple[bool, str]:
        """Starts video capture on specified device index."""
        with self._lock:
            if self.is_running and self.cap and self.cap.isOpened():
                return True, "Camera is already running"

            if camera_index is not None:
                self.camera_index = camera_index

            try:
                # Use DirectShow on Windows for fastest camera startup
                self.cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW)
                if not self.cap.isOpened():
                    # Fallback to default backend
                    self.cap = cv2.VideoCapture(self.camera_index)
                    
                if not self.cap.isOpened():
                    self.error_message = f"Cannot access webcam at index {self.camera_index}. Please verify camera permissions or connection."
                    logger.error(self.error_message)
                    self.is_running = False
                    return False, self.error_message

                # Configure optimal 720p resolution
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
                
                self.is_running = True
                self.error_message = None
                logger.info(f"Webcam {self.camera_index} started successfully.")
                return True, "Camera started successfully"
            except Exception as exc:
                self.error_message = f"Error opening camera: {exc}"
                logger.error(self.error_message)
                self.is_running = False
                return False, self.error_message

    def stop(self):
        """Stops video capture and releases hardware resources."""
        with self._lock:
            self.is_running = False
            if self.cap:
                try:
                    self.cap.release()
                except Exception:
                    pass
                self.cap = None
            self.last_frame = None
            logger.info("Webcam stopped and released.")

    def read_frame(self) -> Tuple[bool, Optional[any]]:
        """Reads a single frame from the camera."""
        with self._lock:
            if not self.is_running or not self.cap or not self.cap.isOpened():
                return False, None
            
            success, frame = self.cap.read()
            if success:
                self.last_frame = frame
                return True, frame
            else:
                self.error_message = "Failed to capture frame from webcam."
                return False, None

    def get_status(self) -> dict:
        """Returns camera connection and health status."""
        return {
            "is_running": self.is_running,
            "camera_index": self.camera_index,
            "has_error": self.error_message is not None,
            "error_message": self.error_message
        }

