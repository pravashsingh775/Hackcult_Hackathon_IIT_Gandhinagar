import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Download, Footprints, PawPrint, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  EVENTS,
  HOURLY_DATA,
  SPECIES_DATA,
  WEEKLY_TREND,
  type Species,
} from "@/data/sampleData";

const FILTERS: Array<"All" | "Human" | Species> = [
  "All",
  "Human",
  "Deer",
  "Wild Boar",
  "Monkey",
  "Stray Cattle",
  "Porcupine",
];

function outcomeClasses(outcome: string) {
  switch (outcome) {
    case "Deterred":
      return "bg-primary/10 text-primary border-primary/20";
    case "Escalated":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

export default function HistoryView() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const filtered = useMemo(() => {
    if (filter === "All") return EVENTS;
    if (filter === "Human") return EVENTS.filter((e) => e.isHuman);
    return EVENTS.filter((e) => e.species === filter);
  }, [filter]);

  const exportCsv = () => {
    const header = "id,date,time,species,human,confidence,zone,deterrent,intensity,outcome,duration_sec\n";
    const rows = filtered
      .map((e) =>
        [
          e.id,
          e.date,
          e.time,
          `"${e.species}"`,
          e.isHuman ? "yes" : "no",
          e.confidence,
          `"${e.zone}"`,
          `"${e.deterrent}"`,
          e.intensity,
          e.outcome,
          e.durationSec,
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smart-bijuka-events-${filter.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold">Intrusions by hour of night (7-day aggregate)</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Peak window 21:00–23:00 — smart alerts fire before dusk in this window
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HOURLY_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(h) => `${h}:00`} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "var(--accent)" }}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    fontSize: 12,
                  }}
                  labelFormatter={(h) => `${h}:00`}
                />
                <Bar dataKey="intrusions" name="Intrusions" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold">Visitors by species</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">107 classified detections this week</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SPECIES_DATA}
                  dataKey="count"
                  nameKey="species"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {SPECIES_DATA.map((entry) => (
                    <Cell key={entry.species} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    fontSize: 12,
                  }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold">Weekly trend — intrusions vs successfully deterred</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Deterrence success stays above 94% every day</p>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={WEEKLY_TREND} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 12,
                }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="intrusions" name="Intrusions" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="deterred" name="Deterred" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Event log */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
          <div>
            <h3 className="text-sm font-semibold">Event log</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {filtered.length} event{filtered.length === 1 ? "" : "s"} · animal & time history, searchable by species
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="size-3.5" aria-hidden="true" />
            Export CSV
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4 sm:p-5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {f === "Human" ? (
                <Footprints className="size-3" aria-hidden="true" />
              ) : f !== "All" ? (
                <PawPrint className="size-3" aria-hidden="true" />
              ) : (
                <FilterX className="size-3" aria-hidden="true" />
              )}
              {f}
            </button>
          ))}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Date & time</TableHead>
              <TableHead>Visitor</TableHead>
              <TableHead className="hidden md:table-cell">Zone</TableHead>
              <TableHead className="hidden md:table-cell">Confidence</TableHead>
              <TableHead className="hidden sm:table-cell">Deterrent</TableHead>
              <TableHead>Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{e.id}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {e.date} · {e.time}
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {e.isHuman ? (
                      <Footprints className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <PawPrint className="size-3.5 text-primary" aria-hidden="true" />
                    )}
                    {e.species}
                  </span>
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{e.zone}</TableCell>
                <TableCell className="hidden text-xs md:table-cell">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-14 overflow-hidden rounded-full bg-primary/20">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${e.confidence}%` }} />
                    </span>
                    {e.confidence}%
                  </span>
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                  {e.deterrent}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={outcomeClasses(e.outcome)}>
                    {e.outcome}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
