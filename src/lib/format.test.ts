import { describe, it, expect } from "vitest";
import { formatEventDate } from "./format";

describe("formatEventDate", () => {
  it("returns empty string for empty input", () => {
    expect(formatEventDate("")).toBe("");
    expect(formatEventDate(null)).toBe("");
    expect(formatEventDate(undefined)).toBe("");
  });

  it("passes through unparseable strings (so AI-generated readable times survive)", () => {
    expect(formatEventDate("Saturday evening")).toBe("Saturday evening");
    expect(formatEventDate("nope")).toBe("nope");
    expect(formatEventDate("flexible time")).toBe("flexible time");
  });

  it("formats valid ISO timestamps as a friendly local string", () => {
    // Noon UTC mid-month — won't cross a date boundary in any reasonable TZ.
    const out = formatEventDate("2026-06-15T12:00:00Z");
    expect(out).toMatch(/Jun/);
    // Day of the week always renders as 3-letter abbrev (e.g. "Mon").
    expect(out).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
  });

  it("preserves time information (not just the date)", () => {
    const out = formatEventDate("2026-06-15T12:00:00Z");
    // toLocaleString with hour/minute always emits an AM/PM marker in en-US.
    expect(out).toMatch(/AM|PM/i);
  });
});
