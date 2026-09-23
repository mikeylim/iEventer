import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  resolveLocation: vi.fn(),
  searchEventbrite: vi.fn(),
  searchGeoapifyPlaces: vi.fn(),
  getWeatherForDate: vi.fn(),
}));

vi.mock("@/lib/location", () => ({ resolveLocation: mocks.resolveLocation }));
vi.mock("@/lib/eventbrite", () => ({
  searchEventbrite: mocks.searchEventbrite,
}));
vi.mock("@/lib/geoapify", () => ({
  searchGeoapifyPlaces: mocks.searchGeoapifyPlaces,
}));
vi.mock("@/lib/weather", () => ({
  getWeatherForDate: mocks.getWeatherForDate,
}));

import { GET } from "./route";

function request(params: Record<string, string>) {
  return new NextRequest(
    `http://localhost/api/discover?${new URLSearchParams(params).toString()}`
  );
}

describe("GET /api/discover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveLocation.mockResolvedValue({
      latitude: 43.6532,
      longitude: -79.3832,
      label: "Downtown Toronto, Toronto, ON, Canada",
      placeId: "toronto",
      provider: "geoapify",
    });
    mocks.searchEventbrite.mockResolvedValue({
      events: [{ id: "event-1", kind: "event" }],
      continuation: "next-page",
    });
    mocks.searchGeoapifyPlaces.mockResolvedValue({
      configured: true,
      places: [
        {
          id: "place-1",
          name: "High Park",
          category: "Park",
          description: "Park",
          setting: "outdoor",
          distanceMeters: 1200,
        },
      ],
    });
    mocks.getWeatherForDate.mockResolvedValue({
      date: "2026-09-26",
      condition: "Clear sky",
      weatherCode: 0,
      temperatureMin: 12,
      temperatureMax: 21,
      precipitationProbability: 5,
      windSpeedMax: 15,
      outdoorFriendly: true,
    });
  });

  it("requires a request-specific destination", async () => {
    const response = await GET(request({ q: "parks", date: "2026-09-26" }));

    expect(response.status).toBe(400);
    expect(mocks.resolveLocation).not.toHaveBeenCalled();
  });

  it("rejects an impossible calendar date", async () => {
    const response = await GET(
      request({
        q: "parks",
        location: "Toronto",
        date: "2026-02-31",
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.resolveLocation).not.toHaveBeenCalled();
  });

  it("combines events, places, weather, and the resolved destination", async () => {
    const response = await GET(
      request({
        q: "outdoor art",
        location: "Downtown Toronto",
        date: "2026-09-26",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.events).toHaveLength(1);
    expect(body.places[0].weatherNote).toMatch(/suitable/i);
    expect(body.weather.condition).toBe("Clear sky");
    expect(body.resolvedLocation).toContain("Downtown Toronto");
    expect(mocks.searchEventbrite).toHaveBeenCalledWith(
      expect.objectContaining({
        location: "Downtown Toronto",
        coordinates: { latitude: 43.6532, longitude: -79.3832 },
      })
    );
  });

  it("loads event pagination without spending place or weather quota", async () => {
    const response = await GET(
      request({
        q: "music",
        location: "Downtown Toronto",
        date: "2026-09-26",
        scope: "events",
        continuation: "page-two",
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.searchGeoapifyPlaces).not.toHaveBeenCalled();
    expect(mocks.getWeatherForDate).not.toHaveBeenCalled();
  });
});
