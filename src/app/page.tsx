import HomeClient from "./HomeClient";
import { getSessionProfile } from "@/lib/session";
import { getOrCreateCurrentPlan, getPlanWithEvents } from "@/lib/plans";
import {
  generateDailyPick,
  getTodaysPick,
  type StoredDailyPick,
} from "@/lib/dailyPick";
import type { DiscoveryItem } from "@/lib/discovery";

// Auth-dependent: never cache.
export const dynamic = "force-dynamic";

// Serialize Date fields so we can pass the pick from server → client.
type SerializedPick = Omit<StoredDailyPick, "seenAt" | "dismissedAt"> & {
  seenAt: string | null;
  dismissedAt: string | null;
};

function serializePick(p: StoredDailyPick): SerializedPick {
  return {
    ...p,
    seenAt: p.seenAt ? p.seenAt.toISOString() : null,
    dismissedAt: p.dismissedAt ? p.dismissedAt.toISOString() : null,
  };
}

export default async function Home() {
  const sessionProfile = await getSessionProfile();

  // Default props for anonymous users
  let planId: string | null = null;
  let initialLocation = "";
  let initialPlan: DiscoveryItem[] = [];
  let initialRoutePlan: unknown = null;
  let dailyPick: SerializedPick | null = null;

  if (sessionProfile) {
    initialLocation = sessionProfile.profile?.location || "";

    const plan = await getOrCreateCurrentPlan();
    planId = plan.id;
    initialRoutePlan = plan.optimizedRoute;

    const { events } = await getPlanWithEvents(plan.id);
    initialPlan = events.map((e) => {
      const kind =
        e.sourceProvider === "geoapify"
          ? e.category === "Cafe" || e.category === "Restaurant"
            ? "food"
            : "place"
          : "event";

      return {
        id:
          e.sourceProvider === "geoapify"
            ? `geoapify:${e.sourceId}`
            : e.sourceId,
        sourceId: e.sourceId,
        sourceProvider: e.sourceProvider,
        kind,
        name: e.name,
        description: e.description || "",
        url: e.url,
        start: e.startAt ? e.startAt.toISOString() : "",
        category: e.category || "",
        venue: e.venueName
          ? {
              name: e.venueName,
              city: "",
              address: e.venueAddress || "",
            }
          : null,
        isFree: e.isFree,
        logo: e.imageUrl,
        latitude: e.latitude == null ? undefined : Number(e.latitude),
        longitude: e.longitude == null ? undefined : Number(e.longitude),
        planEventId: e.id,
      };
    });

    // Daily pick — only for users who have completed onboarding.
    if (sessionProfile.profile?.onboardedAt) {
      try {
        const existing = await getTodaysPick(sessionProfile.userId);
        const pick =
          existing ??
          (await generateDailyPick(sessionProfile.userId).catch((err) => {
            console.error("Daily pick generation failed:", err);
            return null;
          }));
        if (pick && !pick.dismissedAt) {
          dailyPick = serializePick(pick);
        }
      } catch (err) {
        console.error("Failed to load daily pick:", err);
      }
    }
  }

  return (
    <HomeClient
      key={sessionProfile?.userId || "anon"}
      isSignedIn={!!sessionProfile}
      planId={planId}
      initialLocation={initialLocation}
      initialPlan={initialPlan}
      initialRoutePlan={initialRoutePlan as never}
      dailyPick={dailyPick}
    />
  );
}
