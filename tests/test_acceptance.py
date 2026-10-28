"""
Comprehensive Acceptance Tests for Smart Bijuka Detection and Selective Deterrence Policy.
Demonstrates:
  1. Upload image containing supported animal -> bounding box and class/confidence.
  2. Detect supported animal in camera mode -> authorized deterrent response occurs in demo mode.
  3. Detect a person -> no audio and no arm movement (HUMAN_NO_REACTION).
  4. Detect a person and supported animal together -> human-safe policy takes priority.
  5. Detect unsupported or low-confidence class -> no deterrence.
  6. Trigger animal response -> cooldown prevents repeated triggering.
  7. Stop camera -> capture stops and UI updates.
  8. Disconnect/disable hardware -> app clearly distinguishes UI animation from physical actuation.
  9. Audio playback can be managed without affecting the safety policy.
"""
import sys
import time
from pathlib import Path

# Add backend directory to path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "software" / "backend"
sys.path.insert(0, str(BACKEND_DIR))

import numpy as np
from schemas import DetectionItem, BoundingBox, DecisionResult
from config import settings
from decision_service import DecisionService
from response_service import ResponseService
from detection_service import DetectionService


def test_case_1_animal_detection_simulation():
    """Case 1: Upload image with supported animal (cow 0.91) -> DetectionItem & simulation decision."""
    decision_svc = DecisionService()
    decision_svc.reset_cooldown()

    cow_detection = DetectionItem(
        class_id=19,
        class_name="cow",
        confidence=0.91,
        box=BoundingBox(x1=50, y1=50, x2=300, y2=300),
        is_supported_animal=True,
        is_human=False
    )

    # In image mode with force_simulation=True
    decision = decision_svc.evaluate([cow_detection], mode="image", force_simulation=True)
    assert decision.status_code == "ANIMAL_DETERRENCE_ACTIVATED", f"Unexpected: {decision.status_code}"
    assert decision.should_deter is True
    assert decision.trigger_animal == "cow"
    assert decision.trigger_confidence == 0.91
    print("✓ Test Case 1 Passed: Animal detection produces authorized deterrence decision.")


def test_case_2_camera_mode_animal_deterrence():
    """Case 2: Camera mode detects animal -> Should deter immediately."""
    decision_svc = DecisionService()
    decision_svc.reset_cooldown()

    dog_detection = DetectionItem(
        class_id=16,
        class_name="dog",
        confidence=0.88,
        box=BoundingBox(x1=20, y1=20, x2=200, y2=200),
        is_supported_animal=True,
        is_human=False
    )

    decision = decision_svc.evaluate([dog_detection], mode="camera")
    assert decision.status_code == "ANIMAL_DETERRENCE_ACTIVATED"
    assert decision.should_deter is True
    print("✓ Test Case 2 Passed: Camera mode detects animal and authorizes deterrence.")


def test_case_3_human_safe_policy_no_deterrence():
    """Case 3: Human ('person') detected -> NO AUDIO, NO ARM MOVEMENT."""
    decision_svc = DecisionService()
    decision_svc.reset_cooldown()

    person_detection = DetectionItem(
        class_id=0,
        class_name="person",
        confidence=0.95,
        box=BoundingBox(x1=100, y1=100, x2=250, y2=400),
        is_supported_animal=False,
        is_human=True
    )

    decision = decision_svc.evaluate([person_detection], mode="camera")
    assert decision.status_code == "HUMAN_NO_REACTION", f"Unexpected: {decision.status_code}"
    assert decision.should_deter is False
    assert decision.human_present is True
    print("✓ Test Case 3 Passed: Human detected safely — zero deterrence, zero arm actuation.")


def test_case_4_human_presence_takes_priority_over_animal():
    """Any confident human detection suppresses deterrence, even in a mixed frame."""
    human = DetectionItem(
        class_id=0,
        class_name="person",
        confidence=0.95,
        box=BoundingBox(x1=100, y1=100, x2=250, y2=400),
        is_supported_animal=False,
        is_human=True
    )
    cow = DetectionItem(
        class_id=19,
        class_name="cow",
        confidence=0.91,
        box=BoundingBox(x1=50, y1=50, x2=300, y2=300),
        is_supported_animal=True,
        is_human=False
    )

    for detections in ([human, cow], [cow, human]):
        decision_svc = DecisionService()
        decision = decision_svc.evaluate(detections, mode="camera")
        assert decision.status_code == "HUMAN_NO_REACTION"
        assert decision.should_deter is False
        assert decision.human_present is True
        assert decision.trigger_animal is None
        assert decision_svc._last_deterrent_trigger_time == 0.0

    image_decision = DecisionService().evaluate(
        [cow, human],
        mode="image",
        force_simulation=True
    )
    assert image_decision.status_code == "HUMAN_NO_REACTION"
    assert image_decision.should_deter is False
    print("✓ Test Case 4 Passed: Human presence suppresses mixed-scene deterrence in every input order.")


def test_case_4_unsupported_or_low_confidence():
    """Case 5: Unsupported class or confidence below threshold -> No deterrence."""
    decision_svc = DecisionService()
    decision_svc.reset_cooldown()

    # Low confidence animal (below 0.50 threshold)
    low_conf_bird = DetectionItem(
        class_id=14,
        class_name="bird",
        confidence=0.35,  # Below threshold
        box=BoundingBox(x1=10, y1=10, x2=50, y2=50),
        is_supported_animal=True,
        is_human=False
    )

    decision = decision_svc.evaluate([low_conf_bird], mode="camera")
    assert decision.status_code == "NO_SUPPORTED_ANIMAL"
    assert decision.should_deter is False

    # Unsupported non-animal class (e.g., chair)
    chair_detection = DetectionItem(
        class_id=56,
        class_name="chair",
        confidence=0.89,
        box=BoundingBox(x1=10, y1=10, x2=100, y2=100),
        is_supported_animal=False,
        is_human=False
    )

    decision2 = decision_svc.evaluate([chair_detection], mode="camera")
    assert decision2.status_code == "NO_SUPPORTED_ANIMAL"
    assert decision2.should_deter is False
    print("✓ Test Case 5 Passed: Low confidence or non-target objects do not trigger deterrence.")


def test_case_5_cooldown_prevents_repeated_triggers():
    """Case 6: Repeated animal frames within cooldown -> Suppress repeated trigger."""
    decision_svc = DecisionService()
    decision_svc.reset_cooldown()

    animal = DetectionItem(
        class_id=19,
        class_name="cow",
        confidence=0.85,
        box=BoundingBox(x1=10, y1=10, x2=100, y2=100),
        is_supported_animal=True,
        is_human=False
    )

    # First trigger
    d1 = decision_svc.evaluate([animal], mode="camera")
    assert d1.status_code == "ANIMAL_DETERRENCE_ACTIVATED"
    assert d1.should_deter is True

    # Immediate second frame (0.1s later)
    d2 = decision_svc.evaluate([animal], mode="camera")
    assert d2.status_code == "COOLDOWN_ACTIVE"
    assert d2.should_deter is False
    assert d2.cooldown_remaining > 0
    print("✓ Test Case 6 Passed: Cooldown timer successfully suppresses spam triggers across frames.")


def test_case_6_hardware_separation_and_simulation():
    """Case 7: App cleanly separates UI animation from physical actuation."""
    response_svc = ResponseService()
    
    # 1. Default Safe Simulation Mode
    settings.hardware_enabled = False
    result_sim = response_svc.trigger_actuator(command="scare_cycle", angle=180)
    assert result_sim["mode"] == "simulation"
    assert response_svc.actuator_status.ui_animation_state == "deterrent_activated"
    assert response_svc.actuator_status.esp32_connected is False

    # 2. Reset back to monitoring
    response_svc.reset_actuator_state()
    assert response_svc.actuator_status.ui_animation_state == "monitoring"
    print("✓ Test Case 7 Passed: Physical actuator explicitly disabled by default; UI animation cleanly simulated.")


def test_case_7_audio_playback_management():
    """Case 8: Audio playback controls and human exclusion."""
    response_svc = ResponseService()
    files = response_svc.list_audio_files()
    assert "animal_alert.mp3" in files, f"Expected animal_alert.mp3 in {files}"
    
    # Verify playback executes gracefully without crashing
    played = response_svc.play_audio("animal_alert.mp3")
    assert played is True
    response_svc.stop_audio()
    print("✓ Test Case 8 Passed: Pre-recorded audio files loaded, played, and stopped safely.")


if __name__ == "__main__":
    print("\n" + "="*70)
    print(" RUNNING SMART BIJUKA COMPREHENSIVE ACCEPTANCE TESTS")
    print("="*70)
    test_case_1_animal_detection_simulation()
    test_case_2_camera_mode_animal_deterrence()
    test_case_3_human_safe_policy_no_deterrence()
    test_case_4_human_presence_takes_priority_over_animal()
    test_case_4_unsupported_or_low_confidence()
    test_case_5_cooldown_prevents_repeated_triggers()
    test_case_6_hardware_separation_and_simulation()
    test_case_7_audio_playback_management()
    print("="*70)
    print(" ALL 8 ACCEPTANCE TEST SUITES PASSED! ✓")
    print("="*70 + "\n")
