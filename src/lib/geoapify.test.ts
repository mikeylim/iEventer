import { describe, expect, it } from "vitest";
import { normalizeGeoapifyPlace } from "./geoapify";

describe("normalizeGeoapifyPlace", () => {
  it("normalizes cafes as food results with stable provider IDs", () => {
    const result = normalizeGeoapifyPlace({
      properties: {
        place_id: "cafe-123",
        name: "Corner Cafe",
        formatted: "1 King Street, Toronto",
        city: "Toronto",
        lat: 43.65,
        lon: -79.38,
        distance: 425.4,
        categories: ["catering.cafe"],
        website: "https://example.com/cafe",
      },
    });

    expect(result).toMatchObject({
      id: "geoapify:cafe-123",
      sourceId: "cafe-123",
      sourceProvider: "geoapify",
      kind: "food",
      category: "Cafe",
      setting: "indoor",
      distanceMeters: 425,
    });
  });

  it("rejects entries without a stable ID or name", () => {
    expect(normalizeGeoapifyPlace({ properties: { name: "No ID" } })).toBeNull();
  });
});
