"""
Detection Service: Encapsulates Ultralytics YOLOv8 inference,
bounding box drawing, and class mapping with robust error handling.
"""
import logging
import threading
import time
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional

import cv2
import numpy as np

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

from config import settings
from schemas import BoundingBox, DetectionItem

logger = logging.getLogger("smart_bijuka.detection")


class DetectionService:
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or settings.model_path
        self.model = None
        self.model_classes: Dict[int, str] = {}
        self.is_loaded = False
        self.load_error: Optional[str] = None
        self._load_lock = threading.Lock()
        
        # Non-blocking async background loading so FastAPI boots in < 1 second!
        threading.Thread(target=self._load_model, daemon=True).start()

    def _load_model(self):
        """Loads YOLO model in a background thread."""
        with self._load_lock:
            if YOLO is None:
                self.load_error = "Ultralytics package is not installed."
                logger.error(self.load_error)
                return

            resolved_path = Path(self.model_path)
            if not resolved_path.is_absolute():
                resolved_path = (Path(__file__).parent / resolved_path).resolve()

            try:
                logger.info(f"Loading YOLO model asynchronously from: {resolved_path}")
                self.model = YOLO(str(resolved_path))
                self.model_classes = self.model.names
                self.is_loaded = True
                self.load_error = None
                logger.info(f"YOLO model ready! Classes count: {len(self.model_classes)}")
            except Exception as exc:
                self.load_error = f"Failed to load model from {resolved_path}: {exc}"
                logger.error(self.load_error)
                self.is_loaded = False

    def get_supported_classes(self) -> Dict[str, Any]:
        """Returns all classes available in the loaded YOLO model and current configured deterrence classes."""
        return {
            "model_loaded": self.is_loaded,
            "model_path": self.model_path,
            "all_model_classes": list(self.model_classes.values()) if self.is_loaded else [],
            "configured_animal_classes": settings.supported_animal_classes,
            "human_class": "person",
            "load_error": self.load_error
        }

    def detect(self, image_bgr: np.ndarray, conf_threshold: Optional[float] = None) -> Tuple[List[DetectionItem], float]:
        """
        Runs inference on an OpenCV BGR image.
        Returns list of DetectionItem and inference duration in milliseconds.
        """
        if not self.is_loaded or self.model is None:
            # Wait up to 3 seconds if still loading on fresh start
            for _ in range(15):
                if self.is_loaded and self.model is not None:
                    break
                time.sleep(0.2)
        
        if not self.is_loaded or self.model is None:
            raise RuntimeError(f"YOLO model is still initializing. Please wait a moment. {self.load_error or ''}")

        threshold = conf_threshold if conf_threshold is not None else settings.confidence_threshold
        
        start_time = time.perf_counter()
        results = self.model.predict(
            source=image_bgr,
            conf=threshold,
            verbose=False,
            device="cpu"
        )
        duration_ms = (time.perf_counter() - start_time) * 1000.0

        detections: List[DetectionItem] = []
        configured_animals = set(settings.supported_animal_classes)

        for r in results:
            boxes = r.boxes
            if boxes is None:
                continue
            for box in boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                cls_name = self.model_classes.get(cls_id, str(cls_id)).lower()
                
                coords = box.xyxy[0].tolist()
                x1, y1, x2, y2 = map(int, coords)
                
                is_human = (cls_name == "person")
                is_animal = (cls_name in configured_animals)
                
                detections.append(
                    DetectionItem(
                        class_id=cls_id,
                        class_name=cls_name,
                        confidence=round(conf, 3),
                        box=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2),
                        is_supported_animal=is_animal,
                        is_human=is_human
                    )
                )

        # Sort detections with highest confidence first
        detections.sort(key=lambda d: d.confidence, reverse=True)
        return detections, round(duration_ms, 2)

    @staticmethod
    def draw_annotations(image_bgr: np.ndarray, detections: List[DetectionItem]) -> np.ndarray:
        """
        Draws polished, recruiter-grade bounding boxes and badge pills on image.
        Green for safe humans, Coral/Amber for detected animals, Neutral for other classes.
        """
        annotated = image_bgr.copy()
        
        for det in detections:
            x1, y1, x2, y2 = det.box.x1, det.box.y1, det.box.x2, det.box.y2
            
            if det.is_human:
                # Sage green for human (safe)
                box_color = (76, 175, 80)     # BGR
                label_bg = (56, 142, 60)
                badge_text = f"HUMAN: {det.class_name} {det.confidence:.0%}"
            elif det.is_supported_animal:
                # Coral / Crimson for animal threat (deterrent)
                box_color = (33, 33, 217)     # BGR (Red-orange)
                label_bg = (24, 24, 180)
                badge_text = f"ANIMAL: {det.class_name} {det.confidence:.0%}"
            else:
                # Neutral grey/blue
                box_color = (200, 160, 40)
                label_bg = (160, 120, 20)
                badge_text = f"{det.class_name} {det.confidence:.0%}"

            # Draw smooth 2px bounding box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), box_color, 2, lineType=cv2.LINE_AA)

            # Draw pill badge above box
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.55
            thickness = 1
            (w, h), baseline = cv2.getTextSize(badge_text, font, font_scale, thickness)
            
            badge_y1 = max(0, y1 - h - 10)
            badge_y2 = y1
            badge_x2 = min(annotated.shape[1], x1 + w + 12)
            
            cv2.rectangle(annotated, (x1, badge_y1), (badge_x2, badge_y2), label_bg, -1)
            cv2.putText(
                annotated,
                badge_text,
                (x1 + 6, y1 - 6),
                font,
                font_scale,
                (255, 255, 255),
                thickness,
                lineType=cv2.LINE_AA
            )

        return annotated
