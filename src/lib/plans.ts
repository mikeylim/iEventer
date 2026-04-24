"use server";

import { auth } from "./auth";
import { db } from "@/db/client";
import { plans, planEvents } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type PlanEventInput = {
  sourceProvider: string;
  sourceId: string;
  name: string;
  description?: string;
  url: string;
  startAt?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  category?: string | null;
  isFree?: boolean;
  imageUrl?: string | null;
};

/**
 * Get the user's "current" working plan — the most recently updated one.
 * Creates one automatically if the user has no plans yet.
 */
export async function getOrCreateCurrentPlan() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  const userId = session.user.id;

  const [existing] = await db
    .select()
    .from(plans)
    .where(eq(plans.userId, userId))
    .orderBy(desc(plans.updatedAt))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(plans)
    .values({
      userId,
      title: "My Plan",
    })
    .returning();

  return created;
}

export async function listUserPlans() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db
    .select()
    .from(plans)
    .where(eq(plans.userId, session.user.id))
    .orderBy(desc(plans.updatedAt));
}

export async function getPlanWithEvents(planId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, planId), eq(plans.userId, session.user.id)));

  if (!plan) throw new Error("Plan not found");

  const events = await db
    .select()
    .from(planEvents)
    .where(eq(planEvents.planId, planId))
    .orderBy(planEvents.orderIdx);

  return { plan, events };
}

export async function addEventToPlan(
  planId: string,
  event: PlanEventInput
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  // Verify ownership
  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, planId), eq(plans.userId, session.user.id)));
  if (!plan) throw new Error("Plan not found");

  // Check for duplicates
  const existing = await db
    .select()
    .from(planEvents)
    .where(
      and(
        eq(planEvents.planId, planId),
        eq(planEvents.sourceProvider, event.sourceProvider),
        eq(planEvents.sourceId, event.sourceId)
      )
    );
  if (existing.length > 0) return existing[0];

  // Get the next order index
  const currentCount = await db
    .select()
    .from(planEvents)
    .where(eq(planEvents.planId, planId));

  const [inserted] = await db
    .insert(planEvents)
    .values({
      planId,
      sourceProvider: event.sourceProvider,
      sourceId: event.sourceId,
      name: event.name,
      description: event.description || null,
      url: event.url,
      startAt: event.startAt ? new Date(event.startAt) : null,
      venueName: event.venueName || null,
      venueAddress: event.venueAddress || null,
      latitude: event.latitude || null,
      longitude: event.longitude || null,
      category: event.category || null,
      isFree: event.isFree || false,
      imageUrl: event.imageUrl || null,
      orderIdx: currentCount.length,
    })
    .returning();

  // Clear cached optimized route since plan changed
  await db
    .update(plans)
    .set({ optimizedRoute: null, updatedAt: new Date() })
    .where(eq(plans.id, planId));

  revalidatePath("/");
  revalidatePath("/plans");
  return inserted;
}

export async function removeEventFromPlan(planEventId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  // Verify ownership via join
  const [row] = await db
    .select({ plan: plans, pe: planEvents })
    .from(planEvents)
    .innerJoin(plans, eq(plans.id, planEvents.planId))
    .where(
      and(eq(planEvents.id, planEventId), eq(plans.userId, session.user.id))
    );
  if (!row) throw new Error("Event not found");

  await db.delete(planEvents).where(eq(planEvents.id, planEventId));

  await db
    .update(plans)
    .set({ optimizedRoute: null, updatedAt: new Date() })
    .where(eq(plans.id, row.plan.id));

  revalidatePath("/");
  revalidatePath("/plans");
}

export async function renamePlan(planId: string, title: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  await db
    .update(plans)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(plans.id, planId), eq(plans.userId, session.user.id)));

  revalidatePath("/plans");
}

export async function deletePlan(planId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  await db
    .delete(plans)
    .where(and(eq(plans.id, planId), eq(plans.userId, session.user.id)));

  revalidatePath("/plans");
}

export async function createNewPlan(title: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  const [plan] = await db
    .insert(plans)
    .values({
      userId: session.user.id,
      title: title.trim() || "Untitled Plan",
    })
    .returning();

  revalidatePath("/plans");
  return plan;
}

export async function saveOptimizedRoute(
  planId: string,
  route: unknown
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  await db
    .update(plans)
    .set({ optimizedRoute: route, updatedAt: new Date() })
    .where(and(eq(plans.id, planId), eq(plans.userId, session.user.id)));
}
