"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { profiles, userInterests, interests } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

const onboardingSchema = z.object({
  interestSlugs: z.array(z.string()).min(3, "Pick at least 3 interests"),
  location: z.string().min(2),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export async function completeOnboarding(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { interestSlugs, location, latitude, longitude } = parsed.data;
  const userId = session.user.id;

  // Upsert profile
  await db
    .insert(profiles)
    .values({
      userId,
      location,
      latitude: latitude || null,
      longitude: longitude || null,
      onboardedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        location,
        latitude: latitude || null,
        longitude: longitude || null,
        onboardedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  // Look up interest IDs by slug
  const interestRows = await db
    .select()
    .from(interests)
    .where(inArray(interests.slug, interestSlugs));

  if (interestRows.length === 0) {
    return { error: "No valid interests selected" };
  }

  // Wipe existing user interests and insert new ones
  await db.delete(userInterests).where(eq(userInterests.userId, userId));
  await db.insert(userInterests).values(
    interestRows.map((i) => ({
      userId,
      interestId: i.id,
    }))
  );

  redirect("/");
}

export async function getInterests() {
  const all = await db.select().from(interests).orderBy(interests.category);
  return all;
}

export async function getCurrentProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id));

  if (!profile) return null;

  const selected = await db
    .select({ slug: interests.slug })
    .from(userInterests)
    .innerJoin(interests, eq(interests.id, userInterests.interestId))
    .where(eq(userInterests.userId, session.user.id));

  return {
    ...profile,
    selectedSlugs: selected.map((s) => s.slug),
  };
}

// Re-export to silence unused import warning when tree-shaking
void and;
