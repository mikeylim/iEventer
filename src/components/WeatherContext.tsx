import { CloudRain, CloudSun, MapPin, Wind } from "lucide-react";
import type { WeatherSummary } from "@/lib/discovery";

export function WeatherContext({
  weather,
  destination,
}: {
  weather: WeatherSummary;
  destination: string;
}) {
  const WeatherIcon = weather.outdoorFriendly ? CloudSun : CloudRain;
  const formattedDate = new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${weather.date}T12:00:00Z`));

  return (
    <aside
      aria-label="Weather context"
      className="flex flex-col gap-4 border-y border-border bg-accent/15 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-background text-primary shadow-sm">
          <WeatherIcon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold">
            {weather.condition}, {weather.temperatureMin}–{weather.temperatureMax}°C
          </p>
          <p className="text-xs text-muted-foreground">
            {formattedDate} · Weather by{" "}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Open-Meteo
            </a>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CloudRain className="size-3.5" aria-hidden="true" />
          {weather.precipitationProbability}% precipitation
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Wind className="size-3.5" aria-hidden="true" />
          Wind up to {weather.windSpeedMax} km/h
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{destination}</span>
        </span>
      </div>
    </aside>
  );
}
