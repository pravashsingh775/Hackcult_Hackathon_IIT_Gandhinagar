import * as React from "react";
import { Sprout, ShieldCheck, Info, ArrowRight } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { HERO_IMAGE_URL } from "@/lib/data/mock";

export default function SignIn() {
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info(
      "Authentication is not connected yet — taking you to the demo dashboard.",
      { duration: 4000 }
    );
    setTimeout(() => {
      window.location.href = "/index";
    }, 900);
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Toaster position="top-center" richColors />

      {/* Story panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground">
        <img
          src={HERO_IMAGE_URL}
          alt="Smart Bijuka guardian device mounted in a green crop field"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sidebar/70 via-sidebar/85 to-sidebar" />
        <a href="/story" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sprout className="h-4.5 w-4.5" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block font-semibold text-sm">Smart Bijuka</span>
            <span className="block text-[11px] opacity-70">AI-Enabled Smart DigiKhet Protector</span>
          </span>
        </a>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-snug">
            The scarecrow that thinks — guarding your field while you sleep.
          </h2>
          <p className="mt-4 text-sm leading-relaxed opacity-80">
            PIR motion detection wakes the ESP32-CAM. YOLOv8 decides whether it's a
            person or an animal. The right sound, at the right volume, from a head
            that sweeps 180° — until the intruder leaves.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {["Human-vs-animal classification", "Animal-specific audio deterrence", "Solar-powered, weatherproof, field-ready"].map((f) => (
              <li key={f} className="flex items-center gap-2.5 opacity-90">
                <ShieldCheck className="h-4 w-4 text-sidebar-primary shrink-0" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs opacity-60">
          Patil Farm · Nashik, Maharashtra — protecting 5.1 acres with 3 units
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-sm">
          <a href="/story" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sprout className="h-4.5 w-4.5" aria-hidden />
            </span>
            <span className="font-semibold">Smart Bijuka</span>
          </a>

          <h1 className="text-2xl font-semibold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to monitor your fields and guardians."
              : "Start protecting your field with Smart Bijuka."}
          </p>

          <Card className="mt-6">
            <CardContent className="px-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" placeholder="Ramesh Patil" className="mt-1.5" autoComplete="name" />
                  </div>
                )}
                <div>
                  <Label htmlFor="phone">Mobile number or email</Label>
                  <Input id="phone" placeholder="+91 98XXX XX210" className="mt-1.5" autoComplete="username" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" className="mt-1.5" autoComplete={mode === "signin" ? "current-password" : "new-password"} />
                </div>

                <div className="flex items-start gap-2.5 rounded-lg border border-chart-2/40 bg-chart-2/5 px-3 py-2.5 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-chart-2" aria-hidden />
                  <p>
                    Real authentication is pending — enable Backends to activate secure
                    farmer accounts. For now, submitting opens the demo dashboard.
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  {mode === "signin" ? "Sign in" : "Create account"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                New to Smart Bijuka?{" "}
                <button className="font-medium text-primary hover:underline" onClick={() => setMode("signup")}>
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button className="font-medium text-primary hover:underline" onClick={() => setMode("signin")}>
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Just exploring?{" "}
            <a href="/index" className="font-medium text-primary hover:underline">
              Open the demo dashboard
            </a>{" "}
            ·{" "}
            <a href="/story" className="font-medium text-primary hover:underline">
              Read the product story
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
