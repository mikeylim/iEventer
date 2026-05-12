import { describe, it, expect } from "vitest";
import {
  filterByWhen,
  filterByPrice,
  filterByCategory,
  type FilterableEvent,
} from "./eventFilters";

function ev(
  start: string,
  opts: { isFree?: boolean; category?: string } = {}
): FilterableEvent {
  return {
    start,
    isFree: opts.isFree ?? false,
    category: opts.category ?? "",
  };
}

describe("filterByWhen", () => {
  // Pin "now" to a Wednesday at noon UTC so weekend/weekday logic is deterministic.
  const now = new Date("2026-06-10T12:00:00Z"); // Wed

  it("returns all events for 'all'", () => {
    const events = [ev("2026-06-10T18:00:00Z"), ev("2026-12-31T10:00:00Z")];
    expect(filterByWhen(events, "all", now)).toHaveLength(2);
  });

  it("'today' matches events on the current date", () => {
    const events = [
      ev("2026-06-10T08:00:00Z"), // today
      ev("2026-06-11T08:00:00Z"), // tomorrow
    ];
    const filtered = filterByWhen(events, "today", now);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].start).toContain("2026-06-10");
  });

  it("'tomorrow' matches events on the next calendar day", () => {
    const events = [
      ev("2026-06-10T08:00:00Z"),
      ev("2026-06-11T08:00:00Z"),
    ];
    const filtered = filterByWhen(events, "tomorrow", now);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].start).toContain("2026-06-11");
  });

  it("'this_weekend' matches Sat + Sun only", () => {
    const events = [
      ev("2026-06-12T08:00:00Z"), // Fri
      ev("2026-06-13T08:00:00Z"), // Sat
      ev("2026-06-14T08:00:00Z"), // Sun
      ev("2026-06-15T08:00:00Z"), // Mon
    ];
    const filtered = filterByWhen(events, "this_weekend", now);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.start.slice(0, 10))).toEqual([
      "2026-06-13",
      "2026-06-14",
    ]);
  });

  it("'this_week' includes today through end-of-week", () => {
    const events = [
      ev("2026-06-09T08:00:00Z"), // yesterday (out)
      ev("2026-06-10T08:00:00Z"), // today
      ev("2026-06-13T08:00:00Z"), // Sat
      ev("2026-06-14T08:00:00Z"), // Sun (end of week)
      ev("2026-06-15T08:00:00Z"), // next Mon (out)
    ];
    const filtered = filterByWhen(events, "this_week", now);
    expect(filtered.map((e) => e.start.slice(0, 10))).toEqual([
      "2026-06-10",
      "2026-06-13",
      "2026-06-14",
    ]);
  });

  it("drops events with no start when filtering by date", () => {
    const events = [ev(""), ev("2026-06-10T08:00:00Z")];
    expect(filterByWhen(events, "today", now)).toHaveLength(1);
  });
});

describe("filterByPrice", () => {
  const events = [
    ev("", { isFree: true }),
    ev("", { isFree: false }),
    ev("", { isFree: true }),
  ];

  it("'all' is a no-op", () => {
    expect(filterByPrice(events, "all")).toHaveLength(3);
  });

  it("'free' keeps only free events", () => {
    expect(filterByPrice(events, "free")).toHaveLength(2);
  });

  it("'paid' excludes free events", () => {
    expect(filterByPrice(events, "paid")).toHaveLength(1);
  });
});

describe("filterByCategory", () => {
  const events = [
    ev("", { category: "Music" }),
    ev("", { category: "Food & Drink" }),
    ev("", { category: "Music" }),
  ];

  it("empty category is a no-op (matches all)", () => {
    expect(filterByCategory(events, "")).toHaveLength(3);
  });

  it("filters to only events with the exact category", () => {
    expect(filterByCategory(events, "Music")).toHaveLength(2);
    expect(filterByCategory(events, "Food & Drink")).toHaveLength(1);
  });

  it("returns empty when no events match", () => {
    expect(filterByCategory(events, "Nothing")).toHaveLength(0);
  });
});
