import type { Coordinates, WeatherSummary } from "@/lib/discovery";

type OpenMeteoResponse = {
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
  };
};

export async function getWeatherForDate(
  coordinates: Coordinates,
  date: string
): Promise<WeatherSummary | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
    timezone: "auto",
    start_date: date,
    end_date: date,
  });
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    { next: { revalidate: 60 * 30 } }
  );
  if (!response.ok) return null;

  const data = (await response.json()) as OpenMeteoResponse;
  const daily = data.daily;
  const weatherCode = daily?.weather_code?.[0];
  const temperatureMin = daily?.temperature_2m_min?.[0];
  const temperatureMax = daily?.temperature_2m_max?.[0];
  const precipitationProbability =
    daily?.precipitation_probability_max?.[0];
  const windSpeedMax = daily?.wind_speed_10m_max?.[0];

  if (
    daily?.time?.[0] !== date ||
    !Number.isFinite(weatherCode) ||
    !Number.isFinite(temperatureMin) ||
    !Number.isFinite(temperatureMax) ||
    !Number.isFinite(precipitationProbability) ||
    !Number.isFinite(windSpeedMax)
  ) {
    return null;
  }

  return {
    date,
    condition: describeWeatherCode(weatherCode!),
    weatherCode: weatherCode!,
    temperatureMin: Math.round(temperatureMin!),
    temperatureMax: Math.round(temperatureMax!),
    precipitationProbability: Math.round(precipitationProbability!),
    windSpeedMax: Math.round(windSpeedMax!),
    outdoorFriendly:
      weatherCode! < 51 &&
      precipitationProbability! <= 35 &&
      temperatureMax! >= 5 &&
      temperatureMin! <= 32 &&
      windSpeedMax! <= 40,
  };
}

export function describeWeatherCode(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  return "Thunderstorms";
}
