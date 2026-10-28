import * as React from "react";
import {
  LayoutDashboard,
  MonitorPlay,
  History,
  BrainCircuit,
  Cpu,
  Settings,
  Sprout,
  Bell,
  Menu,
  X,
  Wifi,
  WifiOff,
  LogOut,
  User,
  BookOpen,
  ChevronDown,
  CircleAlert,
  Info,
  TriangleAlert,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { alerts as mockAlerts, currentUser, devices } from "@/lib/data/mock";

export const NAV_ITEMS = [
  { href: "/index", label: "Dashboard", icon: LayoutDashboard },
  { href: "/monitor", label: "Live Monitor", icon: MonitorPlay },
  { href: "/history", label: "History & Events", icon: History },
  { href: "/insights", label: "AI Insights", icon: BrainCircuit },
  { href: "/devices", label: "Devices & Fields", icon: Cpu },
  { href: "/settings", label: "Settings", icon: Settings },
];

const LOGO = (
  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
    <Sprout className="h-4.5 w-4.5" aria-hidden />
  </span>
);

function pathMatches(href: string, path: string) {
  if (href === "/index") return path === "/" || path === "/index";
  return path.startsWith(href);
}

function ConnectionPill({ online }: { online: boolean }) {
  return (
    <Badge
      variant={online ? "secondary" : "destructive"}
      className="gap-1.5 font-medium"
    >
      {online ? (
        <Wifi className="h-3 w-3 text-primary" aria-hidden />
      ) : (
        <WifiOff className="h-3 w-3" aria-hidden />
      )}
      {online ? "Connected" : "Offline"}
    </Badge>
  );
}

function levelIcon(level: string) {
  if (level === "critical")
    return <CircleAlert className="h-4 w-4 text-destructive" aria-hidden />;
  if (level === "warning")
    return <TriangleAlert className="h-4 w-4 text-chart-2" aria-hidden />;
  return <Info className="h-4 w-4 text-muted-foreground" aria-hidden />;
}

function SidebarContent({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <a href="/story" className="flex items-center gap-2.5 px-5 pt-5 pb-6">
        {LOGO}
        <span className="leading-tight">
          <span className="block font-semibold text-sm text-sidebar-foreground">
            Smart Bijuka
          </span>
          <span className="block text-[11px] text-sidebar-foreground/60">
            DigiKhet Protector
          </span>
        </span>
      </a>
      <nav className="flex-1 px-3 space-y-1" aria-label="Main">
        {NAV_ITEMS.map((item) => {
          const active = pathMatches(item.href, path);
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5", active && "text-sidebar-primary")} aria-hidden />
              {item.label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
              )}
            </a>
          );
        })}
      </nav>
      <div className="px-3 pb-3">
        <a
          href="/story"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors"
        >
          <BookOpen className="h-4.5 w-4.5" aria-hidden />
          The Scarecrow That Thinks
        </a>
      </div>
      <div className="mx-3 mb-4 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sidebar-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sidebar-primary" />
          </span>
          2 of 3 units online
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-sidebar-foreground/60">
          Fleet firmware v1.4.2 · Last sync 1 min ago
        </p>
      </div>
    </div>
  );
}

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AppShell({ title, subtitle, children }: AppShellProps) {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [online, setOnline] = React.useState(true);
  const [alerts, setAlerts] = React.useState(mockAlerts);
  const [selectedDevice, setSelectedDevice] = React.useState("SB-01");

  React.useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const unacked = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background">
      <Toaster position="top-right" richColors />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 flex-col bg-sidebar border-r border-sidebar-border sticky top-0 h-screen">
        <SidebarContent path={path} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-sidebar shadow-xl">
            <button
              className="absolute right-3 top-4 rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent path={path} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Offline banner */}
        {!online && (
          <div className="bg-chart-2 text-foreground px-4 py-2 text-center text-xs font-medium">
            You are offline — showing the last synced data. Live telemetry will
            resume automatically when the connection returns.
          </div>
        )}

        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              className="lg:hidden rounded-md p-2 text-muted-foreground hover:bg-muted"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base sm:text-lg font-semibold leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="hidden sm:block truncate text-xs text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>

            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger className="w-[150px] sm:w-[190px]" size="sm" aria-label="Active device">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {devices.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          d.connection === "online"
                            ? "bg-primary"
                            : d.connection === "degraded"
                              ? "bg-chart-2"
                              : "bg-destructive"
                        )}
                      />
                      {d.id} · {d.name.split(" ")[0]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="hidden sm:block">
              <ConnectionPill online={online} />
            </div>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications (${unacked} unread)`}>
                  <Bell className="h-4.5 w-4.5" />
                  {unacked > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
                      {unacked}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0">
                <DropdownMenuLabel className="flex items-center justify-between">
                  Notifications
                  {unacked > 0 && (
                    <button
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={() =>
                        setAlerts((prev) =>
                          prev.map((a) => ({ ...a, acknowledged: true }))
                        )
                      }
                    >
                      Mark all read
                    </button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  {alerts.map((a) => (
                    <div
                      key={a.id}
                      className={cn(
                        "flex gap-3 px-4 py-3 text-sm hover:bg-muted/60 transition-colors",
                        !a.acknowledged && "bg-accent/40"
                      )}
                    >
                      <span className="mt-0.5 shrink-0">{levelIcon(a.level)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">{a.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                          {a.body}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {a.minutesAgo < 60
                            ? `${a.minutesAgo} min ago`
                            : `${Math.round(a.minutesAgo / 60)} h ago`}
                        </p>
                      </div>
                      {!a.acknowledged && (
                        <button
                          className="shrink-0 self-start rounded p-1 text-muted-foreground hover:text-primary"
                          aria-label={`Acknowledge: ${a.title}`}
                          onClick={() =>
                            setAlerts((prev) =>
                              prev.map((x) =>
                                x.id === a.id ? { ...x, acknowledged: true } : x
                              )
                            )
                          }
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/history">View full event history</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-muted transition-colors" aria-label="Account menu">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      RP
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    {currentUser.farm}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/settings">
                    <User className="h-4 w-4" /> Profile &amp; Settings
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/devices">
                    <Cpu className="h-4 w-4" /> My Devices
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/signin">
                    <LogOut className="h-4 w-4" /> Sign out
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
