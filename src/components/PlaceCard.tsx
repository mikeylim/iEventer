"use client";

import {
  Check,
  CloudSun,
  ExternalLink,
  Landmark,
  MapPin,
  Plus,
  TreePine,
  UtensilsCrossed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DiscoveryItem } from "@/lib/discovery";

export function PlaceCard({
  item,
  onAddToPlan,
  isInPlan,
}: {
  item: DiscoveryItem;
  onAddToPlan: (item: DiscoveryItem) => void;
  isInPlan: boolean;
}) {
  const kindLabel = item.kind === "food" ? "Food & drink" : "Place";

  return (
    <article
      aria-label={`${kindLabel}: ${item.name}`}
      className="flex min-h-[330px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-[border-color,box-shadow] duration-300 animate-fade-in hover:border-primary/45 hover:shadow-md"
    >
      <div className="flex min-h-28 items-center justify-between border-b border-border bg-accent/20 px-5 py-4">
        <span className="flex size-14 items-center justify-center rounded-md border border-primary/15 bg-background text-primary shadow-sm">
          {item.kind === "food" ? (
            <UtensilsCrossed className="size-7" aria-hidden="true" />
          ) : item.category === "Park" || item.category === "Viewpoint" ? (
            <TreePine className="size-7" aria-hidden="true" />
          ) : (
            <Landmark className="size-7" aria-hidden="true" />
          )}
        </span>
        <div className="flex flex-col items-end gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-background/90 px-2 py-1 text-xs font-semibold">
            {item.kind === "food" ? (
              <UtensilsCrossed className="size-3.5 text-primary" aria-hidden="true" />
            ) : (
              <Landmark className="size-3.5 text-primary" aria-hidden="true" />
            )}
            {kindLabel}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Geoapify
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{item.category}</Badge>
          {typeof item.distanceMeters === "number" && (
            <Badge variant="secondary">
              {formatDistance(item.distanceMeters)} away
            </Badge>
          )}
        </div>

        <h3 className="font-display text-lg leading-tight line-clamp-2">
          {item.name}
        </h3>

        {item.venue?.address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="line-clamp-2">{item.venue.address}</span>
          </div>
        )}

        {item.weatherNote && (
          <div className="flex items-start gap-2 rounded-md border border-primary/15 bg-primary/5 px-3 py-2 text-sm">
            <CloudSun className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{item.weatherNote}</span>
          </div>
        )}

        <div className="mt-auto flex gap-2 pt-2">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              View
            </a>
          </Button>
          <Button
            size="sm"
            variant={isInPlan ? "secondary" : "default"}
            onClick={() => onAddToPlan(item)}
            disabled={isInPlan}
            className="flex-1"
          >
            {isInPlan ? <Check className="size-4" /> : <Plus className="size-4" />}
            {isInPlan ? "Added" : "Add to Plan"}
          </Button>
        </div>
      </div>
    </article>
  );
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) return `${distanceMeters} m`;
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}
