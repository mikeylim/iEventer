"use client";
/* eslint-disable @next/next/no-img-element */

import { Calendar, MapPin, Plus, Check, TicketCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatEventDate } from "@/lib/format";

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
    <article
      aria-label={`Real event: ${event.name}`}
      className="flex flex-col overflow-hidden rounded-lg border border-secondary/40 bg-card shadow-sm transition-[border-color,box-shadow] duration-300 animate-fade-in hover:border-secondary/70 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {event.logo ? (
          <img
            src={event.logo}
            alt=""
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-accent/30">
            <Calendar className="w-10 h-10 text-muted-foreground/40" />
          </div>
        )}

        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-secondary/30 bg-card/95 px-2 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm">
            <TicketCheck className="size-3.5 text-secondary" aria-hidden="true" />
            Real event
          </span>
          <span className="rounded-md bg-card/95 px-2 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
            Eventbrite
          </span>
        </div>
      </div>

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
    </article>
  );
}
