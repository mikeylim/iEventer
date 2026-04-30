"use client";

import { ArrowRight, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RouteStop {
  order: number;
  eventName: string;
  eventUrl: string;
  time: string;
  travelTip: string;
  reason: string;
}

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

export function RouteTimelineNode({
  stop,
  isLast,
}: {
  stop: RouteStop;
  isLast: boolean;
}) {
  return (
    <div className="relative">
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-semibold z-10 shrink-0">
            {stop.order}
          </div>
          {!isLast && (
            <div className="w-0.5 flex-1 min-h-[40px] bg-gradient-to-b from-primary to-primary/20 mt-2" />
          )}
        </div>

        <div className="flex-1 pb-6">
          <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="font-display text-base mb-1">{stop.eventName}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{formatEventDate(stop.time)}</span>
                </div>
              </div>
              {stop.eventUrl && stop.eventUrl !== "N/A" && (
                <Button asChild size="sm" className="shrink-0">
                  <a
                    href={stop.eventUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="w-4 h-4" />
                    Go
                  </a>
                </Button>
              )}
            </div>

            {stop.travelTip && (
              <div className="bg-accent/30 rounded-lg p-3 text-sm flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span>{stop.travelTip}</span>
              </div>
            )}

            {stop.reason && (
              <p className="text-sm text-muted-foreground italic">
                &ldquo;{stop.reason}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
