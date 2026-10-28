import * as React from "react";
import { toast } from "sonner";
import { Info, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import AppShell from "@/components/app/AppShell";
import { DemoDataChip, PageHeader } from "@/components/app/common";
import { currentUser } from "@/lib/data/mock";

function SaveBar() {
  return (
    <div className="flex justify-end">
      <Button onClick={() => toast.success("Settings saved locally (demo) — cloud sync arrives with Backends")}>
        <Save className="h-4 w-4" /> Save changes
      </Button>
    </div>
  );
}

function ToggleRow({ id, label, desc, defaultChecked }: { id: string; label: string; desc: string; defaultChecked: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch id={id} defaultChecked={defaultChecked} />
    </div>
  );
}

const audioPacks = [
  { id: "pack-boar", label: "Wild boar distress calls", desc: "Triggers on boar classification — 4 recordings rotated to avoid habituation.", on: true },
  { id: "pack-predator", label: "Predator calls", desc: "Used for deer and small grazers — tiger/leopard vocalisations.", on: true },
  { id: "pack-cattle", label: "Cattle herd tones", desc: "Calm herd movement tones that guide stray cattle away from crops.", on: true },
  { id: "pack-voice", label: "Human voice warnings", desc: "Regional-language warning for human intruders; never startles wildlife.", on: true },
  { id: "pack-ultra", label: "Ultrasonic burst", desc: "Bird deterrent inaudible to humans, used at low intensity.", on: false },
];

export default function SettingsPage() {
  const [intensity, setIntensity] = React.useState([4]);
  const [sweep, setSweep] = React.useState([180]);
  const [lowBattery, setLowBattery] = React.useState([20]);

  return (
    <AppShell title="Settings" subtitle="Device behaviour, alerts, power and your profile">
      <div className="mx-auto max-w-4xl">
        <PageHeader description="Tune how the Bijuka detects, deters and notifies — per your field, your crops and your neighbours.">
          <DemoDataChip />
        </PageHeader>

        <Tabs defaultValue="deterrence">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="deterrence">Deterrence</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="power">Power</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="deterrence" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Adaptive Sound Intensity</CardTitle>
                <CardDescription>
                  The Bijuka escalates intensity automatically when an intruder stays.
                  Set the starting level.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Starting intensity</Label>
                    <Badge variant="secondary">Level {intensity[0]} / 5</Badge>
                  </div>
                  <Slider value={intensity} onValueChange={setIntensity} min={1} max={5} step={1} className="mt-3" aria-label="Starting deterrent intensity" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Level 4 is recommended for wild boar zones — it deterred 87% of events on first attempt.
                  </p>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Servo sweep range</Label>
                    <Badge variant="secondary">{sweep[0]}°</Badge>
                  </div>
                  <Slider value={sweep} onValueChange={setSweep} min={60} max={180} step={10} className="mt-3" aria-label="Servo sweep range" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Wider sweeps mimic a moving scarecrow and cover more of the field edge.
                  </p>
                </div>
                <Separator />
                <ToggleRow id="scarecrow" label="Human-like scarecrow mode" desc="Periodic random servo movement and soft sounds at dusk so intruders never learn a fixed pattern." defaultChecked />
                <ToggleRow id="escalate" label="Automatic escalation" desc="Raise intensity by one level every 30 s while the intruder remains in frame." defaultChecked />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Animal-Specific Audio Packs</CardTitle>
                <CardDescription>Played automatically based on the YOLOv8 classification.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {audioPacks.map((p) => (
                    <ToggleRow key={p.id} id={p.id} label={p.label} desc={p.desc} defaultChecked={p.on} />
                  ))}
                </div>
              </CardContent>
            </Card>
            <SaveBar />
          </TabsContent>

          <TabsContent value="alerts" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>How and when Smart Bijuka reaches you.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  <ToggleRow id="sms-critical" label="SMS for critical intrusions" desc="Sent immediately for critical severity events (e.g. boar sounders)." defaultChecked />
                  <ToggleRow id="push-all" label="Push notifications for all detections" desc="Every classified event appears in the notification bell." defaultChecked />
                  <ToggleRow id="daily-digest" label="Daily morning digest" desc="One summary each morning: overnight events, battery, solar health." defaultChecked />
                  <ToggleRow id="offline-alerts" label="Device-offline alerts" desc="Notify me within 15 minutes if any unit stops reporting." defaultChecked />
                </div>
                <Separator className="my-2" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="quiet-from">Quiet hours — from</Label>
                    <Input id="quiet-from" type="time" defaultValue="13:00" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="quiet-to">Quiet hours — to</Label>
                    <Input id="quiet-to" type="time" defaultValue="17:00" className="mt-1" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Critical alerts ignore quiet hours so night intrusions always reach you.
                </p>
              </CardContent>
            </Card>
            <SaveBar />
          </TabsContent>

          <TabsContent value="power" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Power Management</CardTitle>
                <CardDescription>Solar + 12V rechargeable battery · LM2596 5V regulation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Low-battery alert threshold</Label>
                    <Badge variant="secondary">{lowBattery[0]}%</Badge>
                  </div>
                  <Slider value={lowBattery} onValueChange={setLowBattery} min={10} max={40} step={5} className="mt-3" aria-label="Low battery threshold" />
                </div>
                <Separator />
                <ToggleRow id="eco" label="Eco mode below threshold" desc="Disable camera captures and run PIR + audio only to stretch runtime through the night." defaultChecked />
                <ToggleRow id="camera-sleep" label="PIR-triggered camera wake" desc="ESP32-CAM sleeps between triggers — the single biggest battery saver." defaultChecked />
                <ToggleRow id="ir-auto" label="Automatic IR illumination" desc="Switch on infrared LEDs only when ambient light is low." defaultChecked />
              </CardContent>
            </Card>
            <SaveBar />
          </TabsContent>

          <TabsContent value="network" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Connectivity</CardTitle>
                <CardDescription>SB-01 · North Field Guardian</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="wifi-ssid">Wi-Fi SSID</Label>
                    <Input id="wifi-ssid" defaultValue="PatilFarm_2G" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="wifi-pass">Wi-Fi password</Label>
                    <Input id="wifi-pass" type="password" defaultValue="••••••••" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="lte-apn">LTE APN (fallback)</Label>
                    <Input id="lte-apn" defaultValue="jionet" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="sync-interval">Telemetry sync interval</Label>
                    <Select defaultValue="5">
                      <SelectTrigger id="sync-interval" className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Every minute</SelectItem>
                        <SelectItem value="5">Every 5 minutes</SelectItem>
                        <SelectItem value="15">Every 15 minutes</SelectItem>
                        <SelectItem value="60">Hourly (battery saver)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <p>
                    Cloud telemetry (MQTT broker, remote config push and OTA firmware
                    updates) connects once Backends is enabled. Values entered here are
                    stored locally for the demo.
                  </p>
                </div>
              </CardContent>
            </Card>
            <SaveBar />
          </TabsContent>

          <TabsContent value="general" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Farm &amp; Preferences</CardTitle>
                <CardDescription>Farmer-friendly defaults for your operation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="farm-name">Farm name</Label>
                    <Input id="farm-name" defaultValue={currentUser.farm} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="language">Interface language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger id="language" className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                        <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="crop">Primary crop</Label>
                    <Select defaultValue="wheat">
                      <SelectTrigger id="crop" className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wheat">Wheat</SelectItem>
                        <SelectItem value="vegetables">Vegetables</SelectItem>
                        <SelectItem value="sugarcane">Sugarcane</SelectItem>
                        <SelectItem value="orchard">Orchard / fruit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input id="timezone" defaultValue="Asia/Kolkata (IST)" className="mt-1" readOnly />
                  </div>
                </div>
                <Separator />
                <ToggleRow id="demo-badge" label="Show demo-data badges" desc="Keep visible reminders that screens are running on demonstration data." defaultChecked />
              </CardContent>
            </Card>
            <SaveBar />
          </TabsContent>

          <TabsContent value="profile" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Account details used for alerts and device ownership.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="p-name">Full name</Label>
                    <Input id="p-name" defaultValue={currentUser.name} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="p-phone">Mobile number</Label>
                    <Input id="p-phone" defaultValue={currentUser.phone} className="mt-1" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="p-email">Email</Label>
                    <Input id="p-email" type="email" defaultValue={currentUser.email} className="mt-1" />
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-2.5 rounded-lg border border-chart-2/40 bg-chart-2/5 px-4 py-3 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-chart-2" aria-hidden />
                  <p>
                    Secure accounts with real authentication (sign-up, sign-in and
                    per-farm device ownership) are pending — enable Backends to activate
                    them. Today the profile is a local demo record.
                  </p>
                </div>
              </CardContent>
            </Card>
            <SaveBar />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
