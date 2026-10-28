import { useEffect, useState } from "react";
import {
  Radio,
  Volume2,
  VolumeX,
  Move,
  Play,
  Square,
  RotateCcw,
  BatteryCharging,
  Wifi,
  Radar,
  ScanEye,
  CircleDot,
  Cat,
  Dog,
  Siren,
  AudioWaveform,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CAMERA_FEEDS, DETERRENT_SOUNDS } from "@/data/sampleData";

const soundIcons: Record<string, typeof Cat> = {
  Cat,
  Dog,
  Siren,
  AudioWaveform,
  Megaphone,
};

type FeedId = "live" | "boar" | "farmer";

interface Detection {
  species: string;
  isHuman: boolean;
  confidence: number;
  zone: string;
  recommended: string;
  // bounding box in % of frame
  box: { top: number; left: number; width: number; height: number };
}

const FEEDS: Record<FeedId, { src: string; label: string; detection: Detection }> = {
  live: {
    src: CAMERA_FEEDS.liveNight,
    label: "Live · IR night view",
    detection: {
      species: "Deer",
      isHuman: false,
      confidence: 96,
      zone: "North paddy",
      recommended: "tiger",
      box: { top: 30, left: 34, width: 30, height: 48 },
    },
  },
  boar: {
    src: CAMERA_FEEDS.boar,
    label: "Clip · 00:51 today",
    detection: {
      species: "Wild Boar",
      isHuman: false,
      confidence: 94,
      zone: "East vegetable plot",
      recommended: "dog",
      box: { top: 44, left: 38, width: 27, height: 34 },
    },
  },
  farmer: {
    src: CAMERA_FEEDS.farmer,
    label: "Clip · 21:42 yesterday",
    detection: {
      species: "Human",
      isHuman: true,
      confidence: 98,
      zone: "Farm path",
      recommended: "voice",
      box: { top: 22, left: 44, width: 16, height: 58 },
    },
  },
};

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now.toLocaleTimeString("en-GB", { hour12: false });
}

export default function LiveMonitor() {
  const [feedId, setFeedId] = useState<FeedId>("live");
  const [soundId, setSoundId] = useState<string>("tiger");
  const [volume, setVolume] = useState<number[]>([70]);
  const [playing, setPlaying] = useState(false);
  const [servoAngle, setServoAngle] = useState<number[]>([90]);
  const [autoSweep, setAutoSweep] = useState(true);
  const [pirActive, setPirActive] = useState(true);
  const clock = useClock();

  const feed = FEEDS[feedId];
  const det = feed.detection;

  // Auto-select the recommended deterrent when the feed changes
  useEffect(() => {
    setSoundId(det.recommended);
  }, [feedId, det.recommended]);

  // Adaptive intensity suggestion from confidence
  const adaptiveLevel = det.confidence >= 95 ? 3 : det.confidence >= 90 ? 2 : 1;

  // Servo auto-sweep animation
  useEffect(() => {
    if (!autoSweep) return;
    let dir = 1;
    const t = setInterval(() => {
      setServoAngle(([a]) => {
        let next = a + dir * 6;
        if (next >= 180) {
          next = 180;
          dir = -1;
        } else if (next <= 0) {
          next = 0;
          dir = 1;
        }
        return [next];
      });
    }, 250);
    return () => clearInterval(t);
  }, [autoSweep]);

  // Playback timer
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setPlaying(false), 4000);
    return () => clearTimeout(t);
  }, [playing]);

  // PIR pulse simulation
  useEffect(() => {
    const t = setInterval(() => {
      setPirActive((p) => (Math.random() > 0.75 ? !p : p));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const selectedSound = DETERRENT_SOUNDS.find((s) => s.id === soundId)!;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Video feed */}
      <div className="lg:col-span-2">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="relative aspect-video w-full bg-foreground">
            <img
              src={feed.src}
              alt={`Camera feed — ${feed.label}: ${det.species} detected in ${det.zone}`}
              className="h-full w-full object-cover"
            />
            {/* Bounding box overlay */}
            <div
              className={cn(
                "absolute rounded-md border-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.05)]",
                det.isHuman ? "border-chart-2" : "border-chart-1"
              )}
              style={{
                top: `${det.box.top}%`,
                left: `${det.box.left}%`,
                width: `${det.box.width}%`,
                height: `${det.box.height}%`,
              }}
            >
              <span
                className={cn(
                  "absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold text-white",
                  det.isHuman ? "bg-chart-2" : "bg-chart-1"
                )}
              >
                {det.species} · {det.confidence}%
              </span>
            </div>
            {/* HUD overlays */}
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-red-500"></span>
                </span>
                {feedId === "live" ? "Live" : "Playback"}
              </span>
              <span className="rounded bg-black/60 px-2 py-1 font-mono text-[11px] text-white backdrop-blur">
                CAM-01 · {clock}
              </span>
            </div>
            <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-[11px] text-white backdrop-blur">
              {feed.label} · {det.zone} · YOLOv8n
            </div>
            {playing && (
              <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg">
                <Volume2 className="size-3.5 animate-pulse" aria-hidden="true" />
                Playing {selectedSound.label}…
              </div>
            )}
          </div>
          {/* Feed switcher */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border p-3">
            {(Object.keys(FEEDS) as FeedId[]).map((id) => (
              <Button
                key={id}
                size="sm"
                variant={feedId === id ? "default" : "outline"}
                onClick={() => setFeedId(id)}
              >
                {id === "live" ? (
                  <Radio className="size-3.5" aria-hidden="true" />
                ) : (
                  <ScanEye className="size-3.5" aria-hidden="true" />
                )}
                {FEEDS[id].label}
              </Button>
            ))}
            <span className="ml-auto hidden text-xs text-muted-foreground sm:block">
              ESP32-CAM · OV2640 · 1280×720 @ 12 fps
            </span>
          </div>
        </div>

        {/* Detection summary */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Classification</p>
            <p className="mt-1 text-lg font-bold">
              {det.isHuman ? "Human" : "Animal"} — {det.species}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${det.confidence}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">YOLOv8 confidence {det.confidence}%</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Response policy</p>
            <p className="mt-1 text-sm font-semibold">
              {det.isHuman ? "No deterrent — human detected" : `Deter with ${selectedSound.label.toLowerCase()}`}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {det.isHuman
                ? "Farmers and visitors are never scared. Event logged only."
                : `Adaptive intensity level ${adaptiveLevel}/3 based on confidence & repeat visits`}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Sensor state</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
              <Radar className={cn("size-4", pirActive ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
              PIR {pirActive ? "motion" : "idle"}
            </p>
            <p className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Wifi className="size-3" aria-hidden="true" /> Wi-Fi −54 dBm · IoT alerts enabled
            </p>
          </div>
        </div>
      </div>

      {/* Control panel */}
      <div className="flex flex-col gap-4">
        {/* Speaker / audio deterrence */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Volume2 className="size-4 text-primary" aria-hidden="true" />
              Speaker — audio deterrence
            </h3>
            <Badge variant={playing ? "default" : "secondary"}>{playing ? "Playing" : "Standby"}</Badge>
          </div>
          <div className="mt-4 grid gap-2">
            {DETERRENT_SOUNDS.map((s) => {
              const Icon = soundIcons[s.icon];
              const active = soundId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSoundId(s.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{s.label}</span>
                    <span className="block text-[11px] text-muted-foreground">Best for: {s.target}</span>
                  </span>
                  {s.id === det.recommended && !det.isHuman && (
                    <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">AI pick</Badge>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Volume / adaptive intensity</span>
              <span className="font-semibold text-foreground">{volume[0]}%</span>
            </div>
            <Slider
              value={volume}
              onValueChange={setVolume}
              min={0}
              max={100}
              step={5}
              className="mt-2"
              aria-label="Deterrent volume"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Intensity adapts automatically: first visit = gentle, repeat intruders = stronger.
            </p>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              className="flex-1"
              disabled={det.isHuman || playing}
              onClick={() => setPlaying(true)}
            >
              {playing ? <VolumeX className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
              {det.isHuman ? "Human — muted" : "Play deterrent"}
            </Button>
            <Button variant="outline" onClick={() => setPlaying(false)} disabled={!playing}>
              <Square className="size-4" aria-hidden="true" />
              Stop
            </Button>
          </div>
        </div>

        {/* Servo scarecrow */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Move className="size-4 text-primary" aria-hidden="true" />
            Servo scarecrow — 180° sweep
          </h3>
          {/* Servo gauge */}
          <div className="relative mx-auto mt-4 h-20 w-40">
            <div className="absolute inset-x-0 bottom-0 h-20 overflow-hidden rounded-t-full border border-border bg-muted" />
            <div
              className="absolute bottom-0 left-1/2 h-16 w-1 origin-bottom rounded-full bg-primary transition-transform duration-200"
              style={{ transform: `rotate(${90 - servoAngle[0]}deg)` }}
            />
            <div className="absolute bottom-0 left-1/2 size-3 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary" />
            <span className="absolute bottom-1 left-2 text-[10px] text-muted-foreground">0°</span>
            <span className="absolute bottom-1 right-2 text-[10px] text-muted-foreground">180°</span>
            <span className="absolute left-1/2 top-1 -translate-x-1/2 text-xs font-bold">{Math.round(servoAngle[0])}°</span>
          </div>
          <Slider
            value={servoAngle}
            onValueChange={(v) => {
              setAutoSweep(false);
              setServoAngle(v);
            }}
            min={0}
            max={180}
            step={1}
            className="mt-3"
            aria-label="Servo angle"
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-medium">Auto-sweep during intrusion</span>
            <Switch checked={autoSweep} onCheckedChange={setAutoSweep} aria-label="Auto sweep" />
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setServoAngle([90])}>
              <CircleDot className="size-3.5" aria-hidden="true" /> Center
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setServoAngle([0])}>
              0°
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setServoAngle([180])}>
              180°
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => { setAutoSweep(false); setServoAngle([90]); }} aria-label="Reset servo">
              <RotateCcw className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Power vitals */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <BatteryCharging className="size-4 text-primary" aria-hidden="true" />
            Power & connectivity
          </h3>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <div className="flex justify-between text-xs">
                <dt className="text-muted-foreground">12V battery</dt>
                <dd className="font-semibold">87%</dd>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
                <div className="h-full w-[87%] rounded-full bg-primary" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs">
                <dt className="text-muted-foreground">Solar input</dt>
                <dd className="font-semibold">4.2 A · charging</dd>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
                <div className="h-full w-3/5 rounded-full bg-chart-4" />
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <dt className="text-muted-foreground">LM2596 output</dt>
              <dd className="font-semibold">5.02 V · stable</dd>
            </div>
            <div className="flex justify-between text-xs">
              <dt className="text-muted-foreground">Est. autonomy</dt>
              <dd className="font-semibold">~6 days without sun</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
