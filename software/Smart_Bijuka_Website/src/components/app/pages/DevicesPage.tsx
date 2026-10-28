import * as React from "react";
import {
  Plus,
  Radar,
  Camera,
  Move,
  BatteryCharging,
  Sun,
  Wifi,
  WifiOff,
  ShieldCheck,
  PauseCircle,
  Wrench,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import AppShell from "@/components/app/AppShell";
import { DemoDataChip, MetricLabel, PageHeader, StatusDot } from "@/components/app/common";
import { devices as initialDevices, type Device } from "@/lib/data/mock";

const modeBadge = (mode: Device["mode"]) =>
  mode === "armed" ? (
    <Badge className="bg-primary/10 text-primary border-primary/30 gap-1">
      <ShieldCheck className="h-3 w-3" /> Armed
    </Badge>
  ) : mode === "standby" ? (
    <Badge variant="outline" className="gap-1">
      <PauseCircle className="h-3 w-3" /> Standby
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <Wrench className="h-3 w-3" /> Maintenance
    </Badge>
  );

function TelemetryRow({ icon: Icon, label, value, state }: { icon: React.ElementType; label: string; value: string; state?: "ok" | "warn" | "error" }) {
  return (
    <li className="flex items-center justify-between text-sm py-1.5">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden /> {label}
      </span>
      <span className="flex items-center gap-1.5 font-medium">
        {state && <StatusDot state={state} />}
        {value}
      </span>
    </li>
  );
}

export default function DevicesPage() {
  const [devices, setDevices] = React.useState(initialDevices);

  const toggleMode = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== id || d.connection === "offline") return d;
        const next = d.mode === "armed" ? "standby" : "armed";
        toast.success(`${d.id} switched to ${next === "armed" ? "armed" : "standby"} mode`);
        return { ...d, mode: next };
      })
    );
  };

  return (
    <AppShell title="Devices & Fields" subtitle={`${devices.filter((d) => d.connection === "online").length} of ${devices.length} units online`}>
      <div className="mx-auto max-w-7xl">
        <PageHeader description="Manage every Smart Bijuka unit across your fields. The platform is built to scale from one guardian to a full fleet.">
          <DemoDataChip />
        </PageHeader>

        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <p>
            Each unit pairs with a field and its zones. Adding and provisioning new
            units over-the-air arrives with the ESP32 backend integration — unit
            management, telemetry and mode switching are demonstrated here with live-shaped data.
          </p>
        </div>

        <section id="device-fleet" aria-label="Device fleet" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {devices.map((d) => {
            const offline = d.connection === "offline";
            return (
              <Card key={d.id} className={cn("gap-4", offline && "opacity-90")}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <StatusDot state={offline ? "error" : "ok"} pulse={!offline} />
                    <CardTitle className="text-base">{d.name}</CardTitle>
                  </div>
                  <CardDescription>
                    {d.id} · {d.field}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {modeBadge(d.mode)}
                    <Badge variant="outline" className="text-[11px] font-normal">
                      {offline ? `Offline · last seen ${Math.round(d.telemetry.lastSyncMinutesAgo / 60)} h ago` : `Online · ${d.telemetry.firmware}`}
                    </Badge>
                    <Badge variant="outline" className="text-[11px] font-normal">
                      {d.zones.length} zone{d.zones.length > 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <MetricLabel>Battery</MetricLabel>
                      <span className={cn("font-semibold", d.telemetry.batteryPercent < 20 ? "text-destructive" : "")}>
                        {d.telemetry.batteryPercent}%
                      </span>
                    </div>
                    <Progress
                      value={d.telemetry.batteryPercent}
                      className={cn("mt-1.5 h-2", d.telemetry.batteryPercent < 20 && "[&>div]:bg-destructive")}
                    />
                  </div>

                  <Separator />

                  <ul>
                    <TelemetryRow icon={Wifi} label="Signal" value={offline ? "No link" : `${d.telemetry.wifiRssi} dBm`} state={offline ? "error" : d.telemetry.signalBars >= 3 ? "ok" : "warn"} />
                    <TelemetryRow icon={Radar} label="PIR sensor" value={d.pir.status === "active" ? `Active · ${d.pir.triggersToday} today` : "Fault"} state={d.pir.status === "active" ? "ok" : "error"} />
                    <TelemetryRow icon={Camera} label="ESP32-CAM" value={d.camera.status === "ready" ? `Ready · ${d.camera.resolution}` : "Fault"} state={d.camera.status === "ready" ? "ok" : "error"} />
                    <TelemetryRow icon={Move} label="Servo (180°)" value={d.servo.status === "ok" ? `${d.servo.sweepDegrees}° sweep · OK` : "Fault"} state={d.servo.status === "ok" ? "ok" : "error"} />
                    <TelemetryRow icon={Sun} label="Solar input" value={d.telemetry.solarChargingW > 0 ? `${d.telemetry.solarChargingW} W charging` : "No input"} state={d.telemetry.solarChargingW > 0 ? "ok" : "warn"} />
                    <TelemetryRow icon={BatteryCharging} label="12V rail" value={`${d.telemetry.batteryVoltage} V · 5V rail ${d.telemetry.rail5v === "ok" ? "OK" : "fault"}`} state={d.telemetry.rail5v === "ok" ? "ok" : "error"} />
                  </ul>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={d.mode === "armed" ? "outline" : "default"}
                      className="flex-1"
                      disabled={offline}
                      onClick={() => toggleMode(d.id)}
                    >
                      {d.mode === "armed" ? "Set standby" : "Arm device"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={offline}
                      onClick={() => {
                        if (offline) {
                          toast.error(`${d.id} is offline`);
                          return;
                        }
                        toast.success(`${d.id} telemetry refreshed`);
                      }}
                    >
                      Refresh
                    </Button>
                  </div>

                  {offline && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                      <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      <p>
                        Unit unreachable. Battery critically low — inspect solar panel
                        connection and SIM/Wi-Fi link on site.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Add device */}
          <Card className="border-dashed items-center justify-center text-center gap-3 min-h-64">
            <CardContent className="px-6 flex flex-col items-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                <Plus className="h-5 w-5 text-muted-foreground" aria-hidden />
              </div>
              <p className="font-medium text-sm">Add a Smart Bijuka unit</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-55">
                Over-the-air provisioning of new guardians (pairing, Wi-Fi/LTE setup and
                zone mapping) arrives with the ESP32 backend integration. The dashboard
                already scales to any number of units.
              </p>
              <Button variant="outline" size="sm" disabled>
                Provisioning coming soon
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
