"""
Smart Bijuka — Tkinter monitoring dashboard.

SmartBijukaGUI: live camera feed, status bar, live stats and a scrolling
detection log. Camera capture runs on a background thread so the UI
never freezes.

Author: Pravash Singh | License: MIT
"""

from __future__ import annotations

import logging
import threading
import time
import tkinter as tk
from tkinter import filedialog, font, messagebox
from datetime import datetime
from typing import Optional

import cv2
from PIL import Image, ImageTk

import config
from detection import Threat, ThreatDetector, annotate

log = logging.getLogger("bijuka.gui")


class SmartBijukaGUI:
    """Main application window."""

    def __init__(self, camera_index: int = config.CAMERA_INDEX):
        self.camera_index = camera_index
        self.detector: Optional[ThreatDetector] = None

        self.cap: Optional[cv2.VideoCapture] = None
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._photo: Optional[ImageTk.PhotoImage] = None

        self._stats = {"frames": 0, "animals": 0, "humans": 0, "fps": 0.0}
        self._start_ts = time.time()

        self._build_ui()
        self._load_model_async()
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    # ----------------------------------------------------------------- UI --
    def _build_ui(self) -> None:
        t = config.THEME
        self.root = tk.Tk()
        self.root.title("Smart Bijuka — AI Crop Protection Dashboard")
        self.root.configure(bg=t["bg"])
        self.root.geometry("1100x720")

        header = tk.Frame(self.root, bg=t["bg"])
        header.pack(fill="x", padx=14, pady=(12, 6))
        tk.Label(
            header,
            text="🌾 Smart Bijuka",
            font=(t["font_family"], 20, "bold"),
            fg=t["accent"],
            bg=t["bg"],
        ).pack(side="left")
        tk.Label(
            header,
            text="AI-Powered Crop Protection  ·  v2.0",
            font=(t["font_family"], 10),
            fg=t["text_dim"],
            bg=t["bg"],
        ).pack(side="left", padx=12, pady=(8, 0))

        # -- video panel
        self.video_label = tk.Label(
            self.root,
            bg="#000",
            text="\n\n  Starting camera…",
            fg=t["text_dim"],
            font=(t["font_family"], 12),
        )
        self.video_label.pack(fill="both", expand=True, padx=14)

        # -- controls
        controls = tk.Frame(self.root, bg=t["bg"])
        controls.pack(fill="x", padx=14, pady=8)
        self.btn_start = self._btn(
            controls, "▶  Start Live", t["accent"], self.start_live
        )
        self.btn_stop = self._btn(controls, "■  Stop", t["danger"], self.stop_live)
        self.btn_image = self._btn(
            controls, "🖼  Detect from Image", t["warning"], self.detect_image
        )
        self.btn_open = self._btn(
            controls, "📂  Open Snapshots", t["text_dim"], self._open_snapshots
        )

        # -- stats + log side by side
        bottom = tk.Frame(self.root, bg=t["bg"])
        bottom.pack(fill="x", padx=14, pady=(0, 12))

        stats = tk.LabelFrame(
            bottom,
            text=" Live Stats ",
            bg=t["panel"],
            fg=t["text"],
            font=(t["font_family"], 10, "bold"),
        )
        stats.pack(side="left", fill="both", expand=True, padx=(0, 8))
        self.status_var = tk.StringVar(value="Loading model…")
        self.stats_var = tk.StringVar(
            value="Frames: 0   Animals: 0   Humans: 0   FPS: 0.0"
        )
        tk.Label(
            stats,
            textvariable=self.status_var,
            font=(t["font_family"], 11, "bold"),
            fg=t["accent"],
            bg=t["panel"],
            anchor="w",
        ).pack(fill="x", padx=10, pady=(6, 2))
        tk.Label(
            stats,
            textvariable=self.stats_var,
            font=(t["font_family"], 10),
            fg=t["text_dim"],
            bg=t["panel"],
            anchor="w",
        ).pack(fill="x", padx=10, pady=(0, 8))

        logf = tk.LabelFrame(
            bottom,
            text=" Detection Log ",
            bg=t["panel"],
            fg=t["text"],
            font=(t["font_family"], 10, "bold"),
        )
        logf.pack(side="left", fill="both", expand=True)
        self.log_text = tk.Text(
            logf,
            height=7,
            bg=t["panel"],
            fg=t["text_dim"],
            font=("Consolas", 9),
            state="disabled",
            insertbackground=t["text"],
            relief="flat",
        )
        self.log_text.pack(fill="both", expand=True, padx=6, pady=6)

    def _btn(self, parent, text: str, color: str, cmd) -> tk.Button:
        return tk.Button(
            parent,
            text=text,
            command=cmd,
            bg=color,
            fg="#0f172a" if color != "#94a3b8" else "#0f172a",
            font=(config.THEME["font_family"], 10, "bold"),
            relief="flat",
            padx=14,
            pady=6,
            cursor="hand2",
        )

    # ------------------------------------------------------------ actions --
    def _load_model_async(self) -> None:
        def worker():
            try:
                self.detector = ThreatDetector()
                self._set_status(
                    f"Model ready — waiting for camera", config.THEME["accent"]
                )
            except Exception as exc:  # noqa: BLE001
                log.exception("Model load failed")
                self._set_status(f"Model load FAILED: {exc}", config.THEME["danger"])
                messagebox.showerror(
                    "Smart Bijuka",
                    f"Failed to load YOLO model:\n{exc}\n\n"
                    "Run option [2] in Software.bat to install dependencies.",
                )

        threading.Thread(target=worker, daemon=True).start()

    def start_live(self) -> None:
        if self._running:
            return
        if self.detector is None:
            self._set_status(
                "Model still loading… try again in a moment", config.THEME["warning"]
            )
            return
        self.cap = cv2.VideoCapture(self.camera_index)
        if not self.cap.isOpened():
            messagebox.showerror(
                "Smart Bijuka",
                f"Cannot open camera {self.camera_index}.\n"
                "Check the connection or change CAMERA_INDEX in config.py.",
            )
            return
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, config.FRAME_WIDTH)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, config.FRAME_HEIGHT)
        self._running = True
        self._start_ts = time.time()
        self._thread = threading.Thread(target=self._camera_loop, daemon=True)
        self._thread.start()
        self._set_status("LIVE — monitoring for intruders", config.THEME["accent"])
        self._log("▶ Live monitoring started")

    def stop_live(self) -> None:
        self._running = False
        if self._thread:
            self._thread.join(timeout=2)
            self._thread = None
        if self.cap:
            self.cap.release()
            self.cap = None
        self._set_status("Stopped", config.THEME["warning"])
        self._log("■ Live monitoring stopped")

    def detect_image(self) -> None:
        if self.detector is None:
            messagebox.showinfo("Smart Bijuka", "Model is still loading — please wait.")
            return
        path = filedialog.askopenfilename(
            title="Select an image",
            filetypes=[("Images", "*.jpg *.jpeg *.png *.bmp *.webp")],
        )
        if not path:
            return
        frame = cv2.imread(path)
        if frame is None:
            messagebox.showerror("Smart Bijuka", "Could not read that image.")
            return
        threat = self.detector.analyse(frame)
        self._show_frame(annotate(frame, threat))
        self._apply_threat(threat, live=False)
        self._log(f"🖼 Image analysed: {threat.kind.upper()} ({threat.label})")

    def _open_snapshots(self) -> None:
        import os
        import subprocess
        import sys

        config.DETECTIONS_DIR.mkdir(parents=True, exist_ok=True)
        if sys.platform == "win32":
            os.startfile(str(config.DETECTIONS_DIR))
        elif sys.platform == "darwin":
            subprocess.Popen(["open", str(config.DETECTIONS_DIR)])
        else:
            subprocess.Popen(["xdg-open", str(config.DETECTIONS_DIR)])

    # ------------------------------------------------------------- camera --
    def _camera_loop(self) -> None:
        frame_i = 0
        last = time.time()
        while self._running and self.cap:
            ok, frame = self.cap.read()
            if not ok:
                self._log("⚠ Camera frame lost — stopping")
                self.root.after(0, self.stop_live)
                break
            frame_i += 1
            threat = Threat()
            if frame_i % config.PROCESS_EVERY_N_FRAMES == 0 and self.detector:
                threat = self.detector.analyse(frame)
                self.root.after(0, self._apply_threat, threat)
            shown = annotate(frame, threat)
            now = time.time()
            self._stats["frames"] += 1
            if now - last >= 1.0:
                self._stats["fps"] = config.PROCESS_EVERY_N_FRAMES / (now - last)
                last = now
                self.root.after(0, self._update_stats)
            self.root.after(0, self._show_frame, shown)

    def _show_frame(self, frame_bgr) -> None:
        rgb = cv2.cvtColor(cv2.resize(frame_bgr, (960, 540)), cv2.COLOR_BGR2RGB)
        img = Image.fromarray(rgb)
        self._photo = ImageTk.PhotoImage(img)
        self.video_label.configure(image=self._photo, text="")
        self.video_label.image = self._photo

    def _apply_threat(self, threat: Threat, live: bool = True) -> None:
        if threat.kind == "animal":
            self._stats["animals"] += 1
            self._set_status(
                f"🔴 ANIMAL INTRUSION — {threat.label.upper()} "
                f"({threat.confidence:.0%})",
                config.THEME["danger"],
            )
            self._log(
                f"🔴 [{datetime.now():%H:%M:%S}] {threat.label} "
                f"{threat.confidence:.0%}" + ("" if live else "  (image)")
            )
        elif threat.kind == "human":
            self._stats["humans"] += 1
            self._set_status("🟡 Human detected — crops safe", config.THEME["warning"])
        else:
            self._set_status("🟢 All clear — monitoring", config.THEME["accent"])
        self._update_stats()

    def _update_stats(self) -> None:
        s = self._stats
        elapsed = max(1e-6, time.time() - self._start_ts)
        self.stats_var.set(
            f"Frames: {s['frames']}   Animals: {s['animals']}   "
            f"Humans: {s['humans']}   FPS: {s['fps']:.1f}   "
            f"Uptime: {elapsed:.0f}s"
        )

    # ------------------------------------------------------------ helpers --
    def _set_status(self, text: str, color: str) -> None:
        self.root.after(
            0,
            lambda: (
                self.status_var.set(text),
                self.status_var.master.configure(fg=color),
            ),
        )

    def _log(self, line: str) -> None:
        def append():
            self.log_text.configure(state="normal")
            self.log_text.insert("1.0", line + "\n")
            self.log_text.configure(state="disabled")

        self.root.after(0, append)

    def _on_close(self) -> None:
        self.stop_live()
        self.root.destroy()

    # --------------------------------------------------------------- run --
    def run(self) -> None:
        self.root.mainloop()


def launch(camera_index: int = config.CAMERA_INDEX) -> None:
    """Create and run the dashboard."""
    SmartBijukaGUI(camera_index).run()
