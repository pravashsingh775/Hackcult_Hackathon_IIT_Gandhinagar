// ---------------------------------------------------------------------------
// Smart Bijuka — demo data layer
// All data below is MOCK data for the demonstration frontend.
// Types are shaped to match the future backend / ESP32 telemetry API so the
// UI can switch from `mockData` to live endpoints without reshaping screens.
// ---------------------------------------------------------------------------

export type ConnectionState = "online" | "degraded" | "offline";
export type Severity = "low" | "medium" | "high" | "critical";
export type Outcome = "deterred" | "partially_deterred" | "left_on_own" | "escalated" | "no_action";
export type Classification =
  | "wild_boar"
  | "stray_cattle"
  | "deer"
  | "bird_flock"
  | "human"
  | "unknown";

export interface DeviceTelemetry {
  batteryPercent: number;
  batteryVoltage: number;
  solarChargingW: number;
  rail5v: "ok" | "fault";
  wifiRssi: number;
  signalBars: number;
  firmware: string;
  lastSyncMinutesAgo: number;
}

export interface Device {
  id: string;
  name: string;
  field: string;
  zones: string[];
  connection: ConnectionState;
  mode: "armed" | "standby" | "maintenance";
  pir: { status: "active" | "fault"; triggersToday: number };
  camera: { status: "ready" | "streaming" | "fault"; resolution: string; irEnabled: boolean };
  servo: { sweepDegrees: number; status: "ok" | "fault" };
  telemetry: DeviceTelemetry;
}

export interface FarmEvent {
  id: string;
  timestamp: string; // ISO
  deviceId: string;
  deviceName: string;
  zone: string;
  classification: Classification;
  confidence: number; // 0..1
  severity: Severity;
  deterrent: "boar_distress" | "predator_call" | "cattle_herd_tone" | "human_voice_warning" | "ultrasonic_burst" | "none";
  intensityLevel: 1 | 2 | 3 | 4 | 5;
  outcome: Outcome;
  responseStatus: "deterrent_fired" | "monitoring" | "escalated" | "completed";
  durationSec: number;
  snapshot: "night" | "day" | null;
  servoAngle: number;
  notes?: string;
}

export interface AppAlert {
  id: string;
  title: string;
  body: string;
  level: "info" | "warning" | "critical";
  minutesAgo: number;
  acknowledged: boolean;
}

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  wild_boar: "Wild Boar",
  stray_cattle: "Stray Cattle",
  deer: "Deer",
  bird_flock: "Bird Flock",
  human: "Human",
  unknown: "Unclassified",
};

export const DETERRENT_LABELS: Record<FarmEvent["deterrent"], string> = {
  boar_distress: "Boar distress call",
  predator_call: "Predator call",
  cattle_herd_tone: "Cattle herd tone",
  human_voice_warning: "Voice warning",
  ultrasonic_burst: "Ultrasonic burst",
  none: "No deterrent",
};

export const OUTCOME_LABELS: Record<Outcome, string> = {
  deterred: "Deterred",
  partially_deterred: "Partially deterred",
  left_on_own: "Left on its own",
  escalated: "Escalated (intensity raised)",
  no_action: "No action needed",
};

export const SNAPSHOT_URLS: Record<"night" | "day", string> = {
  night: "https://cdn.b12.io/client_media/gZn0Smwq/c9c7a3d7-ada7-11f1-81b8-0242ac110002-LlaaQ6IEe-5tv4Atl2xrq_jaGmuLV4.jpg",
  day: "https://cdn.b12.io/client_media/gZn0Smwq/ca402820-ada7-11f1-a603-0242ac110002-lY9WDbYi4OImEC3rvhQxV_4suUXCXz.jpg",
};

export const HERO_IMAGE_URL =
  "https://cdn.b12.io/client_media/gZn0Smwq/c9751448-ada7-11f1-8e75-0242ac110002-tn2LicB_dCsyK7KSR5dln_j7pViwst.jpg";

export const devices: Device[] = [
  {
    id: "SB-01",
    name: "North Field Guardian",
    field: "North Field · 2.4 acre wheat",
    zones: ["Zone A", "Zone B", "Zone C"],
    connection: "online",
    mode: "armed",
    pir: { status: "active", triggersToday: 23 },
    camera: { status: "ready", resolution: "800×600 @ 8 fps", irEnabled: true },
    servo: { sweepDegrees: 180, status: "ok" },
    telemetry: {
      batteryPercent: 87,
      batteryVoltage: 12.6,
      solarChargingW: 6.4,
      rail5v: "ok",
      wifiRssi: -58,
      signalBars: 4,
      firmware: "v1.4.2",
      lastSyncMinutesAgo: 1,
    },
  },
  {
    id: "SB-02",
    name: "East Canal Block",
    field: "East Block · 1.8 acre vegetables",
    zones: ["Zone A", "Zone B"],
    connection: "online",
    mode: "standby",
    pir: { status: "active", triggersToday: 9 },
    camera: { status: "ready", resolution: "800×600 @ 8 fps", irEnabled: true },
    servo: { sweepDegrees: 180, status: "ok" },
    telemetry: {
      batteryPercent: 64,
      batteryVoltage: 12.1,
      solarChargingW: 3.1,
      rail5v: "ok",
      wifiRssi: -71,
      signalBars: 3,
      firmware: "v1.4.2",
      lastSyncMinutesAgo: 4,
    },
  },
  {
    id: "SB-03",
    name: "South Orchard Sentinel",
    field: "South Orchard · 0.9 acre mango",
    zones: ["Zone A"],
    connection: "offline",
    mode: "maintenance",
    pir: { status: "fault", triggersToday: 0 },
    camera: { status: "fault", resolution: "—", irEnabled: false },
    servo: { sweepDegrees: 180, status: "ok" },
    telemetry: {
      batteryPercent: 12,
      batteryVoltage: 11.2,
      solarChargingW: 0,
      rail5v: "ok",
      wifiRssi: -92,
      signalBars: 0,
      firmware: "v1.3.9",
      lastSyncMinutesAgo: 1440,
    },
  },
];

// Deterministic demo timeline (relative to "today" so dates always look fresh)
const now = new Date();
const at = (daysAgo: number, hour: number, minute: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const events: FarmEvent[] = [
  { id: "EV-2481", timestamp: at(0, 2, 41), deviceId: "SB-01", deviceName: "North Field Guardian", zone: "Zone B", classification: "wild_boar", confidence: 0.94, severity: "high", deterrent: "boar_distress", intensityLevel: 4, outcome: "deterred", responseStatus: "completed", durationSec: 46, snapshot: "night", servoAngle: 112, notes: "Sound sow detected near fence line. Two piglets followed her out within 20 s." },
  { id: "EV-2480", timestamp: at(0, 1, 12), deviceId: "SB-01", deviceName: "North Field Guardian", zone: "Zone A", classification: "bird_flock", confidence: 0.88, severity: "low", deterrent: "ultrasonic_burst", intensityLevel: 1, outcome: "deterred", responseStatus: "completed", durationSec: 12, snapshot: "day", servoAngle: 34 },
  { id: "EV-2479", timestamp: at(0, 5, 58), deviceId: "SB-02", deviceName: "East Canal Block", zone: "Zone A", classification: "stray_cattle", confidence: 0.91, severity: "medium", deterrent: "cattle_herd_tone", intensityLevel: 3, outcome: "partially_deterred", responseStatus: "escalated", durationSec: 190, snapshot: "day", servoAngle: 78, notes: "Herd tone moved 2 of 3 animals; intensity raised to level 4 for the remaining bull." },
  { id: "EV-2478", timestamp: at(0, 23, 36), deviceId: "SB-01", deviceName: "North Field Guardian", zone: "Zone C", classification: "human", confidence: 0.97, severity: "low", deterrent: "human_voice_warning", intensityLevel: 2, outcome: "no_action", responseStatus: "completed", durationSec: 65, snapshot: "night", servoAngle: 150, notes: "Recognised as farm owner's evening irrigation round. Voice warning logged only." },
  { id: "EV-2477", timestamp: at(1, 3, 5), deviceId: "SB-01", deviceName: "North Field Guardian", zone: "Zone B", classification: "wild_boar", confidence: 0.92, severity: "high", deterrent: "boar_distress", intensityLevel: 4, outcome: "deterred", responseStatus: "completed", durationSec: 38, snapshot: "night", servoAngle: 98 },
  { id: "EV-2476", timestamp: at(1, 22, 48), deviceId: "SB-02", deviceName: "East Canal Block", zone: "Zone B", classification: "deer", confidence: 0.86, severity: "medium", deterrent: "predator_call", intensityLevel: 3, outcome: "deterred", responseStatus: "completed", durationSec: 29, snapshot: "night", servoAngle: 61 },
  { id: "EV-2475", timestamp: at(1, 18, 20), deviceId: "SB-01", deviceName: "North Field Guardian", zone: "Zone A", classification: "bird_flock", confidence: 0.83, severity: "low", deterrent: "ultrasonic_burst", intensityLevel: 1, outcome: "deterred", responseStatus: "completed", durationSec: 9, snapshot: "day", servoAngle: 22 },
  { id: "EV-2474", timestamp: at(1, 4, 32), deviceId: "SB-01", deviceName: "North Field Guardian", zone: "Zone C", classification: "wild_boar", confidence: 0.79, severity: "critical", deterrent: "boar_distress", intensityLevel: 5, outcome: "escalated", responseStatus: "escalated", durationSec: 240, snapshot: "night", servoAngle: 140, notes: "Large sounder (5+ animals). Intensity escalated to 5; owner notified by SMS." },
  { id: "EV-2473", timestamp: at(2, 2, 15), deviceId: "SB-01", deviceName: "North Field Guardian", zone: "Zone B", classification: "unknown", confidence: 0.54, severity: "medium", deterrent: "predator_call", intensityLevel: 2, outcome: "left_on_own", responseStatus: "completed", durationSec: 55, snapshot: "night", servoAngle: 105, notes: "Low confidence at 54% — frame too dark. Logged for future model retraining." },
  { id: "EV-2472", timestamp: at(2, 6, 10), deviceId: "SB-02", deviceName: "East Canal Block", zone: "Zone A", classification: "stray_cattle", confidence: 0.9, severity: "medium", deterrent: "cattle_herd_tone", intensityLevel: 3, outcome: "deterred", responseStatus: "completed", durationSec: 74, snapshot: "day", servoAngle: 84 },
  { id: "EV-2471", timestamp: at(2, 20, 55), deviceId: "SB-01", deviceName: "North Field Guardian", zone: "Zone A", classification: "human", confidence: 0.95, severity: "low", deterrent: "human_voice_warning", intensityLevel: 2, outcome: "no_action", responseStatus: "completed", durationSec: 40, snapshot: "night", servoAngle: 18 },
  { id: "EV-2470", timestamp: at(3, 1, 47), deviceId: "SB-01", deviceName: "North Field Guardian", zone: "Zone B", classification: "wild_boar", confidence: 0.93, severity: "high", deterrent: "boar_distress", intensityLevel: 4, outcome: "deterred", responseStatus: "completed", durationSec: 41, snapshot: "night", servoAngle: 118 },
  { id: "EV-2469", timestamp: at(3, 17, 30), deviceId: "SB-02", deviceName: "East Canal Block", zone: "Zone B", classification: "bird_flock", confidence: 0.85, severity: "low", deterrent: "ultrasonic_burst", intensityLevel: 1, outcome: "deterred", responseStatus: "completed", durationSec: 14, snapshot: "day", servoAngle: 55 },
  { id: "EV-2468", timestamp: at(4, 3, 22), deviceId: "SB-01", deviceName: "North Field Guardian", zone: "Zone C", classification: "deer", confidence: 0.89, severity: "medium", deterrent: "predator_call", intensityLevel: 3, outcome: "deterred", responseStatus: "completed", durationSec: 33, snapshot: "night", servoAngle: 132 },
  { id: "EV-2467", timestamp: at(4, 23, 10), deviceId: "SB-02", deviceName: "East Canal Block", zone: "Zone A", classification: "stray_cattle", confidence: 0.87, severity: "medium", deterrent: "cattle_herd_tone", intensityLevel: 2, outcome: "deterred", responseStatus: "completed", durationSec: 88, snapshot: "night", servoAngle: 70 },
  { id: "EV-2466", timestamp: at(5, 2, 55), deviceId: "SB-01", deviceName: "North Field Guardian", zone: "Zone B", classification: "wild_boar", confidence: 0.91, severity: "high", deterrent: "boar_distress", intensityLevel: 4, outcome: "deterred", responseStatus: "completed", durationSec: 50, snapshot: "night", servoAngle: 96 },
  { id: "EV-2465", timestamp: at(6, 4, 18), deviceId: "SB-01", deviceName: "North Field Guardian", zone: "Zone A", classification: "wild_boar", confidence: 0.9, severity: "high", deterrent: "boar_distress", intensityLevel: 3, outcome: "deterred", responseStatus: "completed", durationSec: 36, snapshot: "night", servoAngle: 28 },
];

export const alerts: AppAlert[] = [
  { id: "AL-91", title: "Critical intrusion — Zone C", body: "Wild boar sounder (5+). Intensity escalated to 5. You were notified by SMS.", level: "critical", minutesAgo: 62, acknowledged: false },
  { id: "AL-90", title: "SB-03 is offline", body: "South Orchard Sentinel lost connectivity. Battery at 12% — check solar panel and mounting.", level: "warning", minutesAgo: 180, acknowledged: false },
  { id: "AL-89", title: "Herd tone escalated on SB-02", body: "One bull remained after cattle herd tone; intensity raised automatically.", level: "warning", minutesAgo: 240, acknowledged: false },
  { id: "AL-88", title: "Firmware v1.4.2 synced", body: "SB-01 and SB-02 updated successfully. SB-03 pending (offline).", level: "info", minutesAgo: 1440, acknowledged: true },
];

// --- Aggregated demo datasets for AI Insights -------------------------------

const hourlyCounts = [
  7, 6, 9, 8, 5, 4, 2, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 2, 3, 4, 5, 4, 2, 5,
];

export const hourlyPattern = hourlyCounts.map((events, h) => ({
  hour: `${String(h).padStart(2, "0")}:00`,
  events,
}));

export const animalFrequency = [
  { animal: "Wild Boar", events: 31, color: "var(--chart-1)" },
  { animal: "Stray Cattle", events: 18, color: "var(--chart-2)" },
  { animal: "Bird Flock", events: 14, color: "var(--chart-3)" },
  { animal: "Deer", events: 7, color: "var(--chart-4)" },
  { animal: "Human", events: 6, color: "var(--chart-5)" },
];

export const weeklyTrend = [
  { day: "Mon", deterred: 6, partial: 1, none: 0 },
  { day: "Tue", deterred: 8, partial: 2, none: 1 },
  { day: "Wed", deterred: 5, partial: 1, none: 0 },
  { day: "Thu", deterred: 9, partial: 0, none: 1 },
  { day: "Fri", deterred: 7, partial: 2, none: 0 },
  { day: "Sat", deterred: 10, partial: 1, none: 1 },
  { day: "Sun", deterred: 8, partial: 1, none: 0 },
];

export const zoneDistribution = [
  { zone: "Zone A", events: 22 },
  { zone: "Zone B", events: 27 },
  { zone: "Zone C", events: 14 },
  { zone: "East A", events: 9 },
  { zone: "East B", events: 4 },
];

export const confidenceBuckets = [
  { range: "50–60%", count: 3 },
  { range: "60–70%", count: 5 },
  { range: "70–80%", count: 12 },
  { range: "80–90%", count: 28 },
  { range: "90–100%", count: 28 },
];

export interface PredictiveInsight {
  id: string;
  icon: "moon" | "chart" | "route" | "battery" | "target";
  title: string;
  body: string;
  confidence: string;
}

export const predictiveInsights: PredictiveInsight[] = [
  { id: "PI-1", icon: "moon", title: "High boar activity expected tonight 22:00–02:00", body: "9 of the last 12 wild boar intrusions in Zone B arrived in this window, mostly from the east fence gap.", confidence: "Pattern strength: high" },
  { id: "PI-2", icon: "route", title: "Zone B fence gap is the dominant entry point", body: "62% of boar events start within 8 m of the east fence gap. A physical repair there could cut repeat intrusions significantly.", confidence: "Pattern strength: high" },
  { id: "PI-3", icon: "chart", title: "Cattle pressure peaks on market days", body: "Stray cattle events on SB-02 cluster around Tue/Fri mornings — matching nearby livestock market days.", confidence: "Pattern strength: medium" },
  { id: "PI-4", icon: "battery", title: "SB-03 battery will not survive the night", body: "At 12% with no solar input, expect full shutdown before dawn. Priority site visit recommended.", confidence: "Telemetry-based" },
  { id: "PI-5", icon: "target", title: "Escalation works — keep level 4 for boars", body: "Level-4 boar distress calls deterred 87% of events on the first attempt; level 3 only 58%.", confidence: "Pattern strength: medium" },
];

export const weeklySummary = {
  totalEvents: 76,
  deterredRate: 0.84,
  topAnimal: "Wild Boar",
  peakWindow: "00:00 – 04:00",
  avgResponseSec: 6,
};

export const currentUser = {
  name: "Ramesh Patil",
  farm: "Patil Farm · Nashik, Maharashtra",
  phone: "+91 98••• ••210",
  email: "ramesh@patilfarm.in",
  plan: "DigiKhet Protector — Demo",
};
