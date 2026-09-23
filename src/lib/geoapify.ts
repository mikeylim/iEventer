import type {
  Coordinates,
  DiscoveryItem,
  PlaceSetting,
} from "@/lib/discovery";

const PLACE_CATEGORIES = [
  "leisure.park",
  "entertainment.museum",
  "entertainment.culture.gallery",
  "entertainment.culture.arts_centre",
  "tourism.attraction",
  "tourism.attraction.viewpoint",
  "catering.restaurant",
  "catering.cafe",
].join(",");

type GeoapifyFeature = {
  properties?: {
    place_id?: string;
    name?: string;
    formatted?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    lat?: number;
    lon?: number;
    distance?: number;
    categories?: string[];
    website?: string;
  };
};

type GeoapifyPlacesResponse = {
  features?: GeoapifyFeature[];
};

export type PlaceSearchResult = {
  places: DiscoveryItem[];
  configured: boolean;
};

export async function searchGeoapifyPlaces({
  coordinates,
  limit = 20,
}: {
  coordinates: Coordinates;
  limit?: number;
}): Promise<PlaceSearchResult> {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) return { places: [], configured: false };

  const params = new URLSearchParams({
    categories: PLACE_CATEGORIES,
    filter: `circle:${coordinates.longitude},${coordinates.latitude},12000`,
    bias: `proximity:${coordinates.longitude},${coordinates.latitude}`,
    limit: String(Math.min(Math.max(limit, 1), 20)),
    lang: "en",
    apiKey,
  });
  const response = await fetch(
    `https://api.geoapify.com/v2/places?${params.toString()}`,
    { next: { revalidate: 60 * 60 } }
  );
  if (!response.ok) {
    throw new Error(`Geoapify request failed with status ${response.status}`);
  }

  const data = (await response.json()) as GeoapifyPlacesResponse;
  return {
    places: (data.features || [])
      .map(normalizeGeoapifyPlace)
      .filter((place): place is DiscoveryItem => place !== null),
    configured: true,
  };
}

export function normalizeGeoapifyPlace(
  feature: GeoapifyFeature
): DiscoveryItem | null {
  const place = feature.properties;
  if (!place?.place_id || !place.name) return null;

  const categories = place.categories || [];
  const kind = categories.some((category) => category.startsWith("catering"))
    ? "food"
    : "place";
  const category = getCategoryLabel(categories);
  const setting = getPlaceSetting(categories);
  const latitude = Number(place.lat);
  const longitude = Number(place.lon);
  const hasCoordinates =
    Number.isFinite(latitude) && Number.isFinite(longitude);
  const mapUrl = hasCoordinates
    ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`
    : "https://www.openstreetmap.org";

  return {
    id: `geoapify:${place.place_id}`,
    sourceId: place.place_id,
    kind,
    sourceProvider: "geoapify",
    name: place.name,
    description: category,
    url: toSafeHttpUrl(place.website) || mapUrl,
    start: "",
    category,
    venue: {
      name: place.name,
      city: place.city || "",
      address:
        place.formatted ||
        [place.address_line1, place.address_line2].filter(Boolean).join(", "),
    },
    isFree: false,
    logo: null,
    latitude: hasCoordinates ? latitude : undefined,
    longitude: hasCoordinates ? longitude : undefined,
    distanceMeters:
      typeof place.distance === "number" ? Math.round(place.distance) : undefined,
    setting,
  };
}

function getCategoryLabel(categories: string[]): string {
  if (categories.some((category) => category.startsWith("catering.cafe"))) {
    return "Cafe";
  }
  if (
    categories.some(
      (category) =>
        category.startsWith("catering.restaurant") ||
        category.startsWith("catering.fast_food")
    )
  ) {
    return "Restaurant";
  }
  if (categories.includes("entertainment.museum")) return "Museum";
  if (categories.includes("entertainment.culture.gallery")) return "Gallery";
  if (categories.includes("entertainment.culture.arts_centre")) {
    return "Arts Centre";
  }
  if (categories.some((category) => category.startsWith("leisure.park"))) {
    return "Park";
  }
  if (categories.includes("tourism.attraction.viewpoint")) return "Viewpoint";
  return "Attraction";
}

function getPlaceSetting(categories: string[]): PlaceSetting {
  if (
    categories.some((category) => category.startsWith("leisure.park")) ||
    categories.includes("tourism.attraction.viewpoint")
  ) {
    return "outdoor";
  }
  if (
    categories.some((category) => category.startsWith("entertainment")) ||
    categories.some((category) => category.startsWith("catering"))
  ) {
    return "indoor";
  }
  return "neutral";
}

function toSafeHttpUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
