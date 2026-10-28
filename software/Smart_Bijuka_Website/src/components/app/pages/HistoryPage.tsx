import * as React from "react";
import { Search, X, Download, Filter, MousePointerClick } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AppShell from "@/components/app/AppShell";
import { DemoDataChip, PageHeader, SeverityBadge, formatTime } from "@/components/app/common";
import {
  CLASSIFICATION_LABELS,
  DETERRENT_LABELS,
  OUTCOME_LABELS,
  SNAPSHOT_URLS,
  events,
  type FarmEvent,
} from "@/lib/data/mock";

const ANY = "any";

const outcomeBadge = (o: FarmEvent["outcome"]) =>
  o === "deterred" ? (
    <Badge variant="secondary">Deterred</Badge>
  ) : o === "escalated" ? (
    <Badge variant="outline" className="border-chart-2/50 bg-chart-2/10">Escalated</Badge>
  ) : o === "partially_deterred" ? (
    <Badge variant="outline">Partial</Badge>
  ) : o === "no_action" ? (
    <Badge variant="outline" className="text-muted-foreground">Logged only</Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">Left on its own</Badge>
  );

function EventDetailDialog({ event, onClose }: { event: FarmEvent | null; onClose: () => void }) {
  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {event && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {event.id} · {CLASSIFICATION_LABELS[event.classification]}
                <SeverityBadge severity={event.severity} />
              </DialogTitle>
              <DialogDescription>
                {formatTime(event.timestamp)} · {event.deviceName} ({event.deviceId}) · {event.zone}
              </DialogDescription>
            </DialogHeader>

            {event.snapshot && (
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={SNAPSHOT_URLS[event.snapshot]}
                  alt={`Capture frame for event ${event.id}`}
                  className="w-full object-cover"
                />
                <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
                  Capture frame · {Math.round(event.confidence * 100)}% confidence
                </span>
              </div>
            )}

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Classification</dt>
                <dd className="font-medium">{CLASSIFICATION_LABELS[event.classification]}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Confidence (YOLOv8)</dt>
                <dd className="font-medium">{Math.round(event.confidence * 100)}%</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Deterrent used</dt>
                <dd className="font-medium">{DETERRENT_LABELS[event.deterrent]}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Sound intensity</dt>
                <dd className="font-medium">Level {event.intensityLevel} / 5</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Servo angle</dt>
                <dd className="font-medium">{event.servoAngle}°</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Duration</dt>
                <dd className="font-medium">{event.durationSec} s</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Outcome</dt>
                <dd>{outcomeBadge(event.outcome)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Response status</dt>
                <dd className="font-medium capitalize">{event.responseStatus.replace(/_/g, " ")}</dd>
              </div>
            </dl>

            {event.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Event notes</p>
                  <p className="mt-1 text-sm leading-relaxed">{event.notes}</p>
                </div>
              </>
            )}

            <Separator />
            <ol className="space-y-1.5 text-xs text-muted-foreground">
              <li>1. PIR trigger → ESP32-CAM wake &amp; capture</li>
              <li>2. YOLOv8 classification ({Math.round(event.confidence * 100)}% confidence)</li>
              <li>3. Servo sweep to {event.servoAngle}°, {DETERRENT_LABELS[event.deterrent].toLowerCase()} at L{event.intensityLevel}</li>
              <li>4. Outcome logged: {OUTCOME_LABELS[event.outcome]}</li>
            </ol>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function HistoryPage() {
  const [query, setQuery] = React.useState("");
  const [animal, setAnimal] = React.useState(ANY);
  const [zone, setZone] = React.useState(ANY);
  const [severity, setSeverity] = React.useState(ANY);
  const [outcome, setOutcome] = React.useState(ANY);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [selected, setSelected] = React.useState<FarmEvent | null>(null);

  const filtered = events.filter((e) => {
    if (query) {
      const q = query.toLowerCase();
      const hay = `${e.id} ${CLASSIFICATION_LABELS[e.classification]} ${e.zone} ${e.deviceName} ${DETERRENT_LABELS[e.deterrent]}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (animal !== ANY && e.classification !== animal) return false;
    if (zone !== ANY && e.zone !== zone) return false;
    if (severity !== ANY && e.severity !== severity) return false;
    if (outcome !== ANY && e.outcome !== outcome) return false;
    const t = new Date(e.timestamp).getTime();
    if (from && t < new Date(from + "T00:00:00").getTime()) return false;
    if (to && t > new Date(to + "T23:59:59").getTime()) return false;
    return true;
  });

  const hasFilters = query || animal !== ANY || zone !== ANY || severity !== ANY || outcome !== ANY || from || to;

  const clearFilters = () => {
    setQuery(""); setAnimal(ANY); setZone(ANY); setSeverity(ANY); setOutcome(ANY); setFrom(""); setTo("");
  };

  return (
    <AppShell title="History & Events" subtitle={`${events.length} logged events · last 7 days`}>
      <div className="mx-auto max-w-7xl">
        <PageHeader description="Every PIR trigger, classification and deterrent response — searchable and filterable for review and pattern spotting.">
          <DemoDataChip />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="outline" size="sm" disabled>
                    <Download className="h-4 w-4" /> Export CSV
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>CSV export arrives with the backend data store.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </PageHeader>

        {/* Filters */}
        <Card className="mb-4 py-4">
          <CardContent className="px-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="xl:col-span-2">
                <Label htmlFor="event-search" className="sr-only">Search events</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    id="event-search"
                    placeholder="Search by event ID, animal, zone, device…"
                    className="pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Animal / class</Label>
                <Select value={animal} onValueChange={setAnimal}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>All types</SelectItem>
                    {Object.entries(CLASSIFICATION_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Zone</Label>
                <Select value={zone} onValueChange={setZone}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>All zones</SelectItem>
                    {["Zone A", "Zone B", "Zone C"].map((z) => (
                      <SelectItem key={z} value={z}>{z}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>All severities</SelectItem>
                    {["low", "medium", "high", "critical"].map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Outcome</Label>
                <Select value={outcome} onValueChange={setOutcome}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>All outcomes</SelectItem>
                    {Object.entries(OUTCOME_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="from-date" className="text-xs text-muted-foreground">From date</Label>
                <Input id="from-date" type="date" className="mt-1" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="to-date" className="text-xs text-muted-foreground">To date</Label>
                <Input id="to-date" type="date" className="mt-1" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <Filter className="mr-1 inline h-3 w-3" aria-hidden />
                Showing {filtered.length} of {events.length} events
              </p>
              {hasFilters && (
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearFilters}>
                  <X className="h-3 w-3" /> Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="py-0 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <MousePointerClick className="h-5 w-5 text-muted-foreground" aria-hidden />
              </div>
              <div>
                <p className="font-medium">No events match your filters</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try widening the date range or clearing a filter — quiet fields are good fields.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>Clear all filters</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Capture</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead className="hidden md:table-cell">Confidence</TableHead>
                  <TableHead className="hidden lg:table-cell">Device / Zone</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="hidden md:table-cell">Deterrent</TableHead>
                  <TableHead className="hidden xl:table-cell">Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(e)}
                  >
                    <TableCell>
                      {e.snapshot ? (
                        <img
                          src={SNAPSHOT_URLS[e.snapshot]}
                          alt=""
                          className="h-9 w-14 rounded object-cover"
                        />
                      ) : (
                        <div className="h-9 w-14 rounded bg-muted" />
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium whitespace-nowrap">{formatTime(e.timestamp)}</p>
                      <p className="text-xs text-muted-foreground">{e.id}</p>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {CLASSIFICATION_LABELS[e.classification]}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm tabular-nums">
                      {Math.round(e.confidence * 100)}%
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {e.deviceId} · {e.zone}
                    </TableCell>
                    <TableCell><SeverityBadge severity={e.severity} /></TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {DETERRENT_LABELS[e.deterrent]}
                      <span className="block text-xs text-muted-foreground">Intensity L{e.intensityLevel}</span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">{outcomeBadge(e.outcome)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
        <p className="mt-3 text-xs text-muted-foreground">
          Select any row to view the capture frame, response timeline and telemetry for that event.
        </p>
      </div>

      <EventDetailDialog event={selected} onClose={() => setSelected(null)} />
    </AppShell>
  );
}
