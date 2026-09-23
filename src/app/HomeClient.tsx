"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import {
  Sparkles,
  MapPin,
  X,
  Map as MapIcon,
  Loader2,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  CalendarDays,
  Compass,
  Landmark,
  UtensilsCrossed,
} from "lucide-react";
import {
  addEventToPlan,
  removeEventFromPlan,
  saveOptimizedRoute,
} from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DailyPickCard } from "@/components/DailyPickCard";
import { PlaceCard } from "@/components/PlaceCard";
import { SamplePlanPreview } from "@/components/SamplePlanPreview";
import { MyPlanFAB } from "@/components/MyPlanFAB";
import { WeatherContext } from "@/components/WeatherContext";
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
import { formatEventDate } from "@/lib/format";
import type {
  DiscoveryItem,
  DiscoveryKind,
  WeatherSummary,
} from "@/lib/discovery";

import {
  WHEN_FILTERS,
  PRICE_FILTERS,
  type WhenFilter,
  type PriceFilter,
  filterByWhen,
  filterByPrice,
  filterByCategory,
} from "@/lib/eventFilters";

const PREFERENCE_GROUPS = [
  {
    key: "mood",
    label: "Mood",
    options: [
      { emoji: "🌿", label: "Chill" },
      { emoji: "🗣️", label: "Social" },
      { emoji: "🔎", label: "Curious" },
      { emoji: "🎨", label: "Creative" },
      { emoji: "⚡", label: "Active" },
      { emoji: "🌙", label: "Romantic" },
    ],
  },
  {
    key: "company",
    label: "Company",
    options: [
      { emoji: "🧘", label: "Solo" },
      { emoji: "👯", label: "Friends" },
      { emoji: "💫", label: "Date" },
      { emoji: "🏡", label: "Family" },
    ],
  },
  {
    key: "budget",
    label: "Budget",
    options: [
      { emoji: "🆓", label: "Free" },
      { emoji: "💵", label: "Cheap" },
      { emoji: "↔️", label: "Flexible" },
      { emoji: "✨", label: "Treat yourself" },
    ],
  },
  {
    key: "setting",
    label: "Setting",
    options: [
      { emoji: "🏛️", label: "Indoor" },
      { emoji: "🌳", label: "Outdoor" },
      { emoji: "🍜", label: "Food & drink" },
      { emoji: "🎷", label: "Live music" },
      { emoji: "📚", label: "Learning" },
      { emoji: "💻", label: "Tech" },
    ],
  },
  {
    key: "timing",
    label: "Timing",
    options: [
      { emoji: "📍", label: "Today" },
      { emoji: "⏭️", label: "Tomorrow" },
      { emoji: "🎈", label: "Weekend" },
      { emoji: "🌆", label: "Evening" },
      { emoji: "🕰️", label: "Anytime" },
    ],
  },
] as const;

type DiscoveryMode = "prompt" | "vibes";
type DiscoveryView = "all" | DiscoveryKind;
type PreferenceKey = (typeof PREFERENCE_GROUPS)[number]["key"];
type SelectedPreferences = Record<PreferenceKey, string[]>;

function createEmptyPreferences(): SelectedPreferences {
  return PREFERENCE_GROUPS.reduce((acc, group) => {
    acc[group.key] = [];
    return acc;
  }, {} as SelectedPreferences);
}

function getTodayInputValue(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function getMaxForecastDate(): string {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 15);
  const offset = maxDate.getTimezoneOffset() * 60_000;
  return new Date(maxDate.getTime() - offset).toISOString().slice(0, 10);
}

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

// ─── Main Page ───────────────────────────────────────────────
export default function HomeClient({
  isSignedIn,
  planId,
  initialLocation,
  initialPlan,
  initialRoutePlan,
  dailyPick,
}: HomeClientProps) {
  const [prompt, setPrompt] = useState("");
  const [location, setLocation] = useState(initialLocation);
  const [outingDate, setOutingDate] = useState(getTodayInputValue);
  const [discoveryMode, setDiscoveryMode] =
    useState<DiscoveryMode>("prompt");
  const [selectedPreferences, setSelectedPreferences] =
    useState<SelectedPreferences>(() => createEmptyPreferences());

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [places, setPlaces] = useState<DiscoveryItem[]>([]);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [resolvedLocation, setResolvedLocation] = useState("");
  const [discoveryView, setDiscoveryView] = useState<DiscoveryView>("all");
  const [placeProviderStatus, setPlaceProviderStatus] = useState<
    "ready" | "unavailable" | "unconfigured" | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

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

  const planIds = new Set(plan.map((e) => e.id));
  const selectedPreferenceCount = PREFERENCE_GROUPS.reduce(
    (count, group) => count + selectedPreferences[group.key].length,
    0
  );
  const hasSelectedPreferences = selectedPreferenceCount > 0;

  function togglePreference(groupKey: PreferenceKey, option: string) {
    setSelectedPreferences((prev) => {
      const current = prev[groupKey];
      const next = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];

      return {
        ...prev,
        [groupKey]: next,
      };
    });
  }

  function buildPreferencesBody() {
    return PREFERENCE_GROUPS.reduce<Record<string, string | string[]>>(
      (acc, group) => {
        const values = selectedPreferences[group.key];
        if (values.length > 0) acc[group.key] = values;
        return acc;
      },
      location.trim()
        ? { location: location.trim(), date: outingDate }
        : { date: outingDate }
    );
  }

  function addToPlan(e: EventItem) {
    if (planIds.has(e.id)) return;
    setError("");
    setPlan((prev) => [...prev, e]);
    setRoutePlan(null);
    setStatusMessage(`${e.name} added to your plan.`);

    if (isSignedIn && planId) {
      startTransition(async () => {
        try {
          const saved = await addEventToPlan(planId, {
            sourceProvider: e.sourceProvider,
            sourceId: e.sourceId,
            name: e.name,
            description: e.description,
            url: e.url,
            startAt: e.start || null,
            venueName: e.venue?.name || null,
            venueAddress: e.venue?.address || null,
            category: e.category || null,
            isFree: e.isFree,
            imageUrl: e.logo || null,
            latitude:
              typeof e.latitude === "number" ? String(e.latitude) : null,
            longitude:
              typeof e.longitude === "number" ? String(e.longitude) : null,
          });
          setPlan((prev) =>
            prev.map((p) =>
              p.id === e.id ? { ...p, planEventId: saved.id } : p
            )
          );
        } catch (err) {
          console.error("Failed to save event to plan:", err);
          setPlan((prev) => prev.filter((p) => p.id !== e.id));
          setError(`Couldn't add ${e.name} to your plan. Try again.`);
        }
      });
    }
  }

  function removeFromPlan(id: string) {
    const target = plan.find((p) => p.id === id);
    setError("");
    setPlan((prev) => prev.filter((e) => e.id !== id));
    setRoutePlan(null);
    setStatusMessage(`${target?.name ?? "Event"} removed from your plan.`);

    if (isSignedIn && target?.planEventId) {
      startTransition(async () => {
        try {
          await removeEventFromPlan(target.planEventId!);
        } catch (err) {
          console.error("Failed to remove event from plan:", err);
          if (target) setPlan((prev) => [...prev, target]);
          setError(`Couldn't remove ${target?.name ?? "that event"}. Try again.`);
        }
      });
    }
  }

  async function optimizeRoute() {
    setOptimizing(true);
    setRoutePlan(null);
    setError("");
    try {
      const res = await fetch("/api/optimize-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: plan.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            url: item.url,
            start: item.start,
            category: item.category,
            venue: item.venue,
            isFree: item.isFree,
            logo: item.logo,
            planEventId: item.planEventId,
          })),
          location,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRoutePlan(data);
      setStatusMessage("Your optimized route is ready.");
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

    const body: Record<string, unknown> = {};
    const trimmedPrompt = prompt.trim();
    const preferences = buildPreferencesBody();
    const discoveryQuery =
      trimmedPrompt ||
      Object.values(selectedPreferences)
        .flat()
        .join(" ") ||
      "things to do";

    if (discoveryMode === "prompt" && trimmedPrompt) {
      body.prompt = `${trimmedPrompt}. Destination: ${location}. Date: ${outingDate}.`;
    }
    if (discoveryMode === "vibes" && hasSelectedPreferences) {
      body.preferences = preferences;
    }

    lastPromptBody.current = body;

    const suggestionRequest = fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to generate AI ideas");
      }
      return (data.suggestions || []) as Suggestion[];
    });

    const [suggestionResult, discoveryResult] = await Promise.allSettled([
      suggestionRequest,
      fetchDiscovery(discoveryQuery, false),
    ]);
    const errors: string[] = [];

    if (suggestionResult.status === "fulfilled") {
      setSuggestions(suggestionResult.value);
    } else {
      errors.push(
        suggestionResult.reason instanceof Error
          ? suggestionResult.reason.message
          : "Failed to generate AI ideas"
      );
    }

    if (discoveryResult.status === "rejected") {
      errors.push(
        discoveryResult.reason instanceof Error
          ? discoveryResult.reason.message
          : "Failed to discover nearby options"
      );
    }

    setError(errors.join(" "));
    const suggestionCount =
      suggestionResult.status === "fulfilled"
        ? suggestionResult.value.length
        : 0;
    const discoveryCount =
      discoveryResult.status === "fulfilled"
        ? discoveryResult.value.total
        : 0;
    setStatusMessage(
      `${suggestionCount} AI ideas and ${discoveryCount} verified options found.`
    );
    setLoading(false);
  }

  async function loadMoreSuggestions() {
    if (!lastPromptBody.current) return;
    setSuggestionsLoading(true);
    setError("");
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
      const nextSuggestions = data.suggestions || [];
      setSuggestions((prev) => [...prev, ...nextSuggestions]);
      setStatusMessage(
        nextSuggestions.length > 0
          ? `${nextSuggestions.length} more AI ideas added.`
          : "No more AI ideas were found."
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSuggestionsLoading(false);
    }
  }

  const fetchDiscovery = useCallback(
    async (keyword: string, scrollToResults = true) => {
      setEventsLoading(true);
      setEvents([]);
      setPlaces([]);
      setWeather(null);
      setResolvedLocation("");
      setPlaceProviderStatus(null);
      setEventsContinuation(null);
      setEventsQuery(keyword);
      setDiscoveryView("all");
      try {
        const params = new URLSearchParams({
          q: keyword,
          page_size: "10",
          location: location.trim(),
          date: outingDate,
        });
        const res = await fetch(`/api/discover?${params.toString()}`);
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to discover nearby options");
        }
        const nextEvents = data.events || [];
        const nextPlaces = data.places || [];
        setEvents(nextEvents);
        setPlaces(nextPlaces);
        setWeather(data.weather || null);
        setResolvedLocation(data.resolvedLocation || location.trim());
        setPlaceProviderStatus(data.providers?.places || null);
        setEventsContinuation(data.continuation || null);
        if (scrollToResults) {
          setTimeout(() => {
            eventsSectionRef.current?.scrollIntoView({
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "auto"
                : "smooth",
              block: "start",
            });
          }, 100);
        }
        return { total: nextEvents.length + nextPlaces.length };
      } finally {
        setEventsLoading(false);
      }
    },
    [location, outingDate]
  );

  function exploreMatches(keyword: string) {
    setError("");
    void fetchDiscovery(keyword).catch((err) => {
      setError(
        err instanceof Error ? err.message : "Failed to discover nearby options"
      );
    });
  }

  async function loadMoreEvents() {
    if (!eventsContinuation || eventsLoadingMore) return;
    setEventsLoadingMore(true);
    setError("");
    try {
      const params = new URLSearchParams({
        q: eventsQuery,
        page_size: "10",
        continuation: eventsContinuation,
        location: location.trim(),
        date: outingDate,
        scope: "events",
      });
      const res = await fetch(`/api/discover?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to load more events");
      }
      const nextEvents = data.events || [];
      setEvents((prev) => [...prev, ...nextEvents]);
      setEventsContinuation(data.continuation || null);
      setStatusMessage(
        nextEvents.length > 0
          ? `${nextEvents.length} more events added.`
          : "No more events were found."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more events"
      );
    } finally {
      setEventsLoadingMore(false);
    }
  }

  const canSubmit =
    location.trim().length > 0 &&
    (discoveryMode === "prompt"
      ? prompt.trim().length > 0
      : hasSelectedPreferences);

  const filteredByWhen = filterByWhen(events, whenFilter);
  const filteredByPrice = filterByPrice(filteredByWhen, priceFilter);
  const filteredByCategory = filterByCategory(filteredByPrice, categoryFilter);
  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(a.start || "9999").getTime() -
      new Date(b.start || "9999").getTime()
  );
  const displayEvents = [...filteredByCategory].sort(
    (a, b) =>
      new Date(a.start || "9999").getTime() -
      new Date(b.start || "9999").getTime()
  );
  const displayPlaces = places.filter((item) => item.kind === "place");
  const displayFood = places.filter((item) => item.kind === "food");
  const displayItems: DiscoveryItem[] =
    discoveryView === "event"
      ? displayEvents
      : discoveryView === "place"
        ? displayPlaces
        : discoveryView === "food"
          ? displayFood
          : [...sortedEvents, ...places];
  const hasDiscoveryResults = events.length > 0 || places.length > 0;

  const availableCategories = [
    ...new Set(events.map((e) => e.category).filter(Boolean)),
  ];

  const hasFiltersActive =
    whenFilter !== "all" || priceFilter !== "all" || !!categoryFilter;

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-12">
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {statusMessage}
      </p>
      {/* Daily surprise pick */}
      {dailyPick && (
        <DailyPickCard initialPick={dailyPick} planId={planId} />
      )}

      {/* Hero (anonymous only — signed-in users see daily pick instead) */}
      {!isSignedIn && (
        <section className="max-w-5xl mx-auto animate-fade-in">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-tight">
                Plan your perfect outing in seconds.
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Tell us what you&apos;re in the mood for. We&apos;ll find
                real events and places at your destination, account for the
                forecast, and build one flexible plan.
              </p>
              <p className="text-sm text-muted-foreground/80">
                Try it right below — no sign-in needed to start.
              </p>
            </div>
            <SamplePlanPreview />
          </div>
        </section>
      )}

      {/* Discovery input */}
      <section>
        <div className="bg-card rounded-lg border border-border p-6 space-y-4 max-w-3xl mx-auto">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <div>
              <label
                htmlFor="discovery-location"
                className="text-sm font-medium mb-2 block"
              >
                📍 Where do you want to go?
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="discovery-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Downtown Toronto, ON"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="outing-date"
                className="text-sm font-medium mb-2 block"
              >
                📅 Outing date
              </label>
              <Input
                id="outing-date"
                type="date"
                value={outingDate}
                min={getTodayInputValue()}
                max={getMaxForecastDate()}
                onChange={(event) => setOutingDate(event.target.value)}
                required
              />
            </div>
          </div>

          <Tabs
            value={discoveryMode}
            onValueChange={(value) => setDiscoveryMode(value as DiscoveryMode)}
            className="space-y-4"
          >
            <TabsList className="grid h-10 w-full grid-cols-2 rounded-md">
              <TabsTrigger value="prompt">Type it</TabsTrigger>
              <TabsTrigger value="vibes">Pick options</TabsTrigger>
            </TabsList>

            <TabsContent value="prompt" className="mt-0 space-y-2">
              <label className="text-sm font-medium block" htmlFor="mood-prompt">
                💭 What are you in the mood for?
              </label>
              <Textarea
                id="mood-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="I'm bored on a Saturday. Free or cheap. Outdoors preferred."
                rows={3}
                className="text-base min-h-[110px] resize-none"
              />
            </TabsContent>

            <TabsContent value="vibes" className="mt-0 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <span>Choose a few signals</span>
                </div>
                {hasSelectedPreferences && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPreferences(createEmptyPreferences())}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Clear
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {PREFERENCE_GROUPS.map((group) => (
                  <fieldset key={group.key} className="space-y-2">
                    <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </legend>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                      {group.options.map((option) => {
                        const selected = selectedPreferences[group.key].includes(
                          option.label
                        );

                        return (
                          <Button
                            key={option.label}
                            type="button"
                            size="sm"
                            variant={selected ? "default" : "outline"}
                            aria-pressed={selected}
                            onClick={() =>
                              togglePreference(group.key, option.label)
                            }
                            className={cn(
                              "h-10 justify-start rounded-md px-3 text-left sm:w-auto",
                              selected && "shadow-sm"
                            )}
                          >
                            <span aria-hidden="true">{option.emoji}</span>
                            <span>{option.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Building your outing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Build My Outing
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div
          role="alert"
          aria-atomic="true"
          className="max-w-3xl mx-auto bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm"
        >
          {error}
        </div>
      )}

      {/* My Plan panel */}
      {plan.length > 0 && (
        <section
          id="my-plan"
          aria-labelledby="my-plan-heading"
          className="bg-gradient-to-br from-secondary/10 via-card to-accent/10 rounded-2xl border-2 border-secondary/30 p-6 space-y-4 max-w-3xl mx-auto animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h2 id="my-plan-heading" className="font-display text-2xl">
              My Plan
            </h2>
            <Badge variant="secondary">
              {plan.length} stop{plan.length === 1 ? "" : "s"}
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
                    aria-label={`Remove ${e.name} from plan`}
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
              Add at least 2 stops to optimize your route.
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
          <div className="flex items-start gap-3 border-l-4 border-primary pl-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="mb-1 text-sm font-semibold text-foreground">
                AI-generated activity ideas
              </p>
              <h2 className="font-display text-2xl mb-1">
                AI Suggestions for You
              </h2>
              <p className="text-muted-foreground">
                Creative ways to spend your time, matched to your request and
                interests. Use Explore Matches to find verified events and places.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suggestions.map((s, i) => (
              <AISuggestionCard
                key={i}
                suggestion={s}
                onExploreMatches={exploreMatches}
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

      {/* Verified discovery results */}
      <div ref={eventsSectionRef} className="scroll-mt-24" aria-hidden="true" />
      {eventsLoading && (
        <div
          role="status"
          aria-live="polite"
          className="text-center py-10 text-muted-foreground flex items-center justify-center gap-2"
        >
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          Searching events and places at your destination...
        </div>
      )}

      {(hasDiscoveryResults || placeProviderStatus) && !eventsLoading && (
        <section className="space-y-6 animate-fade-in">
          <div className="flex items-start gap-3 border-l-4 border-secondary pl-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary/15 text-secondary">
              <Compass className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="mb-1 text-sm font-semibold text-foreground">
                Verified options for your outing
              </p>
              <h2 className="font-display text-2xl mb-1">
                Explore {resolvedLocation || location}
              </h2>
              <p className="text-muted-foreground">
                Compare scheduled events, places, restaurants, and cafes for
                the destination and date you chose.
              </p>
            </div>
          </div>

          {weather && (
            <WeatherContext
              weather={weather}
              destination={resolvedLocation || location}
            />
          )}

          <div
            role="tablist"
            aria-label="Discovery categories"
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {([
              {
                value: "all",
                label: "All",
                icon: Compass,
                count: events.length + places.length,
              },
              {
                value: "event",
                label: "Events",
                icon: CalendarDays,
                count: events.length,
              },
              {
                value: "place",
                label: "Places",
                icon: Landmark,
                count: displayPlaces.length,
              },
              {
                value: "food",
                label: "Food & Drink",
                icon: UtensilsCrossed,
                count: displayFood.length,
              },
            ] as const).map((tab) => {
              const TabIcon = tab.icon;
              return (
                <Button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={discoveryView === tab.value}
                  aria-controls="discovery-results"
                  variant={discoveryView === tab.value ? "default" : "outline"}
                  onClick={() => setDiscoveryView(tab.value)}
                  className="min-w-0 justify-center"
                >
                  <TabIcon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{tab.label}</span>
                  <span className="text-xs opacity-75">{tab.count}</span>
                </Button>
              );
            })}
          </div>

          {/* Filters */}
          {discoveryView === "event" && events.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="w-4 h-4" aria-hidden="true" />
              Filters
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div
                role="group"
                aria-labelledby="when-filter-label"
                className="flex w-full flex-col items-start gap-1.5 sm:w-auto sm:flex-row sm:items-center"
              >
                <span id="when-filter-label" className="text-xs text-muted-foreground">
                  When:
                </span>
                <div className="flex flex-wrap gap-1">
                  {WHEN_FILTERS.map((opt) => (
                    <Button
                      key={opt.value}
                      type="button"
                      size="sm"
                      variant={whenFilter === opt.value ? "default" : "outline"}
                      aria-pressed={whenFilter === opt.value}
                      className="h-7 rounded-md px-2 text-xs"
                      onClick={() => setWhenFilter(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div
                role="group"
                aria-labelledby="price-filter-label"
                className="flex w-full flex-col items-start gap-1.5 sm:w-auto sm:flex-row sm:items-center"
              >
                <span id="price-filter-label" className="text-xs text-muted-foreground">
                  Price:
                </span>
                <div className="flex flex-wrap gap-1">
                  {PRICE_FILTERS.map((opt) => (
                    <Button
                      key={opt.value}
                      type="button"
                      size="sm"
                      variant={priceFilter === opt.value ? "default" : "outline"}
                      aria-pressed={priceFilter === opt.value}
                      className="h-7 rounded-md px-2 text-xs"
                      onClick={() => setPriceFilter(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {availableCategories.length > 1 && (
                <div
                  role="group"
                  aria-labelledby="category-filter-label"
                  className="flex w-full flex-col items-start gap-1.5 sm:w-auto sm:flex-row sm:items-center"
                >
                  <span
                    id="category-filter-label"
                    className="text-xs text-muted-foreground"
                  >
                    Category:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={!categoryFilter ? "default" : "outline"}
                      aria-pressed={!categoryFilter}
                      className="h-7 rounded-md px-2 text-xs"
                      onClick={() => setCategoryFilter("")}
                    >
                      All
                    </Button>
                    {availableCategories.map((cat) => (
                      <Button
                        key={cat}
                        type="button"
                        size="sm"
                        variant={categoryFilter === cat ? "default" : "outline"}
                        aria-pressed={categoryFilter === cat}
                        className="h-7 rounded-md px-2 text-xs"
                        onClick={() => setCategoryFilter(cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {hasFiltersActive && (
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <p
                  role="status"
                  aria-live="polite"
                  className="text-xs text-muted-foreground"
                >
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
          )}

          {/* Discovery grid */}
          <div
            id="discovery-results"
            role="tabpanel"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {displayItems.map((item) =>
              item.kind === "event" ? (
                <EventCard
                  key={item.id}
                  event={item}
                  onAddToPlan={addToPlan}
                  isInPlan={planIds.has(item.id)}
                />
              ) : (
                <PlaceCard
                  key={item.id}
                  item={item}
                  onAddToPlan={addToPlan}
                  isInPlan={planIds.has(item.id)}
                />
              )
            )}
          </div>

          {displayItems.length === 0 && (
            <p
              role="status"
              className="text-center text-sm text-muted-foreground py-4"
            >
              No{" "}
              {discoveryView === "all"
                ? "options"
                : discoveryView === "event"
                  ? "events"
                  : discoveryView === "place"
                    ? "places"
                    : "food and drink options"}{" "}
              were found for this search.
            </p>
          )}

          {placeProviderStatus === "unconfigured" && (
            <p className="text-center text-xs text-muted-foreground">
              Place and food results are not configured yet. Event results remain available.
            </p>
          )}

          {placeProviderStatus === "unavailable" && (
            <p className="text-center text-xs text-muted-foreground">
              Place and food results are temporarily unavailable.
            </p>
          )}

          {eventsContinuation &&
            (discoveryView === "all" || discoveryView === "event") && (
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

          {places.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Place data by{" "}
              <a
                className="underline underline-offset-2"
                href="https://www.geoapify.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Geoapify
              </a>{" "}
              and{" "}
              <a
                className="underline underline-offset-2"
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenStreetMap contributors
              </a>
              .
            </p>
          )}
        </section>
      )}

      <MyPlanFAB eventCount={plan.length} />
    </main>
  );
}
