import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { plans, planEvents } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { DeletePlanButton } from "./DeletePlanButton";

export default async function PlansPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;

  // Fetch all plans with event counts in one query
  const rows = await db
    .select({
      id: plans.id,
      title: plans.title,
      createdAt: plans.createdAt,
      updatedAt: plans.updatedAt,
      shareSlug: plans.shareSlug,
      eventCount: sql<number>`count(${planEvents.id})::int`,
    })
    .from(plans)
    .leftJoin(planEvents, eq(planEvents.planId, plans.id))
    .where(eq(plans.userId, userId))
    .groupBy(plans.id)
    .orderBy(desc(plans.updatedAt));

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">📋 My Plans</h1>
          <p className="text-sm text-muted mt-1">
            Your saved event plans and itineraries.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-semibold text-primary hover:text-primary-light"
        >
          + Start New Plan
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-foreground/5 p-10 text-center">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="font-semibold">No plans yet</p>
          <p className="text-sm text-muted mt-1 mb-5">
            Head to the home page and add some events to get started.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary text-white font-semibold text-sm px-5 py-2 rounded-full hover:bg-primary-light transition-colors"
          >
            Find Events →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl shadow-sm border border-foreground/5 hover:shadow-md transition-shadow p-4 flex items-center justify-between gap-4"
            >
              <Link href={`/plans/${p.id}`} className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{p.title}</h3>
                <p className="text-xs text-muted mt-0.5">
                  {p.eventCount} event{p.eventCount === 1 ? "" : "s"} ·{" "}
                  Updated{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(p.updatedAt)}
                </p>
              </Link>
              <DeletePlanButton planId={p.id} planTitle={p.title} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
