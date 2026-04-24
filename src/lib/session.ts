import { auth } from "./auth";
import { db } from "@/db/client";
import { profiles, userInterests, interests } from "@/db/schema";
import { eq } from "drizzle-orm";

export type SessionProfile = {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  profile: {
    location: string | null;
    latitude: string | null;
    longitude: string | null;
    defaultRadiusKm: number;
    onboardedAt: Date | null;
    bio: string | null;
  } | null;
  interests: Array<{
    slug: string;
    name: string;
    emoji: string;
    category: string;
  }>;
};

/**
 * Fetch the current session + profile + interests in one round-trip.
 * Returns null if the user is not signed in.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const [profileRow] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));

  const userInterestRows = await db
    .select({
      slug: interests.slug,
      name: interests.name,
      emoji: interests.emoji,
      category: interests.category,
    })
    .from(userInterests)
    .innerJoin(interests, eq(interests.id, userInterests.interestId))
    .where(eq(userInterests.userId, userId));

  return {
    userId,
    name: session.user.name || null,
    email: session.user.email || null,
    image: session.user.image || null,
    profile: profileRow
      ? {
          location: profileRow.location,
          latitude: profileRow.latitude,
          longitude: profileRow.longitude,
          defaultRadiusKm: profileRow.defaultRadiusKm,
          onboardedAt: profileRow.onboardedAt,
          bio: profileRow.bio,
        }
      : null,
    interests: userInterestRows,
  };
}

/**
 * Build a concise natural-language summary of the user for Gemini prompts.
 */
export function summarizeProfile(p: SessionProfile): string {
  const parts: string[] = [];
  if (p.profile?.location) {
    parts.push(`Based in ${p.profile.location}`);
  }
  if (p.interests.length > 0) {
    const top = p.interests.map((i) => i.name).join(", ");
    parts.push(`Interests: ${top}`);
  }
  return parts.join(". ");
}
