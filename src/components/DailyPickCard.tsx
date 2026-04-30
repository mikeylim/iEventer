"use client";

import { useState, useTransition, useEffect } from "react";
import { Calendar, MapPin, Sparkles, Shuffle, ThumbsDown, Plus, Check } from "lucide-react";
import {
  regenerateTodaysPick,
  markPickSeen,
  dismissPick,
} from "@/app/dailyPickActions";
import { addEventToPlan } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Event = {
  id: string;
  name: string;
  description: string;
  url: string;
  start: string;
  category: string;
  venue: { name: string; city: string; address: string } | null;
  isFree: boolean;
  logo: string | null;
};

type Pick = {
  id: string;
  reason: string;
  event: Event;
  seenAt: string | null;
  dismissedAt: string | null;
};

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

export function DailyPickCard({
  initialPick,
  planId,
}: {
  initialPick: Pick;
  planId: string | null;
}) {
  const [pick, setPick] = useState<Pick | null>(initialPick);
  const [added, setAdded] = useState(false);
  const [isRegenerating, startRegen] = useTransition();
  const [isAdding, startAdd] = useTransition();
  const [isDismissing, startDismiss] = useTransition();

  useEffect(() => {
    if (pick && !pick.seenAt) {
      markPickSeen(pick.id).catch(() => {});
    }
  }, [pick]);

  if (!pick) return null;

  const e = pick.event;

  function handleAddToPlan() {
    if (!planId || !pick) return;
    startAdd(async () => {
      try {
        await addEventToPlan(planId, {
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
        setAdded(true);
      } catch (err) {
        console.error("Failed to add daily pick to plan:", err);
      }
    });
  }

  function handleRegenerate() {
    startRegen(async () => {
      try {
        const next = await regenerateTodaysPick();
        setPick({
          id: next.id,
          reason: next.reason,
          event: next.event,
          seenAt: next.seenAt ? next.seenAt.toString() : null,
          dismissedAt: next.dismissedAt ? next.dismissedAt.toString() : null,
        });
        setAdded(false);
      } catch (err) {
        console.error("Failed to regenerate pick:", err);
      }
    });
  }

  function handleDismiss() {
    if (!pick) return;
    startDismiss(async () => {
      try {
        await dismissPick(pick.id);
        setPick(null);
      } catch (err) {
        console.error("Failed to dismiss pick:", err);
      }
    });
  }

  return (
    <section className="animate-fade-in">
      <div className="bg-gradient-to-br from-primary/5 via-card to-secondary/5 rounded-3xl overflow-hidden border-2 border-primary/20 shadow-xl">
        {/* Cinematic image */}
        <div className="relative">
          <div className="aspect-[21/9] overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
            {e.logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={e.logo}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Sparkles className="w-20 h-20 text-primary/30" />
              </div>
            )}
          </div>
          {/* Floating badge chip */}
          <div className="absolute top-4 left-4">
            <div className="bg-card/95 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-border/50">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-display text-sm">Today&apos;s Surprise Pick</span>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* AI reason as pull quote */}
          <p className="text-base md:text-lg italic text-muted-foreground border-l-4 border-primary pl-4 leading-relaxed">
            &ldquo;{pick.reason}&rdquo;
          </p>

          {/* Event title + tags + meta */}
          <div className="space-y-3">
            <h2 className="font-display text-2xl md:text-3xl leading-tight">
              {e.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant={e.isFree ? "secondary" : "outline"}>
                {e.isFree ? "FREE" : "Paid"}
              </Badge>
              {e.category && <Badge variant="outline">{e.category}</Badge>}
            </div>
            <div className="space-y-1.5 text-sm md:text-base text-muted-foreground">
              {e.start && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>{formatEventDate(e.start)}</span>
                </div>
              )}
              {e.venue && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>
                    {e.venue.name}
                    {e.venue.address ? ` · ${e.venue.address}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg" className="flex-1 min-w-[140px]">
              <a href={e.url} target="_blank" rel="noopener noreferrer">
                View Event
              </a>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="flex-1 min-w-[140px]"
              onClick={handleAddToPlan}
              disabled={isAdding || added || !planId}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" />
                  Added to Plan
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {isAdding ? "Adding..." : "Add to Plan"}
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleRegenerate}
              disabled={isRegenerating}
            >
              <Shuffle className="w-4 h-4" />
              {isRegenerating ? "Picking..." : "Try Another"}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={handleDismiss}
              disabled={isDismissing}
              aria-label="Not interested"
            >
              <ThumbsDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
