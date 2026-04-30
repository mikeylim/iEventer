import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/db/client";
import { dailyPicks, userInterests, interests, profiles } from "@/db/schema";
import { and, eq, desc, gte } from "drizzle-orm";
import { searchEventbrite, type NormalizedEvent } from "./eventbrite";
import { parseAiJson } from "./parseAiJson";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type StoredDailyPick = {
  id: string;
  pickDate: string;
  reason: string;
  event: NormalizedEvent;
  seenAt: Date | null;
  dismissedAt: Date | null;
};

function todayUtcDateString(): string {
  // YYYY-MM-DD in UTC. Picks reset at midnight UTC.
  // Future improvement: respect user timezone from profile.
  return new Date().toISOString().split("T")[0];
}

function pickInterestForToday(
  interestSlugs: string[],
  date: string
): string | null {
  if (interestSlugs.length === 0) return null;
  // Deterministic rotation: same day picks the same interest, different days
  // emphasize different ones. Day-of-year hash mod number-of-interests.
  const dayHash = date.split("-").reduce((acc, part) => acc + parseInt(part), 0);
  return interestSlugs[dayHash % interestSlugs.length];
}

export async function getTodaysPick(
  userId: string
): Promise<StoredDailyPick | null> {
  const today = todayUtcDateString();
  const [row] = await db
    .select()
    .from(dailyPicks)
    .where(
      and(eq(dailyPicks.userId, userId), eq(dailyPicks.pickDate, today))
    );
  if (!row) return null;
  return {
    id: row.id,
    pickDate: row.pickDate,
    reason: row.reason,
    event: row.eventSnapshot as NormalizedEvent,
    seenAt: row.seenAt,
    dismissedAt: row.dismissedAt,
  };
}

/**
 * Generate a fresh daily pick for the user. Pulls candidates from Eventbrite
 * weighted by their interests, asks Gemini to pick one, and persists it.
 * Throws if there's already a pick for today (use upsert if you need to replace).
 */
export async function generateDailyPick(
  userId: string,
  options: { force?: boolean } = {}
): Promise<StoredDailyPick> {
  const today = todayUtcDateString();

  // 1. Check for existing pick (unless forced)
  if (!options.force) {
    const existing = await getTodaysPick(userId);
    if (existing) return existing;
  }

  // 2. Load profile + interests
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

  if (!profileRow || userInterestRows.length === 0) {
    throw new Error("User profile or interests not set");
  }

  const location = profileRow.location || "";

  // 3. Pick today's emphasized interest, build a search query
  const todaysInterestSlug = pickInterestForToday(
    userInterestRows.map((i) => i.slug),
    today
  );
  const todaysInterest = userInterestRows.find(
    (i) => i.slug === todaysInterestSlug
  )!;

  // Search the emphasized interest
  const { events: candidates } = await searchEventbrite({
    query: todaysInterest.name,
    location,
    pageSize: 12,
  });

  if (candidates.length === 0) {
    // Fallback: search broader interest category
    const { events: fallback } = await searchEventbrite({
      query: todaysInterest.category,
      location,
      pageSize: 12,
    });
    if (fallback.length === 0) {
      throw new Error("No candidate events found");
    }
    candidates.push(...fallback);
  }

  // 4. Exclude events the user has already been picked recently (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recent = await db
    .select({ sourceId: dailyPicks.sourceId })
    .from(dailyPicks)
    .where(
      and(eq(dailyPicks.userId, userId), gte(dailyPicks.createdAt, thirtyDaysAgo))
    );
  const recentIds = new Set(recent.map((r) => r.sourceId));
  const eligibleCandidates = candidates.filter((c) => !recentIds.has(c.id));
  const finalCandidates =
    eligibleCandidates.length > 0 ? eligibleCandidates : candidates;

  // 5. Ask Gemini to pick the best one and explain why
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const candidateList = finalCandidates
    .slice(0, 8)
    .map(
      (c, i) =>
        `${i}. "${c.name}" — ${c.start || "TBD"} — ${c.venue?.name || "TBD"} — ${c.isFree ? "FREE" : "Paid"} — ${c.category || "Uncategorized"}\n   ${c.description.slice(0, 120)}`
    )
    .join("\n");

  const userInterestNames = userInterestRows.map((i) => i.name).join(", ");

  const prompt = `You are picking one event to surprise this user with today.

User profile:
- Location: ${location}
- Interests: ${userInterestNames}
- Today we're emphasizing: ${todaysInterest.name}

Candidate events (numbered 0-${Math.min(finalCandidates.length, 8) - 1}):
${candidateList}

Pick the SINGLE best event. Consider:
- Does it match the user's interests?
- Is it accessible (not too expensive, not too far in the future)?
- Is it interesting/different/exciting?

Respond ONLY with valid JSON (no markdown):
{
  "pickedIndex": 0,
  "reason": "1-2 sentence personalized explanation in second person ('You'). Reference their interests."
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const aiResponse = parseAiJson<{
    pickedIndex: number;
    reason: string;
  }>(text);

  const picked =
    finalCandidates[aiResponse.pickedIndex] ?? finalCandidates[0];

  // 6. Persist (upsert if forced replacement)
  const [inserted] = await db
    .insert(dailyPicks)
    .values({
      userId,
      pickDate: today,
      sourceProvider: "eventbrite",
      sourceId: picked.id,
      eventSnapshot: picked,
      reason: aiResponse.reason,
    })
    .onConflictDoUpdate({
      target: [dailyPicks.userId, dailyPicks.pickDate],
      set: {
        sourceId: picked.id,
        sourceProvider: "eventbrite",
        eventSnapshot: picked,
        reason: aiResponse.reason,
        seenAt: null,
        dismissedAt: null,
      },
    })
    .returning();

  return {
    id: inserted.id,
    pickDate: inserted.pickDate,
    reason: inserted.reason,
    event: inserted.eventSnapshot as NormalizedEvent,
    seenAt: inserted.seenAt,
    dismissedAt: inserted.dismissedAt,
  };
}

export async function markPickSeen(pickId: string, userId: string) {
  await db
    .update(dailyPicks)
    .set({ seenAt: new Date() })
    .where(and(eq(dailyPicks.id, pickId), eq(dailyPicks.userId, userId)));
}

export async function dismissPick(pickId: string, userId: string) {
  await db
    .update(dailyPicks)
    .set({ dismissedAt: new Date() })
    .where(and(eq(dailyPicks.id, pickId), eq(dailyPicks.userId, userId)));
}

export async function listRecentPicks(userId: string, limit = 7) {
  return db
    .select()
    .from(dailyPicks)
    .where(eq(dailyPicks.userId, userId))
    .orderBy(desc(dailyPicks.pickDate))
    .limit(limit);
}
