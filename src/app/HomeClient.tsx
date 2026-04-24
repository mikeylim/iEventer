"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import {
  addEventToPlan,
  removeEventFromPlan,
  saveOptimizedRoute,
} from "@/lib/plans";

// ─── Option Data ──────────────────────────────────────────────
const MOODS = ["😊 Happy", "😴 Bored", "😰 Stressed", "🥳 Adventurous", "😌 Chill", "🤔 Curious"];
const COMPANIONS = ["🙋 Solo", "👫 Partner", "👨‍👩‍👧 Family", "👯 Friends", "🐕 With Pets"];
const BUDGETS = ["🆓 Free", "💵 Under $20", "💰 Under $50", "💎 Any Budget"];
const VIBES = [
  "🏃 Active / Outdoors",
  "🎨 Creative / Artsy",
  "🍽️ Food & Drinks",
  "📚 Learning / Culture",
  "🎮 Games & Fun",
  "🎵 Music & Shows",
  "🧘 Relaxation",
  "🌿 Nature",
];

const WHEN_FILTERS = [
  { value: "all", label: "Any Time" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this_weekend", label: "This Weekend" },
  { value: "this_week", label: "This Week" },
] as const;

const PRICE_FILTERS = [
  { value: "all", label: "Any Price" },
  { value: "free", label: "🆓 Free" },
  { value: "paid", label: "💰 Paid" },
] as const;

type WhenFilter = (typeof WHEN_FILTERS)[number]["value"];
type PriceFilter = (typeof PRICE_FILTERS)[number]["value"];

// ─── Types ────────────────────────────────────────────────────
interface Suggestion {
  title: string;
  emoji: string;
  description: string;
  steps: string[];
  details: {
    difficulty: string;
    cost: string;
    duration: string;
    bestFor: string;
    location: string;
  };
  searchKeyword: string;
}

interface EventItem {
  id: string;
  name: string;
  description: string;
  url: string;
  start: string;
  category: string;
  venue: { name: string; city: string; address: string } | null;
  isFree: boolean;
  logo: string | null;
  // Populated for signed-in users after the event is persisted to the DB
  planEventId?: string;
}

interface RouteStop {
  order: number;
  eventName: string;
  eventUrl: string;
  time: string;
  travelTip: string;
  reason: string;
}

interface RoutePlan {
  route: RouteStop[];
  summary: string;
  tips: string[];
  estimatedTotalTime: string;
  estimatedTotalCost: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function filterByWhen(events: EventItem[], when: WhenFilter): EventItem[] {
  if (when === "all") return events;

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Find next Saturday & Sunday
  const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
  const daysToSat = (6 - dayOfWeek + 7) % 7 || 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + (dayOfWeek === 6 ? 0 : daysToSat));
  const satStr = saturday.toISOString().split("T")[0];
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  const sunStr = sunday.toISOString().split("T")[0];

  // End of this week (Sunday)
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - dayOfWeek));
  const endOfWeekStr = endOfWeek.toISOString().split("T")[0];

  return events.filter((e) => {
    if (!e.start) return false;
    const eventDate = e.start.split("T")[0];
    switch (when) {
      case "today":
        return eventDate === todayStr;
      case "tomorrow":
        return eventDate === tomorrowStr;
      case "this_weekend":
        return eventDate === satStr || eventDate === sunStr;
      case "this_week":
        return eventDate >= todayStr && eventDate <= endOfWeekStr;
      default:
        return true;
    }
  });
}

function filterByPrice(events: EventItem[], price: PriceFilter): EventItem[] {
  if (price === "all") return events;
  if (price === "free") return events.filter((e) => e.isFree);
  return events.filter((e) => !e.isFree);
}

function filterByCategory(events: EventItem[], category: string): EventItem[] {
  if (!category) return events;
  return events.filter((e) => e.category === category);
}

// ─── Pill Selector Component ─────────────────────────────────
function PillSelect({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold text-foreground/70 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer
                ${
                  active
                    ? "bg-primary text-white border-primary shadow-md scale-105"
                    : "bg-white text-foreground/70 border-foreground/15 hover:border-primary/50 hover:bg-primary/5"
                }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Suggestion Card ─────────────────────────────────────────
function SuggestionCard({
  s,
  onFindEvents,
}: {
  s: Suggestion;
  onFindEvents: (keyword: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="animate-fade-in bg-white rounded-2xl shadow-md border border-foreground/5 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl">{s.emoji}</span>
          <div>
            <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
            <p className="text-sm text-muted mt-1">{s.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          {[
            { label: "Cost", value: s.details.cost },
            { label: "Duration", value: s.details.duration },
            { label: "Difficulty", value: s.details.difficulty },
            { label: "Best For", value: s.details.bestFor },
          ].map((d) => (
            <div key={d.label} className="bg-background rounded-lg px-3 py-2">
              <p className="text-xs text-muted">{d.label}</p>
              <p className="text-sm font-medium">{d.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 bg-primary/5 rounded-lg px-3 py-2">
          <p className="text-xs text-primary font-semibold">📍 Where</p>
          <p className="text-sm">{s.details.location}</p>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm font-semibold text-primary hover:text-primary-light transition-colors cursor-pointer"
        >
          {expanded ? "Hide steps ▲" : "How to do it ▼"}
        </button>
        {expanded && (
          <ol className="mt-2 space-y-1.5 text-sm text-foreground/80 list-decimal list-inside">
            {s.steps.map((step, i) => (
              <li key={i} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* 1. Centered button */}
      <div className="border-t border-foreground/5 px-5 py-3 bg-background/50 flex justify-center">
        <button
          onClick={() => onFindEvents(s.searchKeyword)}
          className="text-sm font-semibold text-primary hover:text-white hover:bg-primary px-4 py-1.5 rounded-full border border-primary transition-all cursor-pointer"
        >
          🔍 Find Related Events Nearby
        </button>
      </div>
    </div>
  );
}

// ─── Event Card ──────────────────────────────────────────────
function EventCard({
  e,
  onAddToPlan,
  isInPlan,
}: {
  e: EventItem;
  onAddToPlan: (e: EventItem) => void;
  isInPlan: boolean;
}) {
  const date = e.start
    ? new Date(e.start).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="animate-fade-in bg-white rounded-xl shadow-sm border border-foreground/5 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {e.logo && (
        <img src={e.logo} alt="" className="w-full h-32 object-cover" />
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h4 className="font-semibold text-sm leading-snug line-clamp-2">
          {e.name}
        </h4>
        {date && <p className="text-xs text-muted mt-1">📅 {date}</p>}
        {e.venue && (
          <p className="text-xs text-muted mt-0.5">
            📍 {e.venue.name}
            {e.venue.city ? `, ${e.venue.city}` : ""}
          </p>
        )}
        {e.isFree && (
          <span className="inline-block mt-2 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
            FREE
          </span>
        )}

        <div className="mt-auto pt-3 flex flex-col gap-2">
          <a
            href={e.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm font-bold text-white bg-primary hover:bg-primary-light rounded-lg px-3 py-2 transition-colors"
          >
            View Event →
          </a>
          <button
            onClick={() => onAddToPlan(e)}
            disabled={isInPlan}
            className={`text-center text-sm font-semibold rounded-lg px-3 py-2 border transition-all cursor-pointer
              ${
                isInPlan
                  ? "bg-green-50 text-green-600 border-green-200 cursor-default"
                  : "text-accent border-accent hover:bg-accent hover:text-white"
              }`}
          >
            {isInPlan ? "✓ Added to Plan" : "+ Add to Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Panel ──────────────────────────────────────────────
function PlanPanel({
  plan,
  onRemove,
  onOptimize,
  optimizing,
  routePlan,
}: {
  plan: EventItem[];
  onRemove: (id: string) => void;
  onOptimize: () => void;
  optimizing: boolean;
  routePlan: RoutePlan | null;
}) {
  if (plan.length === 0 && !routePlan) return null;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-accent/20 p-5 mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          📋 My Plan
          <span className="text-sm font-normal text-muted">
            ({plan.length} event{plan.length !== 1 ? "s" : ""})
          </span>
        </h2>
      </div>

      {plan.length > 0 && (
        <div className="space-y-2 mb-4">
          {plan.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between bg-background rounded-lg px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{e.name}</p>
                <p className="text-xs text-muted">
                  {e.start
                    ? new Date(e.start).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "Flexible time"}
                  {e.venue ? ` · ${e.venue.name}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline whitespace-nowrap"
                >
                  View →
                </a>
                <button
                  onClick={() => onRemove(e.id)}
                  className="text-xs text-red-400 hover:text-red-600 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {plan.length >= 2 && (
        <button
          onClick={onOptimize}
          disabled={optimizing}
          className={`w-full py-3 rounded-full text-white font-bold text-sm transition-all cursor-pointer
            ${
              optimizing
                ? "bg-muted cursor-not-allowed"
                : "bg-gradient-to-r from-accent to-orange-500 hover:from-orange-500 hover:to-accent shadow-md"
            }`}
        >
          {optimizing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⚙️</span> AI is planning your route...
            </span>
          ) : (
            "🗺️ Optimize My Route with AI"
          )}
        </button>
      )}

      {plan.length === 1 && !routePlan && (
        <p className="text-xs text-muted text-center">
          Add at least 2 events to optimize your route
        </p>
      )}

      {routePlan && (
        <div className="mt-5 border-t border-foreground/5 pt-5">
          <h3 className="text-lg font-bold mb-2">🗺️ Your Optimized Route</h3>
          <p className="text-sm text-muted mb-4">{routePlan.summary}</p>

          <div className="space-y-0">
            {routePlan.route.map((stop, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {stop.order}
                  </div>
                  {i < routePlan.route.length - 1 && (
                    <div className="w-0.5 h-full min-h-[40px] bg-primary/20" />
                  )}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{stop.eventName}</p>
                      <p className="text-xs text-accent font-medium mt-0.5">
                        🕐 {stop.time}
                      </p>
                    </div>
                    {stop.eventUrl && stop.eventUrl !== "N/A" && (
                      <a
                        href={stop.eventUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-white bg-primary hover:bg-primary-light px-3 py-1 rounded-full shrink-0 transition-colors"
                      >
                        Go →
                      </a>
                    )}
                  </div>
                  {stop.travelTip && (
                    <p className="text-xs text-muted mt-1">
                      🚗 {stop.travelTip}
                    </p>
                  )}
                  <p className="text-xs text-foreground/60 mt-0.5 italic">
                    {stop.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-background rounded-lg px-3 py-2">
              <p className="text-xs text-muted">Total Time</p>
              <p className="text-sm font-semibold">
                {routePlan.estimatedTotalTime}
              </p>
            </div>
            <div className="bg-background rounded-lg px-3 py-2">
              <p className="text-xs text-muted">Est. Cost</p>
              <p className="text-sm font-semibold">
                {routePlan.estimatedTotalCost}
              </p>
            </div>
          </div>

          {routePlan.tips && routePlan.tips.length > 0 && (
            <div className="mt-3 bg-accent/5 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-accent mb-1">
                💡 Pro Tips
              </p>
              <ul className="text-xs text-foreground/70 space-y-0.5">
                {routePlan.tips.map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export interface HomeClientProps {
  isSignedIn: boolean;
  planId: string | null;
  initialLocation: string;
  initialPlan: EventItem[];
  initialRoutePlan: RoutePlan | null;
}

export default function HomeClient({
  isSignedIn,
  planId,
  initialLocation,
  initialPlan,
  initialRoutePlan,
}: HomeClientProps) {
  // Input mode
  const [mode, setMode] = useState<"type" | "pick">("type");
  const [prompt, setPrompt] = useState("");
  const [location, setLocation] = useState(initialLocation);

  // Option-picker state
  const [moods, setMoods] = useState<string[]>([]);
  const [companions, setCompanions] = useState<string[]>([]);
  const [budget, setBudget] = useState<string[]>([]);
  const [vibes, setVibes] = useState<string[]>([]);

  // Results
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState("");

  // Events pagination, sorting & scroll ref
  const eventsSectionRef = useRef<HTMLDivElement>(null);
  const [eventsContinuation, setEventsContinuation] = useState<string | null>(null);
  const [eventsLoadingMore, setEventsLoadingMore] = useState(false);
  const [whenFilter, setWhenFilter] = useState<WhenFilter>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [eventsQuery, setEventsQuery] = useState("");

  // Suggestions "load more"
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const lastPromptBody = useRef<Record<string, unknown> | null>(null);

  // Plan & route — initial values come from the server for signed-in users
  const [plan, setPlan] = useState<EventItem[]>(initialPlan);
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(initialRoutePlan);
  const [optimizing, setOptimizing] = useState(false);
  const [, startTransition] = useTransition();

  const toggle = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const planIds = new Set(plan.map((e) => e.id));

  function addToPlan(e: EventItem) {
    if (planIds.has(e.id)) return;

    // Optimistic update for both signed-in and anonymous users
    setPlan((prev) => [...prev, e]);
    setRoutePlan(null);

    if (isSignedIn && planId) {
      startTransition(async () => {
        try {
          const saved = await addEventToPlan(planId, {
            sourceProvider: "eventbrite",
            sourceId: e.id,
            name: e.name,
            description: e.description,
            url: e.url,
            startAt: e.start || null,
            venueName: e.venue?.name || null,
            venueAddress: e.venue?.address || null,
            category: e.category || null,
            isFree: e.isFree,
            imageUrl: e.logo || null,
          });
          // Attach the DB id so we can delete by it later
          setPlan((prev) =>
            prev.map((p) =>
              p.id === e.id ? { ...p, planEventId: saved.id } : p
            )
          );
        } catch (err) {
          console.error("Failed to save event to plan:", err);
          // Roll back optimistic add
          setPlan((prev) => prev.filter((p) => p.id !== e.id));
        }
      });
    }
  }

  function removeFromPlan(id: string) {
    const target = plan.find((p) => p.id === id);
    setPlan((prev) => prev.filter((e) => e.id !== id));
    setRoutePlan(null);

    if (isSignedIn && target?.planEventId) {
      startTransition(async () => {
        try {
          await removeEventFromPlan(target.planEventId!);
        } catch (err) {
          console.error("Failed to remove event from plan:", err);
          // Roll back optimistic removal
          if (target) setPlan((prev) => [...prev, target]);
        }
      });
    }
  }

  async function optimizeRoute() {
    setOptimizing(true);
    setRoutePlan(null);
    try {
      const res = await fetch("/api/optimize-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: plan, location }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRoutePlan(data);
      // Cache the route on the server for signed-in users
      if (isSignedIn && planId) {
        saveOptimizedRoute(planId, data).catch((err) =>
          console.error("Failed to save optimized route:", err)
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to optimize route");
    } finally {
      setOptimizing(false);
    }
  }

  // ─── Suggestions ───────────────────────────────────────────
  async function handleSubmit() {
    setLoading(true);
    setError("");
    setSuggestions([]);
    setEvents([]);
    setEventsContinuation(null);

    const body =
      mode === "type"
        ? { prompt: `${prompt}${location ? `. I'm in/near ${location}` : ""}` }
        : {
            preferences: {
              mood: moods,
              companions,
              budget,
              vibes,
              location,
            },
          };

    lastPromptBody.current = body;

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuggestions(data.suggestions || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // 4. Load more suggestions from Gemini
  async function loadMoreSuggestions() {
    if (!lastPromptBody.current) return;
    setSuggestionsLoading(true);
    try {
      const body = {
        ...lastPromptBody.current,
        count: 4,
        exclude: suggestions.map((s) => s.title),
      };
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuggestions((prev) => [...prev, ...(data.suggestions || [])]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSuggestionsLoading(false);
    }
  }

  // ─── Events ────────────────────────────────────────────────
  const fetchEvents = useCallback(
    async (keyword: string) => {
      setEventsLoading(true);
      setEvents([]);
      setEventsContinuation(null);
      setEventsQuery(keyword);
      try {
        const params = new URLSearchParams({ q: keyword, page_size: "10" });
        if (location) params.set("location", location);
        const res = await fetch(`/api/events?${params.toString()}`);
        const data = await res.json();
        setEvents(data.events || []);
        setEventsContinuation(data.continuation || null);
        // Scroll to events section after state updates
        setTimeout(() => {
          eventsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } catch {
        // silently fail
      } finally {
        setEventsLoading(false);
      }
    },
    [location]
  );

  // 3. Load more events (infinite scroll / button)
  async function loadMoreEvents() {
    if (!eventsContinuation || eventsLoadingMore) return;
    setEventsLoadingMore(true);
    try {
      const params = new URLSearchParams({
        q: eventsQuery,
        page_size: "10",
        continuation: eventsContinuation,
      });
      if (location) params.set("location", location);
      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      setEvents((prev) => [...prev, ...(data.events || [])]);
      setEventsContinuation(data.continuation || null);
    } catch {
      // silently fail
    } finally {
      setEventsLoadingMore(false);
    }
  }

  const canSubmit =
    mode === "type"
      ? prompt.trim().length > 0
      : moods.length > 0 || vibes.length > 0;

  // Apply filters
  const filteredByWhen = filterByWhen(events, whenFilter);
  const filteredByPrice = filterByPrice(filteredByWhen, priceFilter);
  const filteredByCategory = filterByCategory(filteredByPrice, categoryFilter);
  const displayEvents = [...filteredByCategory].sort(
    (a, b) => new Date(a.start || "9999").getTime() - new Date(b.start || "9999").getTime()
  );

  // Gather unique categories from loaded events for dynamic filter
  const availableCategories = [...new Set(events.map((e) => e.category).filter(Boolean))];

  return (
    <div className="flex flex-col flex-1">
      {/* Hero */}
      <header className="bg-gradient-to-br from-primary via-primary-light to-indigo-400 text-white py-12 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          🎉 iEventer
        </h1>
        <p className="mt-3 text-lg text-white/80 max-w-lg mx-auto">
          Bored? Not sure what to do? Let AI find your next adventure —
          activities, events, and hidden gems near you.
        </p>
        {plan.length > 0 && (
          <div className="mt-4">
            <a
              href="#my-plan"
              className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/30 transition-colors"
            >
              📋 My Plan ({plan.length}) — View below
            </a>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {/* Mode toggle */}
        <div className="flex justify-center gap-2 mb-6">
          {(["type", "pick"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer
                ${
                  mode === m
                    ? "bg-primary text-white shadow-md"
                    : "bg-white text-foreground/60 border border-foreground/10 hover:border-primary/40"
                }`}
            >
              {m === "type" ? "✍️ Type It" : "🎯 Pick Options"}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="bg-white rounded-2xl shadow-md border border-foreground/5 p-6 mb-8">
          {mode === "type" ? (
            <>
              <label className="block text-sm font-semibold text-foreground/70 mb-2">
                What are you in the mood for?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. I'm bored on a Saturday with friends, we have no money but want to do something fun outdoors..."
                rows={3}
                className="w-full rounded-xl border border-foreground/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </>
          ) : (
            <>
              <PillSelect
                label="How are you feeling?"
                options={MOODS}
                selected={moods}
                onToggle={(v) => toggle(moods, v, setMoods)}
              />
              <PillSelect
                label="Who's joining?"
                options={COMPANIONS}
                selected={companions}
                onToggle={(v) => toggle(companions, v, setCompanions)}
              />
              <PillSelect
                label="Budget"
                options={BUDGETS}
                selected={budget}
                onToggle={(v) => toggle(budget, v, setBudget)}
              />
              <PillSelect
                label="What vibes are you looking for?"
                options={VIBES}
                selected={vibes}
                onToggle={(v) => toggle(vibes, v, setVibes)}
              />
            </>
          )}

          <div className="mt-4">
            <label className="block text-sm font-semibold text-foreground/70 mb-2">
              📍 Your location (optional, for nearby events)
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="w-full rounded-xl border border-foreground/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className={`mt-5 w-full py-3 rounded-full text-white font-bold text-base transition-all cursor-pointer
              ${
                canSubmit && !loading
                  ? "bg-primary hover:bg-primary-light shadow-md glow"
                  : "bg-muted cursor-not-allowed"
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚙️</span> Finding fun stuff...
              </span>
            ) : (
              "✨ Find Something Fun!"
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm mb-6 border border-red-200">
            {error}
          </div>
        )}

        {/* Plan Panel */}
        <div id="my-plan">
          <PlanPanel
            plan={plan}
            onRemove={removeFromPlan}
            onOptimize={optimizeRoute}
            optimizing={optimizing}
            routePlan={routePlan}
          />
        </div>

        {/* 4. Suggestions — with Load More */}
        {suggestions.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">
              🎯 Here&apos;s What We Found
            </h2>
            <div className="grid gap-5">
              {suggestions.map((s, i) => (
                <SuggestionCard key={i} s={s} onFindEvents={fetchEvents} />
              ))}
            </div>
            <div className="mt-5 text-center">
              <button
                onClick={loadMoreSuggestions}
                disabled={suggestionsLoading}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold border transition-all cursor-pointer
                  ${
                    suggestionsLoading
                      ? "bg-muted text-white border-muted cursor-not-allowed"
                      : "text-primary border-primary hover:bg-primary hover:text-white"
                  }`}
              >
                {suggestionsLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚙️</span> Generating more...
                  </span>
                ) : (
                  "💡 Show Me More Ideas"
                )}
              </button>
            </div>
          </section>
        )}

        {/* Events loading */}
        <div ref={eventsSectionRef} />
        {eventsLoading && (
          <div className="text-center text-muted py-8">
            <span className="animate-spin inline-block mr-2">⚙️</span>
            Searching nearby events...
          </div>
        )}

        {/* 2 & 3. Events — with sort/filter + infinite scroll */}
        {events.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-3">
              📍 Related Events Near You
            </h2>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-foreground/5 p-4 mb-4 space-y-3">
              {/* When */}
              <div>
                <p className="text-xs font-semibold text-foreground/50 mb-1.5">When</p>
                <div className="flex flex-wrap gap-1.5">
                  {WHEN_FILTERS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setWhenFilter(opt.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer
                        ${
                          whenFilter === opt.value
                            ? "bg-primary text-white border-primary"
                            : "bg-background text-foreground/60 border-foreground/10 hover:border-primary/40"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <p className="text-xs font-semibold text-foreground/50 mb-1.5">Price</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_FILTERS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPriceFilter(opt.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer
                        ${
                          priceFilter === opt.value
                            ? "bg-primary text-white border-primary"
                            : "bg-background text-foreground/60 border-foreground/10 hover:border-primary/40"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category — dynamic from results */}
              {availableCategories.length > 1 && (
                <div>
                  <p className="text-xs font-semibold text-foreground/50 mb-1.5">Category</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setCategoryFilter("")}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer
                        ${
                          !categoryFilter
                            ? "bg-primary text-white border-primary"
                            : "bg-background text-foreground/60 border-foreground/10 hover:border-primary/40"
                        }`}
                    >
                      All
                    </button>
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer
                          ${
                            categoryFilter === cat
                              ? "bg-primary text-white border-primary"
                              : "bg-background text-foreground/60 border-foreground/10 hover:border-primary/40"
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active filter count */}
              {(whenFilter !== "all" || priceFilter !== "all" || categoryFilter) && (
                <div className="flex items-center justify-between pt-1 border-t border-foreground/5">
                  <p className="text-xs text-muted">
                    Showing {displayEvents.length} of {events.length} events
                  </p>
                  <button
                    onClick={() => {
                      setWhenFilter("all");
                      setPriceFilter("all");
                      setCategoryFilter("");
                    }}
                    className="text-xs text-red-400 hover:text-red-600 cursor-pointer"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {/* Event grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayEvents.map((e) => (
                <EventCard
                  key={e.id}
                  e={e}
                  onAddToPlan={addToPlan}
                  isInPlan={planIds.has(e.id)}
                />
              ))}
            </div>

            {/* Load more events */}
            {eventsContinuation && (
              <div className="mt-5 text-center">
                <button
                  onClick={loadMoreEvents}
                  disabled={eventsLoadingMore}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold border transition-all cursor-pointer
                    ${
                      eventsLoadingMore
                        ? "bg-muted text-white border-muted cursor-not-allowed"
                        : "text-primary border-primary hover:bg-primary hover:text-white"
                    }`}
                >
                  {eventsLoadingMore ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⚙️</span> Loading more...
                    </span>
                  ) : (
                    "Load More Events ↓"
                  )}
                </button>
              </div>
            )}

            {displayEvents.length === 0 && events.length > 0 && (
              <p className="text-center text-sm text-muted py-4">
                No events match your filters. Try adjusting or clearing them.
              </p>
            )}
          </section>
        )}
      </main>

      <footer className="text-center text-xs text-muted py-6 border-t border-foreground/5">
        Built with Gemini AI + Eventbrite &middot; iEventer &copy; 2026
      </footer>
    </div>
  );
}
