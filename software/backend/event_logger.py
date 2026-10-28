"""
Event Logger: In-memory circular buffer with asynchronous CSV disk persistence.
Keeps track of real-time detection events, decisions, and outcomes.
"""
import csv
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from config import EVENT_LOG_CSV
from schemas import EventLogRecord, DecisionResult, DetectionItem


class EventLogger:
    def __init__(self, max_records: int = 100):
        self.max_records = max_records
        self.records: List[EventLogRecord] = []
        self._init_csv()

    def _init_csv(self):
        """Initializes CSV header if file does not exist."""
        if not EVENT_LOG_CSV.exists():
            with open(EVENT_LOG_CSV, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow([
                    "id", "timestamp", "mode", "primary_class", "confidence",
                    "decision_status", "action_taken", "audio_played", "actuator_fired",
                    "hardware_mode", "snapshot_url"
                ])

    def log_event(
        self,
        mode: str,
        detections: List[DetectionItem],
        decision: DecisionResult,
        audio_played: bool,
        actuator_fired: bool,
        hardware_mode: str,
        snapshot_url: Optional[str] = None
    ) -> EventLogRecord:
        """Records a new system event and appends to CSV."""
        record_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        primary_class = "None"
        confidence = 0.0
        if detections:
            primary_class = detections[0].class_name
            confidence = detections[0].confidence

        record = EventLogRecord(
            id=record_id,
            timestamp=timestamp,
            mode=mode,
            primary_class=primary_class,
            confidence=confidence,
            decision_status=decision.status_code,
            action_taken=decision.action_taken,
            audio_played=audio_played,
            actuator_fired=actuator_fired,
            hardware_mode=hardware_mode,
            snapshot_url=snapshot_url
        )

        # Prepend to memory buffer (newest first)
        self.records.insert(0, record)
        if len(self.records) > self.max_records:
            self.records.pop()

        # Append to CSV on disk
        try:
            with open(EVENT_LOG_CSV, "a", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow([
                    record.id, record.timestamp, record.mode, record.primary_class,
                    f"{record.confidence:.2f}", record.decision_status, record.action_taken,
                    record.audio_played, record.actuator_fired, record.hardware_mode,
                    record.snapshot_url or ""
                ])
        except Exception:
            pass  # Disk append best effort

        return record

    def get_recent_events(self, limit: int = 50) -> List[EventLogRecord]:
        """Returns the most recent events."""
        return self.records[:limit]

    def clear(self):
        """Clears the in-memory log."""
        self.records.clear()

