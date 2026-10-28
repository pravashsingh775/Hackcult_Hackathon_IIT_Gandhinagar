import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Moon, TrendingUp, Route, BatteryCharging, Target, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/app/AppShell";
import { DemoDataChip, MetricLabel, PageHeader } from "@/components/app/common";
import {
  animalFrequency,
  confidenceBuckets,
  hourlyPattern,
  predictiveInsights,
  weeklySummary,
  weeklyTrend,
  zoneDistribution,
  type PredictiveInsight,
} from "@/lib/data/mock";

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--border)",
  fontSize: 12,
} as React.CSSProperties;

const insightIcons: Record<PredictiveInsight["icon"], React.ElementType> = {
  moon: Moon,
  chart: TrendingUp,
  route: Route,
  battery: BatteryCharging,
  target: Target,
};

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function SummaryStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="py-5 gap-2">
      <CardContent className="px-5">
        <MetricLabel>{label}</MetricLabel>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function InsightsPage() {
  return (
    <AppShell title="AI Insights" subtitle="Patterns learned from your logged events">
      <div className="mx-auto max-w-7xl">
        <PageHeader description="Smart Bijuka learns from every logged event — when intruders come, where they enter, and what actually works.">
          <DemoDataChip />
        </PageHeader>

        {/* Summary */}
        <section id="weekly-summary" aria-label="Weekly summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          <SummaryStat label="Events this week" value={String(weeklySummary.totalEvents)} sub="Across 2 online units" />
          <SummaryStat label="Deterrence success" value={`${Math.round(weeklySummary.deterredRate * 100)}%`} sub="Deterred on first or escalated attempt" />
          <SummaryStat label="Most frequent intruder" value={weeklySummary.topAnimal} sub="31 events · mostly 00:00–04:00" />
          <SummaryStat label="Avg. trigger → response" value={`${weeklySummary.avgResponseSec} s`} sub="PIR wake to deterrent fired" />
        </section>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Intrusion Pattern by Hour</CardTitle>
              <CardDescription>Detections across a 24-hour cycle (7-day aggregate)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyPattern} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={3} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <ReTooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                    <Bar dataKey="events" name="Detections" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Animal Frequency</CardTitle>
              <CardDescription>Classified intruders over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={animalFrequency} layout="vertical" margin={{ top: 4, right: 16, left: 24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="animal" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={86} tickLine={false} axisLine={false} />
                    <ReTooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                    <Bar dataKey="events" name="Events" radius={[0, 3, 3, 0]}>
                      {animalFrequency.map((a) => (
                        <Cell key={a.animal} fill={a.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Response History</CardTitle>
              <CardDescription>Outcome of every deterrent response, per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <ReTooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="deterred" name="Deterred" stackId="a" fill="var(--chart-1)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="partial" name="Partial / escalated" stackId="a" fill="var(--chart-2)" />
                    <Bar dataKey="none" name="No action" stackId="a" fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zone Distribution</CardTitle>
              <CardDescription>Where intrusions happen most — guide for fence repairs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={zoneDistribution}
                      dataKey="events"
                      nameKey="zone"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {zoneDistribution.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Classification Confidence Distribution</CardTitle>
              <CardDescription>
                Model certainty across all logged detections — low-confidence frames are
                flagged for future retraining (roadmap).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={confidenceBuckets} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <ReTooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                    <Bar dataKey="count" name="Detections" fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Predictive insights */}
        <section id="predictive-insights" aria-label="Predictive insights" className="mb-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-chart-2" aria-hidden />
              Predictive Insights
            </h2>
            <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
              Derived from logged event patterns on-device + dashboard analytics
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {predictiveInsights.map((p) => {
              const Icon = insightIcons[p.icon];
              return (
                <Card key={p.id} className="py-5 gap-3">
                  <CardContent className="px-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Icon className="h-4.5 w-4.5" aria-hidden />
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-snug">{p.title}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{p.body}</p>
                    <p className="mt-3 text-[11px] font-medium text-primary">{p.confidence}</p>
                  </CardContent>
                </Card>
              );
            })}
            <Card className="py-5 gap-3 border-dashed">
              <CardContent className="px-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <TrendingUp className="h-4.5 w-4.5" aria-hidden />
                </div>
                <p className="mt-3 text-sm font-semibold leading-snug">Advanced predictive analytics</p>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Weather-correlated forecasting, multi-season modelling and automatic
                  model retraining from low-confidence frames are on the roadmap — not
                  yet part of the demonstrated system.
                </p>
                <Button asChild variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs">
                  <a href="/story#roadmap">See full roadmap <ArrowRight className="h-3 w-3" /></a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
