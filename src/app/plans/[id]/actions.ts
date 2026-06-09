"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { plans } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Marks a plan as most-recently-updated so it becomes the user's
 * "current" plan when they return to the home page.
 */
export async function touchPlan(planId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  await db
    .update(plans)
    .set({ updatedAt: new Date() })
    .where(and(eq(plans.id, planId), eq(plans.userId, session.user.id)));

  revalidatePath("/");
  revalidatePath("/plans");
}
