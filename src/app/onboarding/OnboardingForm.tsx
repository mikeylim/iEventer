"use client";

import { useState, useTransition } from "react";
import { CATEGORY_LABELS, type InterestCategory } from "@/lib/interests";
import { completeOnboarding } from "./actions";

interface Interest {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  category: string;
}

export function OnboardingForm({
  interests,
  initialLocation,
  initialSelected,
}: {
  interests: Interest[];
  initialLocation: string;
  initialSelected: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [location, setLocation] = useState(initialLocation);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Group interests by category
  const grouped = interests.reduce((acc, i) => {
    const key = i.category as InterestCategory;
    if (!acc[key]) acc[key] = [];
    acc[key].push(i);
    return acc;
  }, {} as Record<InterestCategory, Interest[]>);

  function toggle(slug: string) {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setSelected(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (selected.size < 3) {
      setError("Pick at least 3 interests so we can personalize for you.");
      return;
    }
    if (!location.trim()) {
      setError("Add a location to see events near you.");
      return;
    }

    startTransition(async () => {
      const result = await completeOnboarding({
        interestSlugs: Array.from(selected),
        location: location.trim(),
      });
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white rounded-2xl shadow-md border border-foreground/5 p-6"
    >
      {/* Location */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          📍 Where do you live?
        </label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Toronto, ON"
          className="w-full rounded-xl border border-foreground/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Interests */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <label className="block text-sm font-semibold">
            What are you into?
          </label>
          <span className="text-xs text-muted">
            {selected.size} selected · pick at least 3
          </span>
        </div>

        <div className="space-y-5">
          {(Object.keys(grouped) as InterestCategory[]).map((cat) => (
            <div key={cat}>
              <p className="text-xs font-bold uppercase tracking-wide text-foreground/50 mb-2">
                {CATEGORY_LABELS[cat]}
              </p>
              <div className="flex flex-wrap gap-2">
                {grouped[cat].map((i) => {
                  const active = selected.has(i.slug);
                  return (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => toggle(i.slug)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer
                        ${
                          active
                            ? "bg-primary text-white border-primary shadow-md scale-105"
                            : "bg-white text-foreground/70 border-foreground/15 hover:border-primary/50 hover:bg-primary/5"
                        }`}
                    >
                      {i.emoji} {i.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={`w-full py-3 rounded-full text-white font-bold text-base transition-all cursor-pointer
          ${
            isPending
              ? "bg-muted cursor-not-allowed"
              : "bg-primary hover:bg-primary-light shadow-md"
          }`}
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⚙️</span> Saving...
          </span>
        ) : (
          "Continue →"
        )}
      </button>
    </form>
  );
}
