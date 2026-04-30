import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { plans, planEvents } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeletePlanButton } from "./DeletePlanButton";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;

  const rows = await db
    .select({
      id: plans.id,
      title: plans.title,
      description: plans.description,
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
    <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl mb-2">My Plans</h1>
          <p className="text-muted-foreground">
            Your saved event collections and itineraries.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/">
            <Plus className="w-5 h-5" />
            New Plan
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center space-y-4">
          <div className="text-6xl">📅</div>
          <div className="space-y-2">
            <h3 className="font-display text-xl">No plans yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Start building your perfect day by adding events to a new plan.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/">
              <Plus className="w-5 h-5" />
              Find Events
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rows.map((p) => (
            <div
              key={p.id}
              className="bg-card rounded-2xl border border-border p-6 space-y-4 hover:shadow-lg transition-shadow duration-300 flex flex-col"
            >
              <div className="space-y-2 flex-1">
                <h3 className="font-display text-xl line-clamp-2">{p.title}</h3>
                {p.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {p.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-sm text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {p.eventCount} event{p.eventCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <span>•</span>
                  <span>
                    Updated{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(p.updatedAt)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border/50">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Link href={`/plans/${p.id}`}>View Details</Link>
                </Button>
                <DeletePlanButton planId={p.id} planTitle={p.title}>
                  <Button variant="ghost" size="sm" aria-label="Delete plan">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </DeletePlanButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
