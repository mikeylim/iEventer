import type { Coordinates } from "@/lib/discovery";

export type ResolvedLocation = Coordinates & {
  label: string;
  placeId: string | null;
  provider: "geoapify" | "nominatim";
};

type GeoapifyGeocodeResponse = {
  results?: Array<{
    lat?: number;
    lon?: number;
    formatted?: string;
    place_id?: string;
  }>;
};

type NominatimResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

export async function resolveLocation(
  location: string
): Promise<ResolvedLocation | null> {
  const normalizedLocation = location.trim();
  if (!normalizedLocation) return null;

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (apiKey) {
    try {
      const params = new URLSearchParams({
        text: normalizedLocation,
        limit: "1",
        format: "json",
        apiKey,
      });
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/search?${params.toString()}`,
        { next: { revalidate: 60 * 60 * 24 * 7 } }
      );

      if (response.ok) {
        const data = (await response.json()) as GeoapifyGeocodeResponse;
        const result = data.results?.[0];
        if (
          result &&
          typeof result.lat === "number" &&
          typeof result.lon === "number"
        ) {
          return {
            latitude: result.lat,
            longitude: result.lon,
            label: result.formatted || normalizedLocation,
            placeId: result.place_id || null,
            provider: "geoapify",
          };
        }
      }
    } catch {
      // Fall through to the public geocoder when Geoapify is unavailable.
    }
  }

  const params = new URLSearchParams({
    q: normalizedLocation,
    format: "jsonv2",
    limit: "1",
  });
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        "Accept-Language": "en",
        "User-Agent":
          "iEventer/1.0 (https://ieventer.mikedohyunlim.workers.dev)",
      },
      next: { revalidate: 60 * 60 * 24 * 7 },
    }
  );
  if (!response.ok) return null;

  const data = (await response.json()) as NominatimResult[];
  const result = data[0];
  const latitude = Number(result?.lat);
  const longitude = Number(result?.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    latitude,
    longitude,
    label: result.display_name || normalizedLocation,
    placeId: null,
    provider: "nominatim",
  };
}
