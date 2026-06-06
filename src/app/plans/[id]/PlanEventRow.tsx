"use client";

import { useState, useTransition } from "react";
import {
  Calendar,
  MapPin,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { removeEventFromPlan } from "@/lib/plans";
import { formatEventDate } from "@/lib/format";

export interface PlanEventRowProps {
  id: string;
  index: number;
  name: string;
  url: string;
  startAt: string | null; // serialized ISO from server
  venueName: string | null;
  venueAddress: string | null;
  isFree: boolean;
  imageUrl: string | null;
}

export function PlanEventRow(props: PlanEventRowProps) {
  const [removed, setRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleRemove() {
    if (!confirm(`Remove "${props.name}" from this plan?`)) return;
    startTransition(async () => {
      try {
        await removeEventFromPlan(props.id);
        setRemoved(true);
      } catch (err) {
        console.error("Failed to remove event:", err);
        setError("Couldn't remove. Try again.");
      }
    });
  }

  if (removed) return null;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="flex flex-col sm:flex-row">
        {props.imageUrl ? (
          <div className="sm:w-48 aspect-[4/3] sm:aspect-auto overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={props.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="sm:w-48 aspect-[4/3] sm:aspect-auto bg-gradient-to-br from-muted to-accent/30 flex items-center justify-center shrink-0">
            <Calendar className="w-10 h-10 text-muted-foreground/40" />
          </div>
        )}
        <div className="flex-1 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline">{props.index + 1}</Badge>
            {props.startAt && (
              <span className="text-sm text-muted-foreground">
                {formatEventDate(props.startAt)}
              </span>
            )}
            {props.isFree && (
              <Badge variant="secondary" className="ml-auto">
                FREE
              </Badge>
            )}
          </div>
          <h3 className="font-display text-xl">{props.name}</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            {props.venueName && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>
                  {props.venueName}
                  {props.venueAddress ? `, ${props.venueAddress}` : ""}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button asChild variant="outline" size="sm">
              <a
                href={props.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Event Page
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isPending}
              className="text-muted-foreground hover:text-destructive ml-auto"
              aria-label={`Remove ${props.name}`}
            >
              <Trash2 className="w-4 h-4" />
              {isPending ? "Removing..." : "Remove"}
            </Button>
          </div>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
