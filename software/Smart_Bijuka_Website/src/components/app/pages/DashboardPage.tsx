import * as React from "react";
import {
  ShieldCheck,
  Radio,
  Camera,
  Radar,
  BatteryCharging,
  Sun,
  Volume2,
  ArrowRight,
  Zap,
  Clock3,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AppShell from "@/components/app/AppShell";
import { DemoDataChip, MetricLabel, PageHeader, SeverityBadge, StatusDot, formatTime } from "@/components/app/common";
import {
  CLASSIFICATION_LABELS,
  DETERRENT_LABELS,
  alerts as mockAlerts,
  devices,
  events,
  hourlyPattern,
} from "@/lib/data/mock";

const primary = devices[0];

function StatusCard({
  icon: Icon,
  label,
  value,
  detail,
  state,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  state: "ok" | "warn" | "error";
}) {
  return (
    <Card className="py-5 gap-3">
      <CardContent className="px-5">
        <div className="flex items-start justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="h-4.5 w-4.5" aria-hidden />
          </div>
          <StatusDot state={state} pulse={state === "ok"} />
        </div>
        <p className="mt-3 text-sm font-semibold">{value}</p>
        <MetricLabel>{label}</MetricLabel>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [alerts, setAlerts] = React.useState(mockAlerts.filter((a) => !a.acknowledged));

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const recent = events.slice(0, 5);
  const lastEvent = events[0];

  return (
    <AppShell
      title="Dashboard"
      subtitle={`${primary.name} · ${primary.field}`}
    >
      <div className="mx-auto max-w-7xl">
        <PageHeader description="Real-time guardian status across your fields. Deterrent responses fire automatically; you stay informed.">
          <DemoDataChip />
          <Button asChild size="sm">
            <a href="/monitor">Open Live Monitor <ArrowRight className="h-4 w-4" /></a>
          </Button>
        </PageHeader>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-6">
            {/* System status row */}
            <section id="system-status" aria-label="System status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatusCard
                icon={ShieldCheck}
                label="System Status"
                value="Armed & Protecting"
                detail="Auto-deterrence active · 180° servo sweep"
                state="ok"
              />
              <StatusCard
                icon={Radio}
                label="Device Connectivity"
                value="Online · Wi-Fi + LTE"
                detail={`RSSI ${primary.telemetry.wifiRssi} dBm · synced ${primary.telemetry.lastSyncMinutesAgo} min ago`}
                state="ok"
              />
              <StatusCard
                icon={Camera}
                label="Camera (ESP32-CAM)"
                value={primary.camera.status === "ready" ? "Ready · IR on" : "Fault"}
                detail={primary.camera.resolution}
                state={primary.camera.status === "fault" ? "error" : "ok"}
              />
              <StatusCard
                icon={Radar}
                label="PIR Motion Sensor"
                value={`Active · ${primary.pir.triggersToday} triggers today`}
                detail="Average wake-to-capture: 1.8 s"
                state={primary.pir.status === "fault" ? "error" : "ok"}
              />
            </section>

            {/* Power + activity */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>24-Hour Intrusion Activity</CardTitle>
                  <CardDescription>
                    Detections per hour — activity concentrates between midnight and 04:00.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={hourlyPattern} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="actFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={3} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <ReTooltip
                          contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                          labelStyle={{ fontWeight: 600 }}
                        />
                        <Area type="monotone" dataKey="events" name="Detections" stroke="var(--chart-1)" strokeWidth={2} fill="url(#actFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Power &amp; Solar</CardTitle>
                  <CardDescription>12V battery · LM2596 5V rail</CardDescription>
                  <CardAction>
                    <Badge variant="secondary" className="gap-1.5">
                      <Sun className="h-3 w-3 text-chart-2" aria-hidden />
                      Charging
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <BatteryCharging className="h-4 w-4 text-primary" aria-hidden />
                        Battery
                      </span>
                      <span className="font-semibold">{primary.telemetry.batteryPercent}%</span>
                    </div>
                    <Progress value={primary.telemetry.batteryPercent} className="mt-2 h-2" />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {primary.telemetry.batteryVoltage} V · est. 2 nights of autonomy
                    </p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <MetricLabel>Solar Input</MetricLabel>
                      <p className="mt-1 font-semibold flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-chart-2" aria-hidden />
                        {primary.telemetry.solarChargingW} W
                      </p>
                    </div>
                    <div>
                      <MetricLabel>5V Rail (LM2596)</MetricLabel>
                      <p className="mt-1 font-semibold flex items-center gap-1.5">
                        <StatusDot state={primary.telemetry.rail5v === "ok" ? "ok" : "error"} />
                        {primary.telemetry.rail5v === "ok" ? "Stable 5.0 V" : "Fault"}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    SB-03 (South Orchard) is at <span className="font-semibold text-destructive">12% and offline</span>.
                    Site visit recommended before tonight.
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href="/devices">Manage devices</a>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent detections + alerts */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Detections</CardTitle>
                  <CardDescription>Classified by YOLOv8 on-device · confidence shown per detection</CardDescription>
                  <CardAction>
                    <Button asChild variant="ghost" size="sm">
                      <a href="/history">All events <ArrowRight className="h-4 w-4" /></a>
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border">
                    {recent.map((e) => (
                      <li key={e.id} className="flex items-center gap-4 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Clock3 className="h-4 w-4" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">
                              {CLASSIFICATION_LABELS[e.classification]}
                            </p>
                            <SeverityBadge severity={e.severity} />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(e.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {e.deviceName} · {e.zone} · {formatTime(e.timestamp)} ·{" "}
                            {DETERRENT_LABELS[e.deterrent]} (L{e.intensityLevel})
                          </p>
                        </div>
                        <Badge variant={e.outcome === "deterred" ? "secondary" : "outline"} className="hidden sm:inline-flex">
                          {e.outcome === "deterred" ? "Deterred" : e.outcome === "escalated" ? "Escalated" : e.outcome === "no_action" ? "Logged" : "Partial"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Alerts</CardTitle>
                    <CardDescription>{alerts.length} unacknowledged</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alerts.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center">
                        <p className="text-sm font-medium">All clear</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          No unacknowledged alerts right now.
                        </p>
                      </div>
                    ) : (
                      alerts.map((a) => (
                        <div
                          key={a.id}
                          className={cn(
                            "rounded-lg border p-3",
                            a.level === "critical"
                              ? "border-destructive/30 bg-destructive/5"
                              : a.level === "warning"
                                ? "border-chart-2/40 bg-chart-2/5"
                                : "border-border"
                          )}
                        >
                          <p className="text-sm font-medium leading-snug">{a.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground leading-snug">{a.body}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-7 px-2 text-xs"
                            onClick={() => {
                              setAlerts((prev) => prev.filter((x) => x.id !== a.id));
                              toast.success("Alert acknowledged");
                            }}
                          >
                            Acknowledge
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Last Response</CardTitle>
                    <CardDescription>Automatic deterrent sequence</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3 text-sm">
                      {[
                        { step: "PIR trigger", detail: `${formatTime(lastEvent.timestamp)} · ${lastEvent.zone}`, done: true },
                        { step: "Camera capture + YOLOv8 classify", detail: `${CLASSIFICATION_LABELS[lastEvent.classification]} · ${Math.round(lastEvent.confidence * 100)}%`, done: true },
                        { step: "Servo sweep to target", detail: `${lastEvent.servoAngle}°`, done: true },
                        { step: "Audio deterrent fired", detail: `${DETERRENT_LABELS[lastEvent.deterrent]} · intensity L${lastEvent.intensityLevel}`, done: true },
                        { step: "Outcome logged", detail: lastEvent.outcome === "deterred" ? "Intruder deterred" : "Escalated", done: true },
                      ].map((s, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                            {i + 1}
                          </span>
                          <div>
                            <p className={cn("font-medium leading-snug", s.done && "text-foreground")}>
                              {s.step}
                            </p>
                            <p className="text-xs text-muted-foreground">{s.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <Separator className="my-4" />
                    <p className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                      <Volume2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      Animal-specific sounds with adaptive intensity — the Bijuka raises
                      volume and changes tactics when an intruder doesn't leave.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
