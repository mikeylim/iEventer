import HomeClient from "./HomeClient";
import { getSessionProfile } from "@/lib/session";
import { getOrCreateCurrentPlan, getPlanWithEvents } from "@/lib/plans";

interface EventItem {
  id: string;
  name: string;
  description: string;
  url: string;
  start: string;
  category: string;
  venue: { name: string; city: string; address: string } | null;
  isFree: boolean;
  logo: string | null;
  planEventId?: string;
}

export default async function Home() {
  const sessionProfile = await getSessionProfile();

  // Default props for anonymous users
  let planId: string | null = null;
  let initialLocation = "";
  let initialPlan: EventItem[] = [];
  let initialRoutePlan: unknown = null;

  if (sessionProfile) {
    initialLocation = sessionProfile.profile?.location || "";

    const plan = await getOrCreateCurrentPlan();
    planId = plan.id;
    initialRoutePlan = plan.optimizedRoute;

    const { events } = await getPlanWithEvents(plan.id);
    initialPlan = events.map((e) => ({
      id: e.sourceId, // use the source id so dedup checks work against search results
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
      planEventId: e.id, // DB row id — used for removals
    }));
  }

  return (
    <HomeClient
      isSignedIn={!!sessionProfile}
      planId={planId}
      initialLocation={initialLocation}
      initialPlan={initialPlan}
      initialRoutePlan={initialRoutePlan as never}
    />
  );
}
