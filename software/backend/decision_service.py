"""
Decision Service: Central selective deterrence policy.
Evaluates detections against human-versus-animal safety rules,
confidence thresholds, and cooldown timers.
"""
import time
import logging
from typing import List, Tuple
from config import settings
from schemas import DetectionItem, DecisionResult

logger = logging.getLogger("smart_bijuka.decision")


class DecisionService:
    def __init__(self):
        self._last_deterrent_trigger_time: float = 0.0
        self._last_detected_animal: str = ""

    @property
    def cooldown_seconds(self) -> float:
        return settings.cooldown_seconds

    def evaluate(
        self,
        detections: List[DetectionItem],
        mode: str = "camera",
        force_simulation: bool = False
    ) -> DecisionResult:
        """
        Executes Central Selective Deterrence Policy:
        
        1. IF ANY supported animal is detected >= confidence_threshold:
           - Check Cooldown timer.
           - IF cooldown expired -> Trigger Deterrence (audio + arm movement).
           - IF cooldown active -> Suppress trigger, report COOLDOWN_ACTIVE.
        2. ELSE IF ANY human ('person') is detected:
           - HUMAN DETECTED — NO DETERRENCE (no audio, no arm movement).
        3. ELSE IF other objects or empty:
           - NO SUPPORTED ANIMAL DETECTED.
        """
        current_time = time.time()
        elapsed = current_time - self._last_deterrent_trigger_time
        cooldown_remaining = max(0.0, self.cooldown_seconds - elapsed)

        # In image upload mode, automatic physical actuation is never fired
        # unless an explicit simulation test is requested.
        is_image_mode = (mode == "image")

        # 1. Filter supported animals above threshold
        animal_detections = [
            d for d in detections 
            if d.is_supported_animal and d.confidence >= settings.confidence_threshold
        ]
        
        # 2. Filter human detections above threshold
        human_detections = [
            d for d in detections 
            if d.is_human and d.confidence >= settings.confidence_threshold
        ]

        # Case 1: Supported Animal Detected
        if animal_detections:
            top_animal = animal_detections[0]
            
            # Check cooldown
            if cooldown_remaining > 0 and not force_simulation:
                return DecisionResult(
                    status_code="COOLDOWN_ACTIVE",
                    status_message=f"Animal '{top_animal.class_name}' ({top_animal.confidence:.0%}) detected, but cooldown is active ({cooldown_remaining:.1f}s remaining).",
                    should_deter=False,
                    trigger_animal=top_animal.class_name,
                    trigger_confidence=top_animal.confidence,
                    human_present=len(human_detections) > 0,
                    cooldown_remaining=round(cooldown_remaining, 1),
                    action_taken="Suppressed by cooldown timer"
                )

            # Animal Deterrence Authorized!
            if not is_image_mode or force_simulation:
                self._last_deterrent_trigger_time = current_time
                self._last_detected_animal = top_animal.class_name

            action = "Deterrence Activated: Bioacoustic alarm + Scarecrow arm motion"
            if is_image_mode and not force_simulation:
                action = "Image analyzed — Ready for manual test simulation (No auto-deterrence on still image)"

            return DecisionResult(
                status_code="ANIMAL_DETERRENCE_ACTIVATED",
                status_message=f"ANIMAL DETECTED — DETERRENCE ACTIVATED: {top_animal.class_name.upper()} ({top_animal.confidence:.0%})",
                should_deter=(not is_image_mode or force_simulation),
                trigger_animal=top_animal.class_name,
                trigger_confidence=top_animal.confidence,
                human_present=len(human_detections) > 0,
                cooldown_remaining=0.0,
                action_taken=action
            )

        # Case 2: Human Detected (Strict safety policy)
        if human_detections:
            top_human = human_detections[0]
            return DecisionResult(
                status_code="HUMAN_NO_REACTION",
                status_message=f"HUMAN DETECTED — NO DETERRENCE: {top_human.confidence:.0%} confidence. Safe farmer/worker presence.",
                should_deter=False,
                trigger_animal=None,
                trigger_confidence=None,
                human_present=True,
                cooldown_remaining=round(cooldown_remaining, 1),
                action_taken="Monitored peacefully — No sound, no arm actuation"
            )

        # Case 3: No supported animal detected
        other_labels = [d.class_name for d in detections[:3]]
        summary = f"Detected: {', '.join(other_labels)}" if other_labels else "Field clear"
        
        return DecisionResult(
            status_code="NO_SUPPORTED_ANIMAL",
            status_message=f"NO SUPPORTED ANIMAL DETECTED. {summary}",
            should_deter=False,
            trigger_animal=None,
            trigger_confidence=None,
            human_present=False,
            cooldown_remaining=round(cooldown_remaining, 1),
            action_taken="Idle monitoring — All quiet"
        )

    def reset_cooldown(self):
        """Manually reset the cooldown timer."""
        self._last_deterrent_trigger_time = 0.0

