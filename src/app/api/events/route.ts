import { NextRequest, NextResponse } from "next/server";

// Simple geocoding via Nominatim (free, no key needed)
async function geocode(
  location: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      { headers: { "User-Agent": "iEventer/1.0" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
  } catch (e) {
    console.error("Geocode error:", e);
  }
  return null;
}

// Fetch real image URL from Eventbrite media API
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "fun things to do";
    const location = searchParams.get("location") || "";
    const continuation = searchParams.get("continuation") || "";
    const pageSize = parseInt(searchParams.get("page_size") || "10", 10);

    const apiKey = process.env.EVENTBRITE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Eventbrite API key not configured" },
        { status: 500 }
      );
    }

    // Build the destination search request body
    const eventSearch: Record<string, unknown> = {
      q: query,
      dates: ["current_future"],
      page_size: pageSize,
    };

    if (continuation) {
      eventSearch.continuation = continuation;
    }

    // Geocode location for point_radius search
    if (location) {
      const coords = await geocode(location);
      if (coords) {
        eventSearch.point_radius = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius: "50km",
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
      return NextResponse.json(
        { events: [], continuation: null, error: "Could not fetch events" },
        { status: 200 }
      );
    }

    const data = await response.json();
    const rawEvents = data.events?.results || [];
    const nextContinuation = data.events?.pagination?.continuation || null;

    // Fetch all images in parallel
    const imageUrls = await Promise.all(
      rawEvents.map((e: Record<string, unknown>) =>
        e.image_id
          ? fetchImageUrl(String(e.image_id), apiKey)
          : Promise.resolve(null)
      )
    );

    const events = rawEvents.map((e: Record<string, unknown>, i: number) => {
      const locations = (e.locations as Array<Record<string, unknown>>) || [];
      const locality = locations.find((l) => l.type === "locality");
      const country = locations.find((l) => l.type === "country");

      const tags = (e.tags as Array<Record<string, string>>) || [];
      const isFree = tags.some(
        (t) => t.display_name?.toLowerCase() === "free"
      );

      // Extract category from EventbriteCategory tag
      const categoryTag = tags.find((t) => t.prefix === "EventbriteCategory");
      const category = categoryTag?.display_name || "";

      return {
        id: e.id || e.eid,
        name: e.name || "Untitled Event",
        description: ((e.summary as string) || "").slice(0, 200),
        url: e.url,
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
    });

    return NextResponse.json({ events, continuation: nextContinuation });
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json(
      { events: [], continuation: null },
      { status: 200 }
    );
  }
}
