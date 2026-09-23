import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  generateStructuredAi: vi.fn(),
  getSessionProfile: vi.fn(),
}));

vi.mock("@/lib/ai/client", () => ({
  generateStructuredAi: mocks.generateStructuredAi,
}));

vi.mock("@/lib/session", () => ({
  getSessionProfile: mocks.getSessionProfile,
  summarizeProfile: vi.fn(() => ""),
}));

import { POST } from "./route";

const events = [
  {
    id: "event-1",
    name: "Gallery Night",
    description: "Art exhibits",
    url: "https://example.com/events/gallery",
    start: "2026-09-05T18:00:00Z",
    category: "Arts",
    venue: { name: "Gallery", city: "Toronto", address: "1 Art St" },
    isFree: true,
    logo: null,
  },
  {
    id: "event-2",
    name: "Jazz Show",
    description: "Live music",
    url: "https://example.com/events/jazz",
    start: "2026-09-05T21:00:00Z",
    category: "Music",
    venue: { name: "Music Hall", city: "Toronto", address: "2 Jazz St" },
    isFree: false,
    logo: null,
  },
];

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/optimize-route", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/optimize-route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionProfile.mockResolvedValue(null);
  });

  it("requires at least two valid events before calling Gemini", async () => {
    const response = await POST(request({ events: [events[0]] }));

    expect(response.status).toBe(400);
    expect(mocks.generateStructuredAi).not.toHaveBeenCalled();
    expect(mocks.getSessionProfile).not.toHaveBeenCalled();
  });

  it("rejects unsafe event URLs before calling Gemini", async () => {
    const response = await POST(
      request({ events: [{ ...events[0], url: "javascript:alert(1)" }, events[1]] })
    );

    expect(response.status).toBe(400);
    expect(mocks.generateStructuredAi).not.toHaveBeenCalled();
  });

  it("rejects an oversized body before loading profile data or calling Gemini", async () => {
    const response = await POST(
      request({ events, preferences: "a".repeat(33 * 1024) })
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: "Request body exceeds the 32 KiB limit.",
    });
    expect(mocks.getSessionProfile).not.toHaveBeenCalled();
    expect(mocks.generateStructuredAi).not.toHaveBeenCalled();
  });

  it("returns a route that includes each supplied event", async () => {
    mocks.generateStructuredAi.mockResolvedValue({
      route: events.map((event, index) => ({
        order: index + 1,
        eventName: event.name,
        eventUrl: event.url,
        time: index === 0 ? "Friday at 6:00 PM" : "Friday at 9:00 PM",
        travelTip: "Use public transit.",
        reason: "This order follows the event times.",
      })),
      summary: "An arts and music evening.",
      tips: ["Allow time for transit."],
      estimatedTotalTime: "5 hours",
      estimatedTotalCost: "$40",
    });

    const response = await POST(request({ events, location: "Toronto" }));

    expect(response.status).toBe(200);
    expect((await response.json()).route).toHaveLength(2);
    expect(mocks.generateStructuredAi).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: "routeOptimization",
        contents: expect.stringContaining('"startingLocation":"Toronto"'),
      })
    );
  });
});
