import * as React from "react";
import {
  Upload,
  Camera,
  Play,
  Square,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Info,
  Radio,
  FileCheck2,
  Layers,
  Cpu,
  Move,
  History,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AppShell from "@/components/app/AppShell";
import { ScarecrowAnimator, type ScarecrowState } from "@/components/ScarecrowAnimator";
import { AudioController } from "@/components/AudioController";

const API_BASE = "http://127.0.0.1:8000";

interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface DetectionItem {
  class_id: number;
  class_name: string;
  confidence: number;
  box: BoundingBox;
  is_supported_animal: boolean;
  is_human: boolean;
}

interface DecisionResult {
  status_code: string;
  status_message: string;
  should_deter: boolean;
  trigger_animal?: string;
  trigger_confidence?: number;
  human_present: boolean;
  cooldown_remaining: number;
  action_taken: string;
}

interface ActuatorStatus {
  hardware_enabled: boolean;
  hardware_type: string;
  esp32_connected: boolean;
  last_command_sent?: string;
  last_command_status: string;
  ui_animation_state: string;
}

interface DetectionResponse {
  timestamp: string;
  mode: "image" | "camera";
  detections: DetectionItem[];
  decision: DecisionResult;
  actuator: ActuatorStatus;
  audio_played: boolean;
  audio_file?: string;
  annotated_image_url?: string;
  inference_time_ms: number;
}

interface SystemStatus {
  ai: {
    model_loaded: boolean;
    model_path: string;
    classes_count: number;
    load_error?: string;
  };
  camera: {
    is_running: boolean;
    camera_index: number;
    has_error: boolean;
    error_message?: string;
  };
  actuator: ActuatorStatus;
  audio: {
    selected_file: string;
    available_files: string[];
    audio_enabled: boolean;
    audio_volume: number;
    is_playing: boolean;
  };
  policy: {
    confidence_threshold: number;
    cooldown_seconds: number;
    supported_animal_classes: string[];
  };
}

export default function SmartBijukaDashboard() {
  const [activeTab, setActiveTab] = React.useState<"upload" | "camera">("upload");
  const [backendOnline, setBackendOnline] = React.useState<boolean | null>(null);
  const [systemStatus, setSystemStatus] = React.useState<SystemStatus | null>(null);
  const [allClassesInfo, setAllClassesInfo] = React.useState<any>(null);

  // Detection Results State
  const [lastDetection, setLastDetection] = React.useState<DetectionResponse | null>(null);
  const [scarecrowState, setScarecrowState] = React.useState<ScarecrowState>("monitoring");
  const [activityLogs, setActivityLogs] = React.useState<any[]>([]);

  // Mode 1: Image Upload State
  const [selectedImageFile, setSelectedImageFile] = React.useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = React.useState(false);

  // Mode 2: Camera State
  const [isCameraActive, setIsCameraActive] = React.useState(false);
  const [isCameraPolling, setIsCameraPolling] = React.useState(false);
  const cameraPollRef = React.useRef<NodeJS.Timeout | null>(null);

  // Settings State
  const [confThreshold, setConfThreshold] = React.useState<number>(0.5);
  const [cooldownSec, setCooldownSec] = React.useState<number>(6.0);
  const [hardwareEnabled, setHardwareEnabled] = React.useState<boolean>(false);
  const [esp32Ip, setEsp32Ip] = React.useState<string>("192.168.1.150");

  // Fetch initial system status
  const fetchStatus = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      if (res.ok) {
        const data: SystemStatus = await res.json();
        setSystemStatus(data);
        setBackendOnline(true);
        setConfThreshold(data.policy.confidence_threshold);
        setCooldownSec(data.policy.cooldown_seconds);
        setHardwareEnabled(data.actuator.hardware_enabled);
        setIsCameraActive(data.camera.is_running);
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  }, []);

  const fetchClasses = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/classes`);
      if (res.ok) {
        const data = await res.json();
        setAllClassesInfo(data);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchLogs = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/logs?limit=25`);
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data);
      }
    } catch {
      // silent
    }
  }, []);

  React.useEffect(() => {
    fetchStatus();
    fetchClasses();
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchClasses, fetchLogs]);

  // Handle Scarecrow state sync with detection decision
  const updateScarecrowFromDecision = (decision: DecisionResult) => {
    if (decision.should_deter) {
      setScarecrowState("deterrent_activated");
      // Auto-return to monitoring after 3 seconds
      setTimeout(() => setScarecrowState("monitoring"), 3200);
    } else if (decision.human_present) {
      setScarecrowState("human_detected");
      setTimeout(() => setScarecrowState("monitoring"), 3200);
    } else if (decision.status_code === "COOLDOWN_ACTIVE") {
      setScarecrowState("monitoring");
    } else {
      setScarecrowState("monitoring");
    }
  };

  // -------------------------------------------------------------------------
  // Mode 1: Image Upload Handlers
  // -------------------------------------------------------------------------
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setLastDetection(null);
    }
  };

  const handleRunImageDetection = async (simulateResponse: boolean = false) => {
    if (!selectedImageFile) {
      toast.warning("Please select or drop an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedImageFile);
    formData.append("simulate_response", String(simulateResponse));

    try {
      setIsAnalyzingImage(true);
      const res = await fetch(`${API_BASE}/api/detect/image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Detection failed");
      }

      const data: DetectionResponse = await res.json();
      setLastDetection(data);
      updateScarecrowFromDecision(data.decision);

      if (data.decision.status_code === "ANIMAL_DETERRENCE_ACTIVATED") {
        toast.error(data.decision.status_message);
      } else if (data.decision.status_code === "HUMAN_NO_REACTION") {
        toast.success(data.decision.status_message);
      } else {
        toast.info(data.decision.status_message);
      }

      fetchLogs();
    } catch (err: any) {
      toast.error(`Image Analysis Error: ${err.message}`);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // -------------------------------------------------------------------------
  // Mode 2: Camera Handlers
  // -------------------------------------------------------------------------
  const startCamera = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/camera/start`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Could not access camera");
      }
      setIsCameraActive(true);
      setScarecrowState("monitoring");
      toast.success("Laptop Camera initialized. Real-time vision scanning active.");
      startCameraPolling();
    } catch (err: any) {
      setScarecrowState("camera_unavailable");
      toast.error(`Webcam Error: ${err.message}`);
    }
  };

  const stopCamera = async () => {
    try {
      stopCameraPolling();
      await fetch(`${API_BASE}/api/camera/stop`, { method: "POST" });
      setIsCameraActive(false);
      setScarecrowState("monitoring");
      toast.info("Laptop Camera stopped.");
    } catch (err: any) {
      toast.error(`Error stopping camera: ${err.message}`);
    }
  };

  const startCameraPolling = () => {
    if (cameraPollRef.current) clearInterval(cameraPollRef.current);
    cameraPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/detect/frame`, { method: "POST" });
        if (res.ok) {
          const data: DetectionResponse = await res.json();
          setLastDetection(data);
          if (data.decision.should_deter || data.decision.human_present) {
            updateScarecrowFromDecision(data.decision);
          }
        }
      } catch {
        // frame drop handled gracefully
      }
    }, 750); // Poll detection frame every 750ms for smooth live bounding boxes
  };

  const stopCameraPolling = () => {
    if (cameraPollRef.current) {
      clearInterval(cameraPollRef.current);
      cameraPollRef.current = null;
    }
  };

  React.useEffect(() => {
    return () => stopCameraPolling();
  }, []);

  // -------------------------------------------------------------------------
  // Configuration Settings Handler
  // -------------------------------------------------------------------------
  const handleUpdatePolicy = async (updates: Partial<{
    confidence_threshold: number;
    cooldown_seconds: number;
    hardware_enabled: boolean;
    esp32_ip: string;
  }>) => {
    try {
      const res = await fetch(`${API_BASE}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        toast.success("Settings updated successfully.");
        fetchStatus();
      }
    } catch (err) {
      toast.error(`Failed to update config: ${err}`);
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#2d6a4f] via-[#387659] to-[#40916c] text-white shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center border border-white/20 shrink-0">
              <span className="text-2xl select-none">🌾</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Smart Bijuka</h1>
                <Badge className="bg-[#52b788] text-[#081c15] hover:bg-[#52b788] font-bold text-[11px]">
                  AI Agro-Defense v2.0
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                AI Animal Detection & Selective Deterrence · YOLOv8 Computer Vision · Human-Safe Policy
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Backend Connectivity Status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  backendOnline === true
                    ? "bg-emerald-300 animate-pulse"
                    : backendOnline === false
                    ? "bg-rose-400"
                    : "bg-amber-300"
                }`}
              />
              <span className="font-medium">
                {backendOnline === true
                  ? "FastAPI & YOLO Online"
                  : backendOnline === false
                  ? "Backend Disconnected"
                  : "Checking Backend..."}
              </span>
            </div>

            {/* Actuator Mode Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs">
              <Cpu className="h-3.5 w-3.5 text-emerald-200" />
              <span>
                Actuator:{" "}
                <strong>{hardwareEnabled ? "Physical ESP32" : "Safe Simulation"}</strong>
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchStatus}
              className="text-xs border-white/20 text-white bg-white/5 hover:bg-white/15"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Sync
            </Button>
          </div>
        </div>

        {/* Backend Warning if Offline */}
        {backendOnline === false && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                <strong>FastAPI backend is not running at http://127.0.0.1:8000.</strong> Please start the backend service
                with <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">python software/backend/main.py</code> or
                double-click <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">Launch_Website.bat</code>.
              </span>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Center Column: Detection Modes & Viewport (8 Columns) */}
          <div className="lg:col-span-8 space-y-5">
            <Card className="border-[#d6e4d2] bg-white/95 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-[#e5efe1]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base text-stone-800 font-bold flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#2d6a4f]" />
                      Intelligent Vision Feed & Bounding Boxes
                    </CardTitle>
                    <CardDescription className="text-xs text-stone-500">
                      Select detection mode: Process single field photograph or start laptop webcam
                    </CardDescription>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="flex items-center bg-[#f0f4ee] p-1 rounded-xl border border-[#d6e4d2]">
                    <button
                      onClick={() => {
                        setActiveTab("upload");
                        if (isCameraActive) stopCamera();
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === "upload"
                          ? "bg-white text-[#1b4332] shadow-xs"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload Image
                    </button>
                    <button
                      onClick={() => setActiveTab("camera")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === "camera"
                          ? "bg-white text-[#1b4332] shadow-xs"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Laptop Camera
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5">
                {/* ---------------- MODE A: UPLOAD IMAGE ---------------- */}
                {activeTab === "upload" && (
                  <div className="space-y-4">
                    {/* File Dropzone */}
                    <div className="border-2 border-dashed border-[#c1d6bd] hover:border-[#2d6a4f] rounded-2xl p-6 text-center transition-colors bg-[#fbfdfa]">
                      <input
                        type="file"
                        id="image-file-input"
                        accept="image/*"
                        onChange={handleImageFileSelect}
                        className="hidden"
                      />
                      <label htmlFor="image-file-input" className="cursor-pointer flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-[#e8f3e5] text-[#2d6a4f] flex items-center justify-center mb-2 shadow-xs">
                          <Upload className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-semibold text-stone-800">
                          {selectedImageFile ? selectedImageFile.name : "Click to select or drag & drop an image"}
                        </span>
                        <span className="text-xs text-stone-500 mt-1">
                          Supports high-resolution JPEG, PNG, WEBP from agricultural fields
                        </span>
                      </label>
                    </div>

                    {/* Image Viewport / Output */}
                    {imagePreviewUrl && (
                      <div className="space-y-3">
                        <div className="relative aspect-video max-h-[460px] w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-[#d6e4d2] shadow-inner">
                          <img
                            src={
                              lastDetection?.annotated_image_url
                                ? `${API_BASE}${lastDetection.annotated_image_url}`
                                : imagePreviewUrl
                            }
                            alt="Field Detection Frame"
                            className="w-full h-full object-contain"
                          />

                          {/* Top-left Mode watermark */}
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-mono flex items-center gap-1.5 border border-white/10">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span>
                              {lastDetection ? `YOLOv8 (${lastDetection.inference_time_ms}ms)` : "Image Staged"}
                            </span>
                          </div>
                        </div>

                        {/* Image Actions Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#f5f8f3] border border-[#dce8d8]">
                          <span className="text-xs text-stone-600">
                            <strong>Note:</strong> Still image analysis defaults to preview mode without firing physical actuators.
                          </span>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRunImageDetection(false)}
                              disabled={isAnalyzingImage}
                              className="text-xs border-[#2d6a4f] text-[#2d6a4f] hover:bg-[#2d6a4f]/10"
                            >
                              <FileCheck2 className="h-3.5 w-3.5 mr-1" />
                              Analyze Image
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleRunImageDetection(true)}
                              disabled={isAnalyzingImage}
                              className="text-xs bg-[#2d6a4f] hover:bg-[#1b4332] text-white"
                            >
                              <Zap className="h-3.5 w-3.5 mr-1 fill-white" />
                              Simulate Response
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------- MODE B: LAPTOP CAMERA ---------------- */}
                {activeTab === "camera" && (
                  <div className="space-y-4">
                    {/* Camera Viewport */}
                    <div className="relative aspect-video max-h-[460px] w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-[#d6e4d2] shadow-inner">
                      {isCameraActive ? (
                        <img
                          src={`${API_BASE}/api/camera/stream`}
                          alt="Live Webcam Inference Feed"
                          className="w-full h-full object-contain"
                          onError={() => {
                            toast.error("Camera stream disconnected.");
                            setIsCameraActive(false);
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-stone-400">
                          <Camera className="h-12 w-12 stroke-[1.2] mb-3 text-stone-500" />
                          <h3 className="text-sm font-semibold text-stone-300">Webcam Inactive</h3>
                          <p className="text-xs text-stone-500 max-w-sm mt-1">
                            Click 'Start Camera' below to request laptop camera access and run live YOLOv8 selective deterrence.
                          </p>
                        </div>
                      )}

                      {/* Live overlay tag */}
                      {isCameraActive && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-mono flex items-center gap-2 border border-white/10">
                          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                          <span>LIVE WEBCAM INFERENCE (YOLOv8)</span>
                        </div>
                      )}
                    </div>

                    {/* Camera Controls Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#f5f8f3] border border-[#dce8d8]">
                      <div className="flex items-center gap-2">
                        {!isCameraActive ? (
                          <Button
                            size="sm"
                            onClick={startCamera}
                            className="text-xs bg-[#2d6a4f] hover:bg-[#1b4332] text-white"
                          >
                            <Play className="h-3.5 w-3.5 mr-1 fill-white" />
                            Start Camera
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={stopCamera}
                            className="text-xs"
                          >
                            <Square className="h-3.5 w-3.5 mr-1 fill-white" />
                            Stop Camera
                          </Button>
                        )}

                        <span className="text-xs text-stone-600">
                          {isCameraActive ? "Continuous deterrence logic active" : "Camera offline"}
                        </span>
                      </div>

                      <div className="text-[11px] text-stone-500">
                        Supports 720p / 1080p laptop integrated webcams and USB cameras
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Detection Results Panel */}
            <Card className="border-[#d6e4d2] bg-white/95 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-[#e5efe1]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-[#2d6a4f]" />
                    <CardTitle className="text-sm font-bold text-stone-800">
                      Real-time Threat & Decision Summary
                    </CardTitle>
                  </div>
                  {lastDetection && (
                    <Badge variant="outline" className="text-[11px] font-mono text-stone-600">
                      {lastDetection.timestamp}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {lastDetection ? (
                  <div className="space-y-4">
                    {/* Central Decision Banner */}
                    <div
                      className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                        lastDetection.decision.status_code === "ANIMAL_DETERRENCE_ACTIVATED"
                          ? "bg-rose-50 border-rose-200 text-rose-900"
                          : lastDetection.decision.status_code === "HUMAN_NO_REACTION"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-stone-50 border-stone-200 text-stone-800"
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {lastDetection.decision.status_code === "ANIMAL_DETERRENCE_ACTIVATED" ? (
                          <AlertTriangle className="h-5 w-5 text-rose-600 animate-bounce" />
                        ) : lastDetection.decision.status_code === "HUMAN_NO_REACTION" ? (
                          <ShieldCheck className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Info className="h-5 w-5 text-stone-500" />
                        )}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="text-xs font-bold uppercase tracking-wide">
                          {lastDetection.decision.status_code.replace(/_/g, " ")}
                        </div>
                        <div className="text-sm font-semibold">
                          {lastDetection.decision.status_message}
                        </div>
                        <div className="text-xs opacity-85">
                          <strong>Action Taken:</strong> {lastDetection.decision.action_taken}
                        </div>
                      </div>
                    </div>

                    {/* Detected Items Pill List */}
                    <div>
                      <div className="text-xs font-semibold text-stone-700 mb-2">
                        Detected Objects ({lastDetection.detections.length}):
                      </div>
                      {lastDetection.detections.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {lastDetection.detections.map((d, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
                                d.is_human
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : d.is_supported_animal
                                  ? "bg-rose-100 text-rose-800 border-rose-300"
                                  : "bg-stone-100 text-stone-700 border-stone-200"
                              }`}
                            >
                              <span>{d.class_name}</span>
                              <span className="font-mono text-[11px] opacity-80">
                                {(d.confidence * 100).toFixed(0)}%
                              </span>
                              {d.is_human && <span className="text-[10px] uppercase font-bold">(Safe)</span>}
                              {d.is_supported_animal && (
                                <span className="text-[10px] uppercase font-bold">(Target Animal)</span>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-stone-500 italic">No objects detected above threshold.</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-stone-500">
                    No detection events yet. Select an image or activate the webcam to monitor.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audio Voice Controller Card */}
            <AudioController
              apiBaseUrl={API_BASE}
              selectedFile={systemStatus?.audio.selected_file || "animal_alert.mp3"}
              availableFiles={systemStatus?.audio.available_files || ["animal_alert.mp3"]}
              audioEnabled={systemStatus?.audio.audio_enabled ?? true}
              volume={systemStatus?.audio.audio_volume ?? 0.85}
              onRefresh={fetchStatus}
            />
          </div>

          {/* Right Column: Scarecrow Animation & Hardware Hub (4 Columns) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Scarecrow Graphical Actuation Panel */}
            <Card className="border-[#d6e4d2] bg-white/95 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-[#e5efe1]">
                <CardTitle className="text-sm font-bold text-stone-800 flex items-center justify-between">
                  <span>Smart Bijuka Actuator State</span>
                  <Badge variant="outline" className="text-[10px] text-stone-600 font-normal">
                    {hardwareEnabled ? "Physical Servo Armed" : "Visual Simulation"}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-stone-500">
                  Scarecrow arm movement & optical scare triggers only for verified animal intruders
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <ScarecrowAnimator
                  state={scarecrowState}
                  detectedLabel={lastDetection?.decision.trigger_animal}
                  confidence={lastDetection?.decision.trigger_confidence}
                  hardwareEnabled={hardwareEnabled}
                  isSimulated={!hardwareEnabled}
                />

                {/* Manual Actuator Trigger for Demonstrations */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setScarecrowState("deterrent_activated");
                      await fetch(`${API_BASE}/api/actuator/test`, { method: "POST" });
                      setTimeout(() => setScarecrowState("monitoring"), 3000);
                      toast.success("Manual scarecrow arm test triggered");
                    }}
                    className="text-xs w-full border-[#2d6a4f] text-[#2d6a4f] hover:bg-[#2d6a4f]/10"
                  >
                    <Move className="h-3.5 w-3.5 mr-1" />
                    Test Arm Motion
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setScarecrowState("monitoring");
                      fetch(`${API_BASE}/api/actuator/reset`, { method: "POST" });
                    }}
                    className="text-xs text-stone-500 hover:text-stone-800"
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actuator & Policy Threshold Controls */}
            <Card className="border-[#d6e4d2] bg-white/95 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-[#e5efe1]">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-[#2d6a4f]" />
                  <CardTitle className="text-sm font-bold text-stone-800">Deterrence Tuning & Hardware</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* Confidence Threshold */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-700">Confidence Threshold:</span>
                    <span className="font-mono text-stone-600">{(confThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[confThreshold]}
                    min={0.2}
                    max={0.9}
                    step={0.05}
                    onValueChange={(val) => {
                      setConfThreshold(val[0]);
                      handleUpdatePolicy({ confidence_threshold: val[0] });
                    }}
                  />
                  <p className="text-[11px] text-stone-500">
                    Deterrence triggers only when animal confidence meets or exceeds this score.
                  </p>
                </div>

                <Separator />

                {/* Cooldown Timer */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-700">Cooldown Timer:</span>
                    <span className="font-mono text-stone-600">{cooldownSec}s</span>
                  </div>
                  <Slider
                    value={[cooldownSec]}
                    min={2}
                    max={30}
                    step={1}
                    onValueChange={(val) => {
                      setCooldownSec(val[0]);
                      handleUpdatePolicy({ cooldown_seconds: val[0] });
                    }}
                  />
                  <p className="text-[11px] text-stone-500">
                    Prevents repeated acoustic and servo cycling for the same intruder across consecutive frames.
                  </p>
                </div>

                <Separator />

                {/* Physical Hardware Integration Toggle */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold text-stone-800">Physical ESP32 & Servo Link</Label>
                      <p className="text-[11px] text-stone-500">
                        {hardwareEnabled
                          ? "Commands sent to ESP32 over Wi-Fi / Serial"
                          : "Disabled (Safe Simulation Mode)"}
                      </p>
                    </div>
                    <Switch
                      checked={hardwareEnabled}
                      onCheckedChange={(checked) => {
                        setHardwareEnabled(checked);
                        handleUpdatePolicy({ hardware_enabled: checked });
                        if (checked) {
                          toast.warning("Physical hardware commands enabled. Ensure ESP32 is powered and reachable.");
                        } else {
                          toast.info("Returned to safe simulation mode.");
                        }
                      }}
                    />
                  </div>

                  {hardwareEnabled && (
                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-600">ESP32 IP:</span>
                        <input
                          type="text"
                          value={esp32Ip}
                          onChange={(e) => setEsp32Ip(e.target.value)}
                          onBlur={() => handleUpdatePolicy({ esp32_ip: esp32Ip })}
                          className="px-2 py-1 rounded border border-blue-300 font-mono text-xs w-32 text-right"
                        />
                      </div>
                      <p className="text-[11px] text-blue-700">
                        Endpoint: <code>http://{esp32Ip}/trigger</code>
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Model & Supported Animal Classes Modal */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full text-xs border-stone-200 text-stone-700">
                      <HelpCircle className="h-3.5 w-3.5 mr-1 text-stone-500" />
                      View Supported Animal Classes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-base text-stone-800">YOLOv8 Model Class Inspection</DialogTitle>
                      <DialogDescription className="text-xs text-stone-500">
                        Smart Bijuka reads actual class names directly from the loaded model weights.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2 text-xs">
                      <div>
                        <h4 className="font-semibold text-stone-800 mb-1">Configured Animal Deterrence Classes:</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {systemStatus?.policy.supported_animal_classes.map((cls) => (
                            <Badge key={cls} className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-mono">
                              {cls}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold text-stone-800 mb-1">Human Safety Rule:</h4>
                        <p className="text-stone-600">
                          Class <code className="bg-stone-100 px-1 py-0.5 rounded font-bold">person</code> is strictly
                          suppressed from all acoustic and physical deterrence to protect farm workers and farmers.
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold text-stone-800 mb-1">Note on Wild Boar & Custom Species:</h4>
                        <p className="text-stone-600">
                          Pretrained YOLOv8 (COCO dataset) classifies general wildlife like birds, horses, cows, sheep,
                          dogs, and bears. For specific wild species like <em>wild boar</em>, fine-tuning with a custom
                          agricultural dataset can be integrated seamlessly by replacing the weights path in{" "}
                          <code>config.py</code>.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* System Activity Log */}
            <Card className="border-[#d6e4d2] bg-white/95 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-[#e5efe1]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-[#2d6a4f]" />
                    <CardTitle className="text-sm font-bold text-stone-800">System Activity Log</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      fetch(`${API_BASE}/api/logs`, { method: "DELETE" }).then(() => fetchLogs());
                    }}
                    className="text-[11px] h-6 px-2 text-stone-500 hover:text-stone-800"
                  >
                    Clear
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-3 max-h-72 overflow-y-auto space-y-2">
                {activityLogs.length > 0 ? (
                  activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl border border-stone-100 bg-[#fbfdfa] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-stone-500">{log.timestamp}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            log.decision_status === "ANIMAL_DETERRENCE_ACTIVATED"
                              ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                              : log.decision_status === "HUMAN_NO_REACTION"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "text-stone-600"
                          }`}
                        >
                          {log.decision_status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <div className="font-semibold text-stone-800 flex items-center justify-between">
                        <span>
                          Target: {log.primary_class} ({(log.confidence * 100).toFixed(0)}%)
                        </span>
                        <span className="text-[10px] text-stone-500">{log.mode}</span>
                      </div>

                      <p className="text-[11px] text-stone-600">{log.action_taken}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-stone-400">Activity log is empty.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
