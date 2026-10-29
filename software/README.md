# Smart Bijuka software

This repository contains three software surfaces:

- **FastAPI backend** (`backend/`): local image/webcam inference, selective-response policy, audio and actuator controls, annotated snapshots, and in-memory/CSV event logging.
- **Python desktop application** (`src/`): a separate webcam/image detector with a Tkinter interface.
- **Astro/React web UI** (`Smart_Bijuka_Website/`): an interactive visual prototype populated by local mock fixtures. It is not currently connected to the FastAPI API or a configured Supabase database.

## Start from Windows

Double-click `START_SOFTWARE.bat` in the repository root to open the software menu. Select the desktop app or web portal; the web option installs the locked npm dependencies when needed and opens the browser after the development server starts. The web portal requires Node.js 22.23.4 or later.

## Start the FastAPI backend

From the repository root in PowerShell:

```powershell
py -3.10 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r software\backend\requirements.txt
python -m uvicorn main:app --app-dir software\backend --host 127.0.0.1 --port 8000
```

Use `http://127.0.0.1:8000/docs` to inspect and call the API. Webcam operations require a camera attached to the backend host. The default YOLOv8n weights may be downloaded the first time the model loads.

## Start the web interface

```powershell
cd software\Smart_Bijuka_Website
npm ci
npm run dev
```

Open `http://localhost:4321`. The site demonstrates the dashboard experience; its displayed telemetry is mock data, not live API or IoT data.

## Run the desktop detector

From the repository root:

```powershell
python -m pip install -r requirements.txt
python software\src\app.py --check
python software\src\app.py --image path\to\test-image.jpg
```

## Safety and integration status

The backend defaults to simulated actuator behavior. The firmware in `firmware/` targets ESP8266, while the separate ESP32 integration note describes a different controller. Verify the actual board and wiring before enabling physical actuation. Keep the local-development API off the public internet; authentication and production hardening are not implemented.
