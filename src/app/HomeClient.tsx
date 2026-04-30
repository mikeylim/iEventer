"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import { Sparkles, MapPin, X, Map as MapIcon, Loader2, Filter } from "lucide-react";
import {
  addEventToPlan,
  removeEventFromPlan,
  saveOptimizedRoute,
} from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyPickCard } from "@/components/DailyPickCard";
import {
  EventCard,
  type EventItem,
} from "@/components/EventCard";
import {
  AISuggestionCard,
  type Suggestion,
} from "@/components/AISuggestionCard";
import {
  RouteTimelineNode,
  type RouteStop,
} from "@/components/RouteTimelineNode";
import { cn } from "@/lib/utils";

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
  { value: "this_weekend", label: "Weekend" },
  { value: "this_week", label: "This Week" },
] as const;

const PRICE_FILTERS = [
  { value: "all", label: "Any Price" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
] as const;

type WhenFilter = (typeof WHEN_FILTERS)[number]["value"];
type PriceFilter = (typeof PRICE_FILTERS)[number]["value"];

// ─── Types ────────────────────────────────────────────────────
interface RoutePlan {
  route: RouteStop[];
  summary: string;
  tips: string[];
  estimatedTotalTime: string;
  estimatedTotalCost: string;
}

type DailyPickEvent = EventItem;

interface SerializedDailyPick {
  id: string;
  pickDate: string;
  reason: string;
  event: DailyPickEvent;
  seenAt: string | null;
  dismissedAt: string | null;
}

export interface HomeClientProps {
  isSignedIn: boolean;
  planId: string | null;
  initialLocation: string;
  initialPlan: EventItem[];
  initialRoutePlan: RoutePlan | null;
  dailyPick: SerializedDailyPick | null;
}

// ─── Filter helpers ──────────────────────────────────────────
function filterByWhen(events: EventItem[], when: WhenFilter): EventItem[] {
  if (when === "all") return events;
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const dayOfWeek = now.getDay();
  const daysToSat = (6 - dayOfWeek + 7) % 7 || 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + (dayOfWeek === 6 ? 0 : daysToSat));
  const satStr = saturday.toISOString().split("T")[0];
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  const sunStr = sunday.toISOString().split("T")[0];
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

// ─── Pill Selector ───────────────────────────────────────────
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
    <div>
      <label className="text-sm font-medium mb-2 block text-muted-foreground">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <Badge
              key={opt}
              variant={active ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1.5"
              onClick={() => onToggle(opt)}
            >
              {opt}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function HomeClient({
  isSignedIn,
  planId,
  initialLocation,
  initialPlan,
  initialRoutePlan,
  dailyPick,
}: HomeClientProps) {
  const [mode, setMode] = useState<"type" | "pick">("type");
  const [prompt, setPrompt] = useState("");
  const [location, setLocation] = useState(initialLocation);

  const [moods, setMoods] = useState<string[]>([]);
  const [companions, setCompanions] = useState<string[]>([]);
  const [budget, setBudget] = useState<string[]>([]);
  const [vibes, setVibes] = useState<string[]>([]);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState("");

  const eventsSectionRef = useRef<HTMLDivElement>(null);
  const [eventsContinuation, setEventsContinuation] = useState<string | null>(null);
  const [eventsLoadingMore, setEventsLoadingMore] = useState(false);
  const [whenFilter, setWhenFilter] = useState<WhenFilter>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [eventsQuery, setEventsQuery] = useState("");

  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const lastPromptBody = useRef<Record<string, unknown> | null>(null);

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
          setPlan((prev) =>
            prev.map((p) =>
              p.id === e.id ? { ...p, planEventId: saved.id } : p
            )
          );
        } catch (err) {
          console.error("Failed to save event to plan:", err);
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
        setTimeout(() => {
          eventsSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      } catch {
        // silently fail
      } finally {
        setEventsLoading(false);
      }
    },
    [location]
  );

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

  const filteredByWhen = filterByWhen(events, whenFilter);
  const filteredByPrice = filterByPrice(filteredByWhen, priceFilter);
  const filteredByCategory = filterByCategory(filteredByPrice, categoryFilter);
  const displayEvents = [...filteredByCategory].sort(
    (a, b) =>
      new Date(a.start || "9999").getTime() -
      new Date(b.start || "9999").getTime()
  );

  const availableCategories = [
    ...new Set(events.map((e) => e.category).filter(Boolean)),
  ];

  const hasFiltersActive =
    whenFilter !== "all" || priceFilter !== "all" || !!categoryFilter;

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-12">
      {/* Daily surprise pick */}
      {dailyPick && (
        <DailyPickCard initialPick={dailyPick} planId={planId} />
      )}

      {/* Hero (anonymous only — signed-in users see daily pick instead) */}
      {!isSignedIn && (
        <section className="text-center py-10 max-w-2xl mx-auto space-y-4 animate-fade-in">
          <h1 className="font-display text-5xl md:text-6xl tracking-tight">
            Bored?
          </h1>
          <p className="text-xl text-muted-foreground">
            Let AI find your next adventure.
          </p>
        </section>
      )}

      {/* Discovery input */}
      <section>
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5 max-w-3xl mx-auto">
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as "type" | "pick")}
          >
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
              <TabsTrigger value="type">✍️ Type It</TabsTrigger>
              <TabsTrigger value="pick">🎯 Pick Options</TabsTrigger>
            </TabsList>

            <TabsContent value="type" className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="I'm bored on a Saturday with friends, no money, want something outdoors..."
                rows={3}
                className="text-base min-h-[120px] resize-none"
              />
            </TabsContent>

            <TabsContent value="pick" className="space-y-5">
              <PillSelect
                label="Mood"
                options={MOODS}
                selected={moods}
                onToggle={(v) => toggle(moods, v, setMoods)}
              />
              <PillSelect
                label="Companions"
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
                label="Vibes"
                options={VIBES}
                selected={vibes}
                onToggle={(v) => toggle(vibes, v, setVibes)}
              />
            </TabsContent>
          </Tabs>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (e.g., Toronto, ON)"
              className="pl-10"
            />
          </div>

          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Finding fun stuff...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Find Something Fun
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="max-w-3xl mx-auto bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* My Plan panel */}
      {plan.length > 0 && (
        <section
          id="my-plan"
          className="bg-gradient-to-br from-secondary/10 via-card to-accent/10 rounded-2xl border-2 border-secondary/30 p-6 space-y-4 max-w-3xl mx-auto animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">My Plan</h2>
            <Badge variant="secondary">
              {plan.length} event{plan.length === 1 ? "" : "s"}
            </Badge>
          </div>

          <div className="space-y-2">
            {plan.map((e) => (
              <div
                key={e.id}
                className="bg-card rounded-xl p-3 flex items-center justify-between gap-3 border border-border/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {e.start ? formatEventDate(e.start) : "Flexible time"}
                    {e.venue ? ` · ${e.venue.name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button asChild size="sm" variant="ghost">
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFromPlan(e.id)}
                    aria-label="Remove from plan"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {plan.length >= 2 && !routePlan && (
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={optimizeRoute}
              disabled={optimizing}
            >
              {optimizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is planning your route...
                </>
              ) : (
                <>
                  <MapIcon className="w-4 h-4" />
                  Optimize Route with AI
                </>
              )}
            </Button>
          )}

          {plan.length === 1 && !routePlan && (
            <p className="text-sm text-center text-muted-foreground">
              Add at least 2 events to optimize your route.
            </p>
          )}

          {routePlan && (
            <div className="border-t border-border pt-5 space-y-4">
              <div>
                <h3 className="font-display text-xl mb-2">Optimized Route</h3>
                <p className="text-sm text-muted-foreground">
                  {routePlan.summary}
                </p>
              </div>

              <div>
                {routePlan.route.map((stop, i) => (
                  <RouteTimelineNode
                    key={i}
                    stop={stop}
                    isLast={i === routePlan.route.length - 1}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-xl px-3 py-2 border border-border/50">
                  <p className="text-xs text-muted-foreground">Total Time</p>
                  <p className="font-medium">{routePlan.estimatedTotalTime}</p>
                </div>
                <div className="bg-card rounded-xl px-3 py-2 border border-border/50">
                  <p className="text-xs text-muted-foreground">Est. Cost</p>
                  <p className="font-medium">{routePlan.estimatedTotalCost}</p>
                </div>
              </div>

              {routePlan.tips && routePlan.tips.length > 0 && (
                <div className="bg-accent/30 rounded-xl p-3">
                  <p className="text-xs font-semibold mb-1.5">💡 Pro tips</p>
                  <ul className="text-sm space-y-0.5">
                    {routePlan.tips.map((tip, i) => (
                      <li key={i}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <section className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-display text-2xl mb-1">
              AI Suggestions for You
            </h2>
            <p className="text-muted-foreground">
              Based on your interests and what you&apos;re looking for.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suggestions.map((s, i) => (
              <AISuggestionCard
                key={i}
                suggestion={s}
                onFindEvents={fetchEvents}
              />
            ))}
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={loadMoreSuggestions}
              disabled={suggestionsLoading}
            >
              {suggestionsLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating more...
                </>
              ) : (
                "💡 Show Me More Ideas"
              )}
            </Button>
          </div>
        </section>
      )}

      {/* Events */}
      <div ref={eventsSectionRef} />
      {eventsLoading && (
        <div className="text-center py-10 text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Searching nearby events...
        </div>
      )}

      {events.length > 0 && (
        <section className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-display text-2xl mb-1">
              Events Happening Near You
            </h2>
            <p className="text-muted-foreground">
              Real events from Eventbrite, filterable by when, price, and category.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="w-4 h-4" />
              Filters
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">When:</span>
                <div className="flex flex-wrap gap-1">
                  {WHEN_FILTERS.map((opt) => (
                    <Badge
                      key={opt.value}
                      variant={whenFilter === opt.value ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setWhenFilter(opt.value)}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Price:</span>
                <div className="flex flex-wrap gap-1">
                  {PRICE_FILTERS.map((opt) => (
                    <Badge
                      key={opt.value}
                      variant={priceFilter === opt.value ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setPriceFilter(opt.value)}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {availableCategories.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Category:</span>
                  <div className="flex flex-wrap gap-1">
                    <Badge
                      variant={!categoryFilter ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setCategoryFilter("")}
                    >
                      All
                    </Badge>
                    {availableCategories.map((cat) => (
                      <Badge
                        key={cat}
                        variant={categoryFilter === cat ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setCategoryFilter(cat)}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {hasFiltersActive && (
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Showing {displayEvents.length} of {events.length} events
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setWhenFilter("all");
                    setPriceFilter("all");
                    setCategoryFilter("");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>

          {/* Event grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEvents.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                onAddToPlan={addToPlan}
                isInPlan={planIds.has(e.id)}
              />
            ))}
          </div>

          {displayEvents.length === 0 && events.length > 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No events match your filters. Try adjusting or clearing them.
            </p>
          )}

          {eventsContinuation && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={loadMoreEvents}
                disabled={eventsLoadingMore}
              >
                {eventsLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  "Load More Events"
                )}
              </Button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

// Local helper used only in the inline plan list above
function formatEventDate(input: string): string {
  if (!input) return "";
  const d = new Date(input);
  if (isNaN(d.getTime())) return input;
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Suppress unused import warning during dev — `cn` may be used in future variants.
void cn;
