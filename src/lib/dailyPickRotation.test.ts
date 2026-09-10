import { describe, expect, it } from "vitest";
import { pickInterestForDate } from "./dailyPickRotation";

describe("pickInterestForDate", () => {
  const interests = ["music", "outdoors", "food"];

  it("returns null when the user has no interests", () => {
    expect(pickInterestForDate([], "2026-09-10")).toBeNull();
  });

  it("returns the same interest for repeated calls on the same date", () => {
    const first = pickInterestForDate(interests, "2026-09-10");
    expect(pickInterestForDate(interests, "2026-09-10")).toBe(first);
  });

  it("advances exactly one interest on the next UTC date", () => {
    const first = pickInterestForDate(interests, "2026-09-30");
    const second = pickInterestForDate(interests, "2026-10-01");
    const firstIndex = interests.indexOf(first!);

    expect(second).toBe(interests[(firstIndex + 1) % interests.length]);
  });

  it("wraps back to the same interest after a complete rotation", () => {
    expect(pickInterestForDate(interests, "2026-09-10")).toBe(
      pickInterestForDate(interests, "2026-09-13")
    );
  });

  it("rejects invalid date strings", () => {
    expect(() => pickInterestForDate(interests, "not-a-date")).toThrow(
      "YYYY-MM-DD"
    );
    expect(() => pickInterestForDate(interests, "2026-02-30")).toThrow(
      "YYYY-MM-DD"
    );
  });
});
