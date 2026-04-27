"use client";

import { useState, useTransition, useEffect } from "react";
import {
  regenerateTodaysPick,
  markPickSeen,
  dismissPick,
} from "@/app/dailyPickActions";
import { addEventToPlan } from "@/lib/plans";

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

  // Mark the pick as seen on mount (best-effort)
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
    <section className="mb-8 animate-fade-in">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            ✨ Today&apos;s Surprise Pick
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Curated just for you, based on your interests.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-accent/10 via-white to-primary/5 rounded-2xl shadow-md border border-accent/30 overflow-hidden">
        <div className="md:flex">
          {e.logo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={e.logo}
              alt=""
              className="w-full md:w-56 h-44 md:h-auto object-cover"
            />
          )}
          <div className="p-5 flex-1 flex flex-col">
            {/* AI reason */}
            <div className="bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 mb-3 border-l-4 border-accent">
              <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-1">
                Why this for you
              </p>
              <p className="text-sm text-foreground/80 italic">
                &ldquo;{pick.reason}&rdquo;
              </p>
            </div>

            <h3 className="text-lg font-bold leading-tight">{e.name}</h3>

            <div className="text-sm text-muted mt-2 space-y-0.5">
              {e.start && <p>📅 {formatEventDate(e.start)}</p>}
              {e.venue && (
                <p>
                  📍 {e.venue.name}
                  {e.venue.address ? ` · ${e.venue.address}` : ""}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {e.isFree && (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  FREE
                </span>
              )}
              {e.category && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {e.category}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="mt-auto pt-4 flex flex-wrap items-center gap-2">
              <a
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-white bg-primary hover:bg-primary-light rounded-full px-4 py-2 transition-colors"
              >
                View Event →
              </a>
              <button
                onClick={handleAddToPlan}
                disabled={isAdding || added || !planId}
                className={`text-sm font-semibold rounded-full px-4 py-2 border transition-all cursor-pointer
                  ${
                    added
                      ? "bg-green-50 text-green-600 border-green-200 cursor-default"
                      : isAdding
                        ? "text-muted border-muted cursor-not-allowed"
                        : "text-accent border-accent hover:bg-accent hover:text-white"
                  }`}
              >
                {added ? "✓ Added to Plan" : isAdding ? "Adding..." : "+ Add to Plan"}
              </button>
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="text-sm font-semibold text-foreground/60 hover:text-primary px-3 py-2 transition-colors cursor-pointer"
              >
                {isRegenerating ? "Picking..." : "🎲 Try another"}
              </button>
              <button
                onClick={handleDismiss}
                disabled={isDismissing}
                className="text-sm text-foreground/40 hover:text-red-500 px-3 py-2 transition-colors cursor-pointer ml-auto"
              >
                Not interested
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
