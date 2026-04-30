"use client";

import { Calendar, MapPin, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface EventItem {
  id: string;
  name: string;
  description: string;
  url: string;
  start: string;
  category: string;
  venue: { name: string; city: string; address: string } | null;
  isFree: boolean;
  logo: string | null;
  planEventId?: string;
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

export function EventCard({
  event,
  onAddToPlan,
  isInPlan,
}: {
  event: EventItem;
  onAddToPlan: (e: EventItem) => void;
  isInPlan: boolean;
}) {
  const date = formatEventDate(event.start);

  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-shadow duration-300 flex flex-col animate-fade-in">
      {event.logo ? (
        <div className="aspect-[4/3] relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.logo}
            alt=""
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-gradient-to-br from-muted to-accent/30 flex items-center justify-center">
          <Calendar className="w-10 h-10 text-muted-foreground/40" />
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant={event.isFree ? "secondary" : "outline"}>
            {event.isFree ? "FREE" : "Paid"}
          </Badge>
          {event.category && (
            <Badge variant="outline">{event.category}</Badge>
          )}
        </div>

        <h3 className="font-display text-lg leading-tight line-clamp-2">
          {event.name}
        </h3>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          {date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>{date}</span>
            </div>
          )}
          {event.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="line-clamp-1">
                {event.venue.name}
                {event.venue.city ? `, ${event.venue.city}` : ""}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 mt-auto">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <a href={event.url} target="_blank" rel="noopener noreferrer">
              View Event
            </a>
          </Button>
          <Button
            size="sm"
            disabled={isInPlan}
            onClick={() => onAddToPlan(event)}
            variant={isInPlan ? "secondary" : "default"}
            className="flex-1"
          >
            {isInPlan ? (
              <>
                <Check className="w-4 h-4" />
                Added
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add to Plan
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
