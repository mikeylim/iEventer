import { describe, expect, it } from "vitest";
import { describeWeatherCode } from "./weather";

describe("describeWeatherCode", () => {
  it.each([
    [0, "Clear sky"],
    [3, "Partly cloudy"],
    [63, "Rain"],
    [95, "Thunderstorms"],
  ])("maps WMO code %i to %s", (code, label) => {
    expect(describeWeatherCode(code)).toBe(label);
  });
});
