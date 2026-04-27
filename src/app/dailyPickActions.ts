"use server";

import { auth } from "@/lib/auth";
import {
  generateDailyPick,
  markPickSeen as markSeen,
  dismissPick as dismiss,
} from "@/lib/dailyPick";
import { revalidatePath } from "next/cache";

export async function regenerateTodaysPick() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  const pick = await generateDailyPick(session.user.id, { force: true });
  revalidatePath("/");
  return pick;
}

export async function markPickSeen(pickId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  await markSeen(pickId, session.user.id);
}

export async function dismissPick(pickId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  await dismiss(pickId, session.user.id);
  revalidatePath("/");
}
