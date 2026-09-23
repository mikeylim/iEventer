import { describe, expect, it } from "vitest";
import { applyWeatherContext, type DiscoveryItem, type WeatherSummary } from "./discovery";

function item(
  id: string,
  setting: DiscoveryItem["setting"],
  name = id
): DiscoveryItem {
  return {
    id,
    sourceId: id,
    kind: "place",
    sourceProvider: "geoapify",
    name,
    description: "",
    url: "https://example.com",
    start: "",
    category: "Attraction",
    venue: null,
    isFree: false,
    logo: null,
    setting,
  };
}

function forecast(outdoorFriendly: boolean): WeatherSummary {
  return {
    date: "2026-09-26",
    condition: outdoorFriendly ? "Clear sky" : "Rain",
    weatherCode: outdoorFriendly ? 0 : 63,
    temperatureMin: 12,
    temperatureMax: 21,
    precipitationProbability: outdoorFriendly ? 5 : 90,
    windSpeedMax: 15,
    outdoorFriendly,
  };
}

describe("applyWeatherContext", () => {
  it("prioritizes outdoor places in suitable weather", () => {
    const result = applyWeatherContext(
      [item("museum", "indoor"), item("park", "outdoor")],
      forecast(true)
    );

    expect(result[0].id).toBe("park");
    expect(result[0].weatherNote).toMatch(/suitable/i);
  });

  it("prioritizes indoor places in poor weather", () => {
    const result = applyWeatherContext(
      [item("park", "outdoor"), item("museum", "indoor")],
      forecast(false)
    );

    expect(result[0].id).toBe("museum");
    expect(result[0].weatherNote).toMatch(/indoor/i);
  });

  it("keeps text relevance stronger than the weather adjustment", () => {
    const result = applyWeatherContext(
      [item("park", "outdoor"), item("gallery", "indoor", "Modern Art Gallery")],
      forecast(true),
      "modern art"
    );

    expect(result[0].id).toBe("gallery");
  });
});
