import { describe, expect, it } from "vitest";
import {
  assertRouteMatchesEvents,
  assertSuggestionCount,
  optimizeRouteRequestSchema,
  parseStructuredAiResponse,
  suggestionRequestSchema,
  suggestionResponseSchema,
  toGeminiJsonSchema,
  type RoutePlan,
  type SuggestionResponse,
} from "./contracts";

const suggestion: SuggestionResponse["suggestions"][number] = {
  title: "Waterfront walk",
  emoji: "🚶",
  description: "Explore the waterfront at an easy pace.",
  steps: ["Choose a trail", "Bring water"],
  details: {
    difficulty: "Easy",
    cost: "Free",
    duration: "90 minutes",
    bestFor: "Friends",
    location: "Toronto waterfront",
  },
  searchKeyword: "Toronto waterfront walk",
};

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

const routePlan: RoutePlan = {
  route: [
    {
      order: 1,
      eventName: "Gallery Night",
      eventUrl: events[0].url,
      time: "Friday at 6:00 PM",
      travelTip: "Start downtown.",
      reason: "It begins first.",
    },
    {
      order: 2,
      eventName: "Jazz Show",
      eventUrl: events[1].url,
      time: "Friday at 9:00 PM",
      travelTip: "Take the subway north.",
      reason: "It follows the gallery visit.",
    },
  ],
  summary: "An arts and music evening.",
  tips: ["Allow time for transit."],
  estimatedTotalTime: "5 hours",
  estimatedTotalCost: "$40",
};

describe("suggestion request contract", () => {
  it("normalizes valid input and applies defaults", () => {
    expect(suggestionRequestSchema.parse({ prompt: "  Something outdoors  " })).toEqual({
      prompt: "Something outdoors",
      count: 4,
      exclude: [],
    });
  });

  it("requires either prompt text or a selected preference", () => {
    expect(suggestionRequestSchema.safeParse({}).success).toBe(false);
    expect(
      suggestionRequestSchema.safeParse({ preferences: { mood: [] } }).success
    ).toBe(false);
  });

  it("rejects requests beyond the bounded prompt and suggestion limits", () => {
    expect(
      suggestionRequestSchema.safeParse({ prompt: "a".repeat(601) }).success
    ).toBe(false);
    expect(
      suggestionRequestSchema.safeParse({ prompt: "music", count: 7 }).success
    ).toBe(false);
  });
});

describe("structured AI response contract", () => {
  it("parses a valid suggestion response", () => {
    const payload = JSON.stringify({ suggestions: [suggestion] });
    expect(parseStructuredAiResponse(payload, suggestionResponseSchema)).toEqual({
      suggestions: [suggestion],
    });
  });

  it("rejects valid JSON with missing required fields", () => {
    expect(() =>
      parseStructuredAiResponse(
        JSON.stringify({ suggestions: [{ title: "Incomplete" }] }),
        suggestionResponseSchema
      )
    ).toThrow();
  });

  it("produces a Gemini schema without unsupported validation keywords", () => {
    const schema = JSON.stringify(toGeminiJsonSchema(suggestionResponseSchema));
    expect(schema).toContain('"suggestions"');
    expect(schema).toContain('"required"');
    expect(schema).not.toContain('"$schema"');
    expect(schema).not.toContain('"maxLength"');
    expect(schema).not.toContain('"default"');
  });

  it("enforces the exact number of requested suggestions", () => {
    expect(() => assertSuggestionCount({ suggestions: [suggestion] }, 2)).toThrow(
      "expected 2 suggestions"
    );
  });
});

describe("route optimization contract", () => {
  it("accepts a bounded plan request with HTTP event URLs", () => {
    expect(optimizeRouteRequestSchema.parse({ events }).events).toHaveLength(2);
  });

  it("rejects non-HTTP event URLs", () => {
    expect(
      optimizeRouteRequestSchema.safeParse({
        events: [{ ...events[0], url: "javascript:alert(1)" }, events[1]],
      }).success
    ).toBe(false);
  });

  it("rejects routes containing hallucinated or duplicate event URLs", () => {
    expect(() =>
      assertRouteMatchesEvents(
        {
          ...routePlan,
          route: routePlan.route.map((stop) => ({
            ...stop,
            eventUrl: "https://example.com/events/invented",
          })),
        },
        events
      )
    ).toThrow("unknown or duplicate events");
  });

  it("rejects routes that alter event names or order numbers", () => {
    expect(() =>
      assertRouteMatchesEvents(
        {
          ...routePlan,
          route: [{ ...routePlan.route[0], eventName: "Invented name" }, routePlan.route[1]],
        },
        events
      )
    ).toThrow("changed an event name");

    expect(() =>
      assertRouteMatchesEvents(
        {
          ...routePlan,
          route: [{ ...routePlan.route[0], order: 2 }, routePlan.route[1]],
        },
        events
      )
    ).toThrow("route order is not sequential");
  });

  it("accepts a route containing every supplied event once", () => {
    expect(() => assertRouteMatchesEvents(routePlan, events)).not.toThrow();
  });
});
