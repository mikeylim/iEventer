import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { applyWeatherContext } from "@/lib/discovery";
import { searchEventbrite } from "@/lib/eventbrite";
import { searchGeoapifyPlaces } from "@/lib/geoapify";
import { resolveLocation } from "@/lib/location";
import { getWeatherForDate } from "@/lib/weather";

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

const discoveryQuerySchema = z.object({
  query: z.string().trim().min(1).max(200),
  location: z.string().trim().min(1).max(200),
  date: z.string().refine(isCalendarDate, "Choose a valid outing date."),
  pageSize: z.number().int().min(1).max(20),
  continuation: z.string().max(500),
  scope: z.enum(["all", "events"]),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = discoveryQuerySchema.safeParse({
      query: searchParams.get("q") || "things to do",
      location: searchParams.get("location") || "",
      date: searchParams.get("date") || new Date().toISOString().slice(0, 10),
      pageSize: Number(searchParams.get("page_size") || "10"),
      continuation: searchParams.get("continuation") || "",
      scope: searchParams.get("scope") || "all",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid discovery request." },
        { status: 400 }
      );
    }

    const { query, location, date, pageSize, continuation, scope } = parsed.data;
    const resolvedLocation = await resolveLocation(location);
    if (!resolvedLocation) {
      return NextResponse.json(
        { error: "We couldn't find that destination. Try a city or neighborhood." },
        { status: 404 }
      );
    }

    const coordinates = {
      latitude: resolvedLocation.latitude,
      longitude: resolvedLocation.longitude,
    };
    const eventRequest = searchEventbrite({
      query,
      location,
      coordinates,
      pageSize,
      continuation,
    });

    if (scope === "events") {
      const eventResult = await eventRequest;
      return NextResponse.json({
        events: eventResult.events,
        places: [],
        weather: null,
        continuation: eventResult.continuation,
        resolvedLocation: resolvedLocation.label,
        providers: { events: "ready", places: "skipped", weather: "skipped" },
      });
    }

    const [eventResult, placeResult, weatherResult] = await Promise.allSettled([
      eventRequest,
      searchGeoapifyPlaces({ coordinates }),
      getWeatherForDate(coordinates, date),
    ]);

    const events =
      eventResult.status === "fulfilled" ? eventResult.value.events : [];
    const placeSearch =
      placeResult.status === "fulfilled"
        ? placeResult.value
        : { places: [], configured: Boolean(process.env.GEOAPIFY_API_KEY) };
    const weather =
      weatherResult.status === "fulfilled" ? weatherResult.value : null;
    const places = applyWeatherContext(placeSearch.places, weather, query);

    logRejectedProvider("Event", eventResult);
    logRejectedProvider("Place", placeResult);
    logRejectedProvider("Weather", weatherResult);

    return NextResponse.json({
      events,
      places,
      weather,
      continuation:
        eventResult.status === "fulfilled"
          ? eventResult.value.continuation
          : null,
      resolvedLocation: resolvedLocation.label,
      providers: {
        events: eventResult.status === "fulfilled" ? "ready" : "unavailable",
        places: !placeSearch.configured
          ? "unconfigured"
          : placeResult.status === "fulfilled"
            ? "ready"
            : "unavailable",
        weather:
          weatherResult.status === "fulfilled" && weather
            ? "ready"
            : "unavailable",
      },
    });
  } catch (error) {
    console.error("Discovery API error", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Discovery is temporarily unavailable. Try again." },
      { status: 503 }
    );
  }
}

function logRejectedProvider(
  provider: string,
  result: PromiseSettledResult<unknown>
) {
  if (result.status === "fulfilled") return;
  console.error(`${provider} discovery failed`, {
    errorType:
      result.reason instanceof Error ? result.reason.name : "UnknownError",
  });
}
