import * as React from "react";
import {
  CameraOff,
  Aperture,
  Volume2,
  RefreshCw,
  ShieldCheck,
  Radar,
  Move,
  SunMedium,
  BatteryCharging,
  Wifi,
  RotateCcw,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import AppShell from "@/components/app/AppShell";
import { DemoDataChip, MetricLabel, PageHeader, SeverityBadge, StatusDot } from "@/components/app/common";
import { CLASSIFICATION_LABELS, DETERRENT_LABELS, SNAPSHOT_URLS, devices } from "@/lib/data/mock";

const primary = devices[0];

interface FeedDetection {
  id: number;
  frame: "night" | "day";
  label: string;
  confidence: number;
  zone: string;
  severity: "low" | "medium" | "high" | "critical";
  deterrent: string;
  intensity: number;
  box: { top: string; left: string; width: string; height: string };
  servo: number;
}

const feedDetections: FeedDetection[] = [
  {
    id: 1,
    frame: "night",
    label: CLASSIFICATION_LABELS.wild_boar,
    confidence: 0.94,
    zone: "Zone B",
    severity: "high",
    deterrent: DETERRENT_LABELS.boar_distress,
    intensity: 4,
    box: { top: "46%", left: "30%", width: "30%", height: "34%" },
    servo: 112,
  },
  {
    id: 2,
    frame: "day",
    label: CLASSIFICATION_LABELS.stray_cattle,
    confidence: 0.91,
    zone: "Zone A",
    severity: "medium",
    deterrent: DETERRENT_LABELS.cattle_herd_tone,
    intensity: 3,
    box: { top: "34%", left: "44%", width: "34%", height: "48%" },
    servo: 78,
  },
];

type FeedState = "connecting" | "live" | "error";

const responseSteps = [
  "PIR trigger captured",
  "Frame sent to YOLOv8 classifier",
  "Class + confidence resolved",
  "Servo swept toward target",
  "Audio deterrent fired",
];

export default function LiveMonitorPage() {
  const [feedState, setFeedState] = React.useState<FeedState>("connecting");
  const [detectionIdx, setDetectionIdx] = React.useState(0);
  const [step, setStep] = React.useState(0);
  const [armed, setArmed] = React.useState(true);
  const [ir, setIr] = React.useState(true);
  const [log, setLog] = React.useState<{ time: string; text: string }[]>([]);

  const detection = feedDetections[detectionIdx];

  // Simulated connect cycle, then rotate between detections.
  React.useEffect(() => {
    const connect = setTimeout(() => setFeedState("live"), 1600);
    return () => clearTimeout(connect);
  }, []);

  React.useEffect(() => {
    if (feedState !== "live") return;
    const rotate = setInterval(() => {
      setDetectionIdx((i) => (i + 1) % feedDetections.length);
      setStep(0);
    }, 9000);
    return () => clearInterval(rotate);
  }, [feedState]);

  React.useEffect(() => {
    if (feedState !== "live") return;
    if (step >= responseSteps.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 700);
    return () => clearTimeout(t);
  }, [feedState, step]);

  const pushLog = (text: string) =>
    setLog((prev) =>
      [
        { time: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }), text },
        ...prev,
      ].slice(0, 8)
    );

  const retry = () => {
    setFeedState("connecting");
    setTimeout(() => setFeedState("live"), 1600);
  };

  return (
    <AppShell title="Live Monitor" subtitle={`${primary.name} · ${primary.camera.resolution}`}>
      <div className="mx-auto max-w-7xl">
        <PageHeader description="Watch the field through the Bijuka's eyes — detections, classification and deterrent response in near-real time.">
          <DemoDataChip />
        </PageHeader>

        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-chart-2/40 bg-chart-2/5 px-4 py-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-chart-2" aria-hidden />
          <p>
            <span className="font-medium text-foreground">Currently demonstrated:</span>{" "}
            capture-on-trigger frames with on-device classification and automatic
            deterrent response, replayed here in near-real time. Continuous live video
            streaming is on the roadmap (see Devices &amp; Fields → Roadmap).
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Feed */}
          <section id="camera-feed" aria-label="Camera feed" className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden py-0 gap-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <StatusDot state={feedState === "live" ? "ok" : feedState === "error" ? "error" : "warn"} pulse={feedState === "live"} />
                  <p className="text-sm font-medium">
                    {feedState === "live" ? "Feed active" : feedState === "connecting" ? "Connecting to ESP32-CAM…" : "Camera unreachable"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] font-normal">
                    {detection.frame === "night" ? "IR night mode" : "Day mode"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => {
                      if (feedState !== "live") {
                        toast.error("Camera offline — cannot capture");
                        return;
                      }
                      toast.success("Snapshot saved to event log");
                      pushLog("Manual snapshot captured");
                    }}
                  >
                    <Aperture className="h-3.5 w-3.5" /> Snapshot
                  </Button>
                </div>
              </div>

              <div className="relative aspect-video bg-foreground">
                {feedState === "connecting" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted">
                    <Skeleton className="absolute inset-0 rounded-none" />
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
                      <p className="text-sm font-medium text-muted-foreground">
                        Establishing camera link…
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Waking ESP32-CAM from PIR standby
                      </p>
                    </div>
                  </div>
                )}

                {feedState === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted p-6 text-center">
                    <CameraOff className="h-8 w-8 text-destructive" aria-hidden />
                    <p className="text-sm font-semibold">Camera stream unavailable</p>
                    <p className="max-w-sm text-xs text-muted-foreground">
                      The device stopped responding on the video channel. PIR and audio
                      deterrence continue to operate independently on-device.
                    </p>
                    <Button size="sm" variant="outline" onClick={retry}>
                      <RotateCcw className="h-4 w-4" /> Retry connection
                    </Button>
                  </div>
                )}

                {feedState === "live" && (
                  <>
                    <img
                      src={SNAPSHOT_URLS[detection.frame]}
                      alt={`Field camera frame showing ${detection.label}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    {/* Detection overlay */}
                    <div
                      key={detection.id}
                      className="absolute rounded-md border-2 border-chart-5 shadow-[0_0_0_9999px_rgba(0,0,0,0.08)] transition-all duration-700 animate-in fade-in zoom-in-95"
                      style={detection.box}
                    >
                      <span className="absolute -top-6 left-0 rounded bg-chart-5 px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-foreground">
                        {detection.label} {Math.round(detection.confidence * 100)}%
                      </span>
                    </div>
                    {/* HUD corners */}
                    <div className="pointer-events-none absolute inset-3">
                      <div className="flex items-start justify-between text-[11px] font-medium text-white/90 drop-shadow">
                        <span className="rounded bg-black/50 px-1.5 py-0.5">
                          CAM-01 · {detection.zone}
                        </span>
                        <span className="rounded bg-black/50 px-1.5 py-0.5 tabular-nums">
                          {new Date().toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between text-[11px] font-medium text-white/90 drop-shadow">
                        <span className="rounded bg-black/50 px-1.5 py-0.5">
                          YOLOv8n · conf {Math.round(detection.confidence * 100)}%
                        </span>
                        <span className="rounded bg-black/50 px-1.5 py-0.5">
                          Servo {detection.servo}° · IR {ir ? "ON" : "OFF"}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch id="armed" checked={armed} onCheckedChange={(v) => { setArmed(v); toast.info(v ? "System armed" : "System disarmed — deterrence paused"); }} />
                    <Label htmlFor="armed" className="text-xs">Armed</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="ir" checked={ir} onCheckedChange={(v) => { setIr(v); pushLog(v ? "IR illumination enabled" : "IR illumination disabled"); }} />
                    <Label htmlFor="ir" className="text-xs">IR illumination</Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (feedState !== "live") {
                        toast.error("Device offline — test unavailable");
                        return;
                      }
                      toast.success(`Deterrent test fired: ${detection.deterrent} (L2)`);
                      pushLog(`Manual deterrent test · ${detection.deterrent} L2`);
                    }}
                  >
                    <Volume2 className="h-4 w-4" /> Test deterrent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFeedState("error");
                      toast.error("Simulated camera fault — use Retry to reconnect");
                    }}
                  >
                    <CameraOff className="h-4 w-4" /> Simulate fault
                  </Button>
                </div>
              </div>
            </Card>

            {/* Activity log */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Session Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                {log.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-5 text-center">
                    <p className="text-sm text-muted-foreground">
                      No manual actions yet this session. Automatic events appear in{" "}
                      <a href="/history" className="font-medium text-primary hover:underline">History &amp; Events</a>.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {log.map((l, i) => (
                      <li key={i} className="flex gap-3 font-mono text-muted-foreground">
                        <span className="tabular-nums text-foreground/70">{l.time}</span>
                        <span>{l.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Side panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Detection</CardTitle>
                <CardDescription>YOLOv8 on-device classification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {feedState !== "live" ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold">{detection.label}</p>
                      <SeverityBadge severity={detection.severity} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <MetricLabel>Confidence</MetricLabel>
                        <span className="font-semibold">{Math.round(detection.confidence * 100)}%</span>
                      </div>
                      <Progress value={detection.confidence * 100} className="mt-1.5 h-2" />
                    </div>
                    <Separator />
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt><MetricLabel>Zone</MetricLabel></dt>
                        <dd className="mt-1 font-medium">{detection.zone}</dd>
                      </div>
                      <div>
                        <dt><MetricLabel>Servo Angle</MetricLabel></dt>
                        <dd className="mt-1 font-medium">{detection.servo}°</dd>
                      </div>
                      <div>
                        <dt><MetricLabel>Deterrent</MetricLabel></dt>
                        <dd className="mt-1 font-medium">{detection.deterrent}</dd>
                      </div>
                      <div>
                        <dt><MetricLabel>Intensity</MetricLabel></dt>
                        <dd className="mt-1 font-medium">Level {detection.intensity} / 5</dd>
                      </div>
                    </dl>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Status</CardTitle>
                <CardDescription>Automatic sequence for the current detection</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2.5">
                  {responseSteps.map((s, i) => {
                    const done = feedState === "live" && i < step;
                    const active = feedState === "live" && i === step;
                    return (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors",
                            done
                              ? "bg-primary text-primary-foreground"
                              : active
                                ? "bg-chart-2/30 text-foreground"
                                : "bg-muted text-muted-foreground"
                          )}
                        >
                          {done ? "✓" : i + 1}
                        </span>
                        <span className={cn(done ? "text-foreground" : "text-muted-foreground", active && "font-medium text-foreground")}>
                          {s}
                          {active && <span className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-chart-2" />}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                {feedState === "live" && step >= responseSteps.length && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                    Response complete — target deterred
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Telemetry</CardTitle>
                <CardDescription>SB-01 · live values</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground"><Radar className="h-4 w-4" aria-hidden /> PIR sensor</span>
                    <span className="flex items-center gap-1.5 font-medium"><StatusDot state="ok" pulse /> Active</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground"><Move className="h-4 w-4" aria-hidden /> Servo (180°)</span>
                    <span className="font-medium">{detection.servo}° · OK</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground"><BatteryCharging className="h-4 w-4" aria-hidden /> Battery</span>
                    <span className="font-medium">{primary.telemetry.batteryPercent}% · {primary.telemetry.batteryVoltage} V</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground"><SunMedium className="h-4 w-4" aria-hidden /> Solar</span>
                    <span className="font-medium">{primary.telemetry.solarChargingW} W in</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground"><Wifi className="h-4 w-4" aria-hidden /> Signal</span>
                    <span className="font-medium">{primary.telemetry.wifiRssi} dBm</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
