# Smart Bijuka | HackCult '26

**Track:** Green Energy & Sustainability

**Team:** Pravash Singh (individual participant)

**Status:** Working software baseline and physical prototype; full field integration and validation are still in progress.

Smart Bijuka is an AI-assisted crop-protection prototype. It analyzes camera images with YOLOv8, applies a class/confidence/cooldown policy, and can request an audio and arm-movement response. A person-only detection returns no deterrence. The current policy checks for a supported animal first, so a mixed person-and-animal frame may still authorize deterrence; this behavior needs an explicit safety decision and test before claiming a blanket human-presence interlock. The design is solar-compatible, but power autonomy and field effectiveness have not yet been measured.

> **Prototype status matters:** This repository contains multiple software generations and hardware references. The API can analyze uploaded images and webcam frames, record local events, and simulate a deterrent response. Physical actuation is opt-in. The pitch deck reports that individual hardware components have been tested, while complete camera-to-controller integration and field validation remain in progress. Do not present planned cloud, mobile-alert, or end-to-end features as completed.

## What is implemented

- **Detection and policy:** YOLOv8 inference, class/confidence filtering, human-safe handling, and a cooldown for repeated animal detections.
- **FastAPI backend:** Image upload and webcam-frame detection, annotated snapshots, system status/configuration, audio controls, actuator test/reset, and recent event endpoints.
- **Safe default:** Physical hardware is disabled by default; API-triggered actuator actions use simulation until explicitly enabled and configured.
- **Local records:** Detection events are held in a process-local recent-event buffer and appended to CSV. This is not a deployed database or cloud synchronization service.
- **Interfaces:** A Python desktop monitor and an Astro web interface are included. The web interface currently uses local mock fixtures and is not wired to the FastAPI event API.
- **Hardware:** Firmware and wiring documentation are included for the prototype. The repository has both ESP8266 and ESP32 references; confirm the actual board, pinout, and firmware before connecting hardware.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the architecture diagram, current event model, proposed database schema, API surface, and scalability boundaries.

## Run the software

### Requirements

- Python 3.10 or later
- A webcam for live camera mode; image-upload mode does not require one
- Internet access on first model load if the YOLOv8n weight file is not already present
- Node.js 20 or later only if running the web UI

### Start the FastAPI detection backend (Windows PowerShell)

From the repository root:

```powershell
py -3.10 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r software\backend\requirements.txt
python -m uvicorn main:app --app-dir software\backend --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs` for the interactive API documentation. The first model load may download YOLOv8n weights. The webcam endpoints require a camera available to the backend host.

Useful endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/status` | Model, camera, actuator, audio, and policy status |
| `GET` | `/api/classes` | Loaded model classes and configured animal labels |
| `POST` | `/api/detect/image` | Analyze an uploaded image; physical response is off by default |
| `POST` | `/api/camera/start` | Start webcam capture |
| `POST` | `/api/detect/frame` | Analyze the latest webcam frame |
| `GET` | `/api/camera/stream` | Stream annotated MJPEG while the webcam is running |
| `GET` | `/api/logs` | Read recent process-local events |

### Run the Python desktop monitor

Install the root dependencies and use an image for a no-camera smoke test:

```powershell
python -m pip install -r requirements.txt
python software\src\app.py --check
python software\src\app.py --image path\to\your\test-image.jpg
```

The desktop application can also open a webcam when launched without `--image`.

### Run the web interface

```powershell
cd software\Smart_Bijuka_Website
npm ci
npm run dev
```

Open `http://localhost:4321`. This UI is a visual prototype backed by local mock data; it is not currently connected to the FastAPI service or a cloud database.

### Run the available tests

From the repository root, after installing the Python dependencies:

```powershell
python tests\test_detection.py
```

The acceptance tests in `tests\test_acceptance.py` cover decision policy and simulation behavior and run in the checked-in CI workflow. Tests use synthetic detection records; they do not establish field accuracy or end-to-end hardware reliability.

## Hardware and safety

- The backend defaults to `hardware_enabled = false`. Keep this setting unless the physical controller has been checked and is intentionally connected.
- Verify the actual microcontroller generation and firmware. `firmware/` targets ESP8266, while some integration notes describe ESP32.
- Use a separate, correctly rated power supply for the servo and a common ground as required by the actual circuit. Do not power a high-current servo from a microcontroller pin or regulator.
- The REST/serial actuator paths have not been independently field-validated in the complete prototype.
- The API is configured for local development. Do not expose it directly to the public internet: authentication, authorization, rate limits, and production hardening are not implemented.

See [firmware/README.md](firmware/README.md), [hardware/README.md](hardware/README.md), and [docs/HARDWARE_INTEGRATION_ESP32.md](docs/HARDWARE_INTEGRATION_ESP32.md). Reconcile their board-specific instructions with the hardware actually used before powering the prototype.

## HackCult Phase 1 submission checklist

The event information supplied for this project asks for a public GitHub repository, an unlisted YouTube walkthrough, and a pitch deck.

| Deliverable | Included/status |
|---|---|
| Public source repository | [Hackcult_Hackathon_IIT_Gandhinagar](https://github.com/pravashsingh775/Hackcult_Hackathon_IIT_Gandhinagar) |
| Comprehensive README and setup steps | Included here |
| Architecture diagram and data model | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Pitch deck | [docs/HackCult26-Smart-Bijuka-Pitch-Deck.pptx](docs/HackCult26-Smart-Bijuka-Pitch-Deck.pptx) |
| Unlisted YouTube walkthrough | **Still required.** Record the running build with dynamic inputs, upload as unlisted, then add its URL to the deck and submission form. |
| Final deck links | The GitHub link is included. Add the unlisted video URL to the final slide after recording. |

The supplied event listing gives **4 November 2026, 6:30 PM IST** as the Phase 1 deadline in its dates panel, but another section says 11:59 PM. Verify the deadline and current submission instructions on the official event portal. The registration deadline shown, 26 October 2026, has passed.

## Evidence and claims

The included pitch deck is explicit that this is a prototype: its 87% cow result is one sample-image confidence, not an accuracy metric; continuous solar runtime, full integration, and field effectiveness remain unvalidated. Do not reuse the large accuracy, latency, crop-loss, or habituation figures in older project documentation as measured HackCult results unless reproducible test data and methodology are available.

Existing small prototype clips and photos are historical project evidence, not the required HackCult walkthrough. See [assets/images/](assets/images/) and [assets/demo/](assets/demo/).

## Repository map

```text
assets/                       Prototype photos, diagrams, and selected clips
docs/
  ARCHITECTURE.md             Current architecture and event-data design
  PHASE1_SUBMISSION.md        Final submission checklist and recording outline
  HackCult26-...pptx          Submitted pitch deck
firmware/                     ESP8266 firmware
hardware/                     Prototype wiring and hardware documentation
software/backend/             FastAPI + YOLO detection and decision services
software/src/                 Python desktop detection application
software/Smart_Bijuka_Website/ Astro/React visual prototype (mock data)
tests/                        Detection and policy tests
```

## Track fit

Smart Bijuka is submitted under **Green Energy & Sustainability**: it addresses crop protection and is designed around solar-assisted field deployment. The solar design and sustainability rationale are part of the prototype; energy use, battery runtime, crop-loss reduction, and environmental impact still need controlled measurements.

## License

This project is distributed under the MIT License. See [LICENSE](LICENSE).
