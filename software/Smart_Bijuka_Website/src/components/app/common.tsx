import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/lib/data/mock";

export function StatusDot({
  state,
  pulse = false,
  className,
}: {
  state: "ok" | "warn" | "error" | "idle";
  pulse?: boolean;
  className?: string;
}) {
  const color =
    state === "ok"
      ? "bg-primary"
      : state === "warn"
        ? "bg-chart-2"
        : state === "error"
          ? "bg-destructive"
          : "bg-muted-foreground/50";
  return (
    <span className={cn("relative flex h-2 w-2", className)}>
      {pulse && (
        <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", color)} />
      )}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", color)} />
    </span>
  );
}

const severityStyles: Record<Severity, string> = {
  low: "bg-secondary text-secondary-foreground border-transparent",
  medium: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  high: "bg-chart-2/20 text-foreground border-chart-2/40",
  critical: "bg-destructive/10 text-destructive border-destructive/30",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge variant="outline" className={cn("capitalize font-medium", severityStyles[severity])}>
      {severity}
    </Badge>
  );
}

export function MetricLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function DemoDataChip() {
  return (
    <Badge variant="outline" className="gap-1.5 text-[11px] font-normal text-muted-foreground border-dashed">
      <span className="h-1.5 w-1.5 rounded-full bg-chart-2" />
      Demo data — ESP32 / backend feed pending
    </Badge>
  );
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
