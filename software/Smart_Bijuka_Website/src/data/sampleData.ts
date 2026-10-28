export type Species =
  | "Deer"
  | "Wild Boar"
  | "Monkey"
  | "Human"
  | "Stray Cattle"
  | "Porcupine";

export type Outcome = "Deterred" | "Left on own" | "Escalated";

export interface IntrusionEvent {
  id: string;
  date: string;
  time: string;
  species: Species;
  isHuman: boolean;
  confidence: number; // 0-100
  zone: string;
  deterrent: string;
  intensity: number; // sound intensity level 1-3
  outcome: Outcome;
  durationSec: number;
}

export const CAMERA_FEEDS = {
  liveNight:
    "https://cdn.b12.io/client_media/8qyJc2zL/8072056b-ad32-11f1-8463-0242ac110002-abDwehxPlc0oQXvvX9Zkn_HuzS2azg.jpg",
  boar: "https://cdn.b12.io/client_media/8qyJc2zL/7f433774-ad32-11f1-b7c1-0242ac110002-489VZ_Zn4LEtSH_iyqF0V_z1yXYA7M.jpg",
  farmer:
    "https://cdn.b12.io/client_media/8qyJc2zL/7ffa1895-ad32-11f1-b824-0242ac110002-PQusJjwREcnhSo0j3E4Bs_2IWXe88q.jpg",
};

export const DEVICE_PHOTO =
  "https://cdn.b12.io/client_media/8qyJc2zL/804c9eea-ad32-11f1-8550-0242ac110002-GYp13RyDYxfpMq8GaaijB_LntbPmHd.jpg";

export const EVENTS: IntrusionEvent[] = [
  { id: "EVT-1042", date: "2026-09-10", time: "02:14", species: "Deer", isHuman: false, confidence: 96, zone: "North paddy", deterrent: "Tiger growl", intensity: 2, outcome: "Deterred", durationSec: 38 },
  { id: "EVT-1041", date: "2026-09-10", time: "00:51", species: "Wild Boar", isHuman: false, confidence: 94, zone: "East vegetable plot", deterrent: "Dog bark", intensity: 3, outcome: "Deterred", durationSec: 64 },
  { id: "EVT-1040", date: "2026-09-09", time: "23:07", species: "Monkey", isHuman: false, confidence: 91, zone: "North paddy", deterrent: "Ultrasonic burst", intensity: 2, outcome: "Deterred", durationSec: 22 },
  { id: "EVT-1039", date: "2026-09-09", time: "21:42", species: "Human", isHuman: true, confidence: 98, zone: "Farm path", deterrent: "Voice warning (none)", intensity: 1, outcome: "Left on own", durationSec: 96 },
  { id: "EVT-1038", date: "2026-09-09", time: "20:18", species: "Wild Boar", isHuman: false, confidence: 93, zone: "East vegetable plot", deterrent: "Dog bark", intensity: 3, outcome: "Deterred", durationSec: 71 },
  { id: "EVT-1037", date: "2026-09-09", time: "18:55", species: "Stray Cattle", isHuman: false, confidence: 95, zone: "South maize", deterrent: "Siren beep", intensity: 2, outcome: "Deterred", durationSec: 110 },
  { id: "EVT-1036", date: "2026-09-09", time: "03:26", species: "Porcupine", isHuman: false, confidence: 88, zone: "South maize", deterrent: "Siren beep", intensity: 1, outcome: "Escalated", durationSec: 145 },
  { id: "EVT-1035", date: "2026-09-08", time: "01:10", species: "Deer", isHuman: false, confidence: 97, zone: "North paddy", deterrent: "Tiger growl", intensity: 2, outcome: "Deterred", durationSec: 41 },
  { id: "EVT-1034", date: "2026-09-08", time: "22:33", species: "Monkey", isHuman: false, confidence: 90, zone: "North paddy", deterrent: "Ultrasonic burst", intensity: 2, outcome: "Deterred", durationSec: 19 },
  { id: "EVT-1033", date: "2026-09-08", time: "19:47", species: "Human", isHuman: true, confidence: 99, zone: "Farm path", deterrent: "No action (owner)", intensity: 1, outcome: "Left on own", durationSec: 180 },
  { id: "EVT-1032", date: "2026-09-07", time: "23:58", species: "Wild Boar", isHuman: false, confidence: 92, zone: "East vegetable plot", deterrent: "Dog bark", intensity: 3, outcome: "Deterred", durationSec: 58 },
  { id: "EVT-1031", date: "2026-09-07", time: "02:44", species: "Deer", isHuman: false, confidence: 95, zone: "North paddy", deterrent: "Tiger growl", intensity: 2, outcome: "Deterred", durationSec: 35 },
  { id: "EVT-1030", date: "2026-09-06", time: "21:05", species: "Stray Cattle", isHuman: false, confidence: 96, zone: "South maize", deterrent: "Siren beep", intensity: 2, outcome: "Deterred", durationSec: 92 },
  { id: "EVT-1029", date: "2026-09-06", time: "00:22", species: "Monkey", isHuman: false, confidence: 89, zone: "North paddy", deterrent: "Ultrasonic burst", intensity: 2, outcome: "Deterred", durationSec: 27 },
  { id: "EVT-1028", date: "2026-09-05", time: "22:16", species: "Wild Boar", isHuman: false, confidence: 94, zone: "East vegetable plot", deterrent: "Dog bark", intensity: 3, outcome: "Deterred", durationSec: 66 },
  { id: "EVT-1027", date: "2026-09-05", time: "04:03", species: "Porcupine", isHuman: false, confidence: 87, zone: "South maize", deterrent: "Siren beep", intensity: 1, outcome: "Escalated", durationSec: 128 },
];

// Intrusions by hour (7-day aggregate)
export const HOURLY_DATA = [
  { hour: "18", intrusions: 4 },
  { hour: "19", intrusions: 7 },
  { hour: "20", intrusions: 11 },
  { hour: "21", intrusions: 16 },
  { hour: "22", intrusions: 22 },
  { hour: "23", intrusions: 18 },
  { hour: "00", intrusions: 12 },
  { hour: "01", intrusions: 9 },
  { hour: "02", intrusions: 14 },
  { hour: "03", intrusions: 8 },
  { hour: "04", intrusions: 6 },
  { hour: "05", intrusions: 3 },
];

export const SPECIES_DATA = [
  { species: "Wild Boar", count: 34, fill: "var(--chart-1)" },
  { species: "Deer", count: 28, fill: "var(--chart-2)" },
  { species: "Monkey", count: 19, fill: "var(--chart-3)" },
  { species: "Stray Cattle", count: 12, fill: "var(--chart-4)" },
  { species: "Porcupine", count: 8, fill: "var(--chart-5)" },
  { species: "Human", count: 6, fill: "var(--muted-foreground)" },
];

export const WEEKLY_TREND = [
  { day: "Thu", intrusions: 12, deterred: 12 },
  { day: "Fri", intrusions: 15, deterred: 14 },
  { day: "Sat", intrusions: 19, deterred: 18 },
  { day: "Sun", intrusions: 14, deterred: 14 },
  { day: "Mon", intrusions: 17, deterred: 16 },
  { day: "Tue", intrusions: 11, deterred: 11 },
  { day: "Wed", intrusions: 9, deterred: 9 },
];

export const DETERRENT_SOUNDS = [
  { id: "tiger", label: "Tiger growl", target: "Deer, Monkey", icon: "Cat" },
  { id: "dog", label: "Dog bark", target: "Wild Boar, Porcupine", icon: "Dog" },
  { id: "siren", label: "Siren beep", target: "Stray Cattle", icon: "Siren" },
  { id: "ultrasonic", label: "Ultrasonic burst", target: "Monkey, rodents", icon: "AudioWaveform" },
  { id: "voice", label: "Human voice warning", target: "Unknown intruders", icon: "Megaphone" },
];
