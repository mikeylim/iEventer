export type DiscoveryKind = "event" | "place" | "food";
export type PlaceSetting = "indoor" | "outdoor" | "neutral";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type DiscoveryItem = {
  id: string;
  sourceId: string;
  kind: DiscoveryKind;
  sourceProvider: string;
  name: string;
  description: string;
  url: string;
  start: string;
  category: string;
  venue: { name: string; city: string; address: string } | null;
  isFree: boolean;
  logo: string | null;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  setting?: PlaceSetting;
  weatherNote?: string;
  planEventId?: string;
};

export type WeatherSummary = {
  date: string;
  condition: string;
  weatherCode: number;
  temperatureMin: number;
  temperatureMax: number;
  precipitationProbability: number;
  windSpeedMax: number;
  outdoorFriendly: boolean;
};

export function applyWeatherContext(
  items: DiscoveryItem[],
  weather: WeatherSummary | null,
  query = ""
): DiscoveryItem[] {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 3);

  return items
    .map((item) => ({
      ...item,
      weatherNote: getWeatherNote(item.setting, weather),
    }))
    .sort((a, b) => {
      const scoreDifference =
        scoreDiscoveryItem(b, weather, terms) -
        scoreDiscoveryItem(a, weather, terms);
      if (scoreDifference !== 0) return scoreDifference;
      return (a.distanceMeters ?? Number.MAX_SAFE_INTEGER) -
        (b.distanceMeters ?? Number.MAX_SAFE_INTEGER);
    });
}

function scoreDiscoveryItem(
  item: DiscoveryItem,
  weather: WeatherSummary | null,
  terms: string[]
): number {
  const searchable = `${item.name} ${item.category} ${item.description}`.toLowerCase();
  const relevance = terms.reduce(
    (score, term) => score + (searchable.includes(term) ? 3 : 0),
    0
  );

  if (!weather || item.setting === "neutral") return relevance;
  if (weather.outdoorFriendly) {
    return relevance + (item.setting === "outdoor" ? 2 : 0);
  }
  return relevance + (item.setting === "indoor" ? 2 : 0);
}

function getWeatherNote(
  setting: PlaceSetting | undefined,
  weather: WeatherSummary | null
): string | undefined {
  if (!weather || !setting || setting === "neutral") return undefined;
  if (setting === "outdoor") {
    return weather.outdoorFriendly
      ? "Forecast looks suitable for this outdoor stop."
      : "Weather may affect this outdoor stop.";
  }
  return weather.outdoorFriendly
    ? undefined
    : "A reliable indoor option for this forecast.";
}
