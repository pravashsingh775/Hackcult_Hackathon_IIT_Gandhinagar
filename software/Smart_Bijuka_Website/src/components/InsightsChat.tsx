import { useEffect, useRef, useState } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "bot";
  text: string;
}

const SUGGESTIONS = [
  "When are intrusions most likely tonight?",
  "Which animal visits my field the most?",
  "How well is the deterrence working?",
  "What should I do about porcupines?",
  "How is the battery holding up?",
];

const KNOWLEDGE: Array<{ match: RegExp; answer: string }> = [
  {
    match: /tonight|peak|risk|when|likely/i,
    answer:
      "Based on your last 7 days of logs, tonight's peak risk window is 21:00–23:00 (22 of 107 weekly intrusions happened at 22:00). Wild boars favor the East vegetable plot in that window. Smart Bijuka will pre-arm adaptive intensity level 3 there before dusk, and you'll get a push alert the moment PIR confirms motion.",
  },
  {
    match: /boar|most|which animal|species|frequent/i,
    answer:
      "Wild boar is your most frequent visitor — 34 of 107 detections this week (32%), almost always in the East vegetable plot between 20:00 and midnight. Deer is second with 28, concentrated in the North paddy. The dog-bark deterrent works best on boars: 97% success at intensity level 3.",
  },
  {
    match: /deter|success|work|effective/i,
    answer:
      "Deterrence success is 96% over the last 7 days (103 of 107 intrusions ended with the animal leaving). Deer respond to tiger growl at level 2, boars to dog bark at level 3, and monkeys to ultrasonic bursts. Only porcupine events escalated (2 this week) — they habituate to sound faster, so the servo scarecrow motion is triggered alongside audio for them.",
  },
  {
    match: /porcupine|escalat/i,
    answer:
      "Porcupines are your hardest visitor: 8 detections, 2 escalated, all in the South maize between 00:00 and 05:00. They habituate to repeated sounds, so I recommend combining siren beep with continuous 180° servo sweeps and rotating sound profiles every few nights. I can enable rotation mode for the South maize zone if you'd like — just say 'rotate sounds'.",
  },
  {
    match: /battery|power|solar|charge/i,
    answer:
      "Your 12V battery is at 87% and charging at 4.2 A under current sun. The LM2596 is holding a stable 5.02 V rail. At your current event rate (~15/night), you have roughly 6 days of autonomy without any sunlight — well beyond typical monsoon cloud cover stretches.",
  },
  {
    match: /human|farmer|false alarm|people/i,
    answer:
      "YOLOv8 classified 6 humans this week — all correctly identified and never deterred (confidence 98–99%). Your false-alarm rate on humans is 0%. Family members walking the farm path are logged for history only, so no one gets scared by their own scarecrow.",
  },
  {
    match: /rotate|sound|profile/i,
    answer:
      "Sound rotation mode scheduled: the South maize zone will now cycle siren beep → ultrasonic burst → dog bark across nights to prevent habituation. I'll watch porcupine outcomes and report back after 3 nights.",
  },
  {
    match: /zone|where|plot|maize|paddy/i,
    answer:
      "Zone hotspot ranking this week: 1) East vegetable plot — 41 events (mostly wild boar, 20:00–00:00). 2) North paddy — 39 (deer & monkey, 21:00–03:00). 3) South maize — 21 (cattle & porcupine, dusk and pre-dawn). The farm path logged 6 human passages, all benign.",
  },
  {
    match: /weather|moon|rain/i,
    answer:
      "Your logs show a clear pattern: intrusions rise ~40% on moonless nights and drop during heavy rain. Tonight is moonless with no rain forecast — expect above-average activity, especially 21:00–23:00. Smart Bijuka has already raised the adaptive intensity baseline for tonight.",
  },
];

const FALLBACK =
  "I analyze your Smart Bijuka event history to answer questions about intrusion timing, species patterns, deterrence success, zones, weather correlation, and device power. Try one of the suggestions below — for example, ask about tonight's peak risk window.";

function respond(input: string): string {
  for (const k of KNOWLEDGE) {
    if (k.match.test(input)) return k.answer;
  }
  return FALLBACK;
}

export default function InsightsChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Namaste! I'm your Smart Bijuka insights assistant. I've analyzed 107 intrusion events from the past 7 days. Ask me about patterns, predictions, or device health.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, typing]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text: respond(trimmed) }]);
      setTyping(false);
    }, 900);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Bot className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold">AI Insights Chatbot</p>
          <p className="text-[11px] text-muted-foreground">Trained on your farm's own event history · coming to the mobile app</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Online
        </span>
      </div>

      <div className="flex h-96 flex-col gap-3 overflow-y-auto p-5" role="log" aria-live="polite">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex items-start gap-2.5", m.role === "user" && "flex-row-reverse")}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full",
                m.role === "bot"
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {m.role === "bot" ? <Bot className="size-3.5" aria-hidden="true" /> : <User className="size-3.5" aria-hidden="true" />}
            </span>
            <p
              className={cn(
                "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                m.role === "bot"
                  ? "bg-muted text-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {m.text}
            </p>
          </div>
        ))}
        {typing && (
          <div className="flex items-start gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Bot className="size-3.5" aria-hidden="true" />
            </span>
            <span className="flex items-center gap-1 rounded-xl bg-muted px-3.5 py-3">
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]"></span>
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]"></span>
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]"></span>
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about intrusion patterns, predictions, or device health…"
            className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            aria-label="Message the AI insights chatbot"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || typing}>
            <Send className="size-4" aria-hidden="true" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
