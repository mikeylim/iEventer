"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { completeOnboarding } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Interest {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  category: string;
}

const MIN_INTERESTS = 2;

export function OnboardingForm({
  interests,
  initialLocation,
  initialSelected,
}: {
  interests: Interest[];
  initialLocation: string;
  initialSelected: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelected)
  );
  const [location, setLocation] = useState(initialLocation);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggleInterest(slug: string) {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setSelected(next);
  }

  const remaining = Math.max(0, MIN_INTERESTS - selected.size);
  const canContinue =
    location.trim() !== "" && selected.size >= MIN_INTERESTS;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (selected.size < MIN_INTERESTS) {
      setError(
        `Pick at least ${MIN_INTERESTS} so we can personalize for you.`
      );
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
    <form onSubmit={handleSubmit} className="space-y-6 pb-32">
      {/* Location */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
        <div>
          <label className="font-display text-lg block">
            Where do you live?
          </label>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            We&apos;ll show you events happening nearby.
          </p>
        </div>
        <Input
          placeholder="e.g., Toronto, ON"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="text-base"
        />
      </div>

      {/* Interests — flat list */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg">
              What are you into?
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Pick at least {MIN_INTERESTS}. You can always change later.
            </p>
          </div>
          <Badge
            variant={selected.size >= MIN_INTERESTS ? "default" : "outline"}
            className="text-base px-3 py-1 shrink-0"
          >
            {selected.size}/{MIN_INTERESTS}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {interests.map((i) => {
            const active = selected.has(i.slug);
            return (
              <button
                key={i.slug}
                type="button"
                onClick={() => toggleInterest(i.slug)}
                className={cn(
                  "px-4 py-2.5 rounded-full text-sm transition-all duration-200 border-2 inline-flex items-center gap-2",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                {active && <Check className="w-4 h-4" />}
                <span>
                  {i.emoji} {i.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border py-4 px-4 z-40">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {!location.trim()
              ? "Add a location to continue"
              : remaining > 0
                ? `Pick ${remaining} more`
                : "Looking good — let's go!"}
          </div>
          <Button asChild variant="ghost" size="lg">
            <Link href="/">Skip for now</Link>
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={!canContinue || isPending}
            className="min-w-[140px]"
          >
            {isPending ? "Saving..." : "Continue →"}
          </Button>
        </div>
      </div>
    </form>
  );
}
