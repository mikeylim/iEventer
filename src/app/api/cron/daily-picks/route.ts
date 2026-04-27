import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { isNotNull } from "drizzle-orm";
import { generateDailyPick } from "@/lib/dailyPick";

/**
 * Generates today's daily pick for every onboarded user.
 *
 * Triggered by:
 *   - Cloudflare Cron Trigger (in production), or
 *   - On-demand by signed-in users hitting `/` (lazy fallback during dev).
 *
 * Auth: simple shared secret in `CRON_SECRET`. Cloudflare Cron Triggers send
 * a configurable header; this works the same way as Vercel's pattern.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find every user who has finished onboarding
  const onboardedUsers = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(isNotNull(profiles.onboardedAt));

  const results = await Promise.allSettled(
    onboardedUsers.map((u) => generateDailyPick(u.userId))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  // Log failures so we can see what's going wrong in cron logs
  results
    .filter((r) => r.status === "rejected")
    .forEach((r) => {
      const reason = (r as PromiseRejectedResult).reason;
      console.error("Daily pick generation failed:", reason);
    });

  return NextResponse.json({
    total: onboardedUsers.length,
    succeeded,
    failed,
  });
}
