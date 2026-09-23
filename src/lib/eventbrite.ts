// Eventbrite helpers shared between API routes and server libraries.

import type { Coordinates, DiscoveryItem } from "@/lib/discovery";
import { resolveLocation } from "@/lib/location";

export type NormalizedEvent = DiscoveryItem & {
  kind: "event";
  sourceProvider: "eventbrite";
};

export async function geocode(
  location: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const resolved = await resolveLocation(location);
    return resolved
      ? { latitude: resolved.latitude, longitude: resolved.longitude }
      : null;
  } catch (e) {
    console.error("Geocode error:", e);
  }
  return null;
}

async function fetchImageUrl(
  imageId: string,
  apiKey: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.eventbriteapi.com/v3/media/${imageId}/`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (
      data.url ||
      data.original?.url ||
      data.image_sizes?.medium ||
      null
    );
  } catch {
    return null;
  }
}

export type EventbriteSearchOptions = {
  query: string;
  location?: string;
  pageSize?: number;
  continuation?: string;
  radiusKm?: number;
  coordinates?: Coordinates;
};

export type EventbriteSearchResult = {
  events: NormalizedEvent[];
  continuation: string | null;
};

/**
 * Search Eventbrite via the destination/search endpoint.
 * Geocodes the location string and uses point_radius (city names alone don't
 * filter properly via this API).
 */
export async function searchEventbrite(
  opts: EventbriteSearchOptions
): Promise<EventbriteSearchResult> {
  const apiKey = process.env.EVENTBRITE_API_KEY;
  if (!apiKey) throw new Error("EVENTBRITE_API_KEY is not set");

  const eventSearch: Record<string, unknown> = {
    q: opts.query,
    dates: ["current_future"],
    page_size: opts.pageSize ?? 10,
  };

  if (opts.continuation) {
    eventSearch.continuation = opts.continuation;
  }

  if (opts.location) {
    const coords = opts.coordinates || (await geocode(opts.location));
    if (coords) {
      eventSearch.point_radius = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        radius: `${opts.radiusKm ?? 50}km`,
      };
    }
  }

  const response = await fetch(
    "https://www.eventbriteapi.com/v3/destination/search/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event_search: eventSearch }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Eventbrite error:", response.status, errorText);
    return { events: [], continuation: null };
  }

  const data = await response.json();
  const rawEvents = data.events?.results || [];
  const nextContinuation = data.events?.pagination?.continuation || null;

  const imageUrls = await Promise.all(
    rawEvents.map((e: Record<string, unknown>) =>
      e.image_id
        ? fetchImageUrl(String(e.image_id), apiKey)
        : Promise.resolve(null)
    )
  );

  const events: NormalizedEvent[] = rawEvents.map(
    (e: Record<string, unknown>, i: number) => {
      const locations = (e.locations as Array<Record<string, unknown>>) || [];
      const locality = locations.find((l) => l.type === "locality");
      const country = locations.find((l) => l.type === "country");

      const tags = (e.tags as Array<Record<string, string>>) || [];
      const isFree = tags.some(
        (t) => t.display_name?.toLowerCase() === "free"
      );

      const categoryTag = tags.find((t) => t.prefix === "EventbriteCategory");
      const category = categoryTag?.display_name || "";

      return {
        id: String(e.id || e.eid || ""),
        sourceId: String(e.id || e.eid || ""),
        kind: "event",
        sourceProvider: "eventbrite",
        name: (e.name as string) || "Untitled Event",
        description: ((e.summary as string) || "").slice(0, 200),
        url: (e.url as string) || "",
        start:
          e.start_date && e.start_time
            ? `${e.start_date}T${e.start_time}`
            : (e.start_date as string) || "",
        category,
        venue: locality
          ? {
              name: (locality.name as string) || "",
              city: (locality.name as string) || "",
              address: [locality.name, country?.name]
                .filter(Boolean)
                .join(", "),
            }
          : null,
        isFree,
        logo: imageUrls[i],
      };
    }
  );

  return { events, continuation: nextContinuation };
}
