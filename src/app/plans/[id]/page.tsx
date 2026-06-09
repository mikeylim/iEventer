import { auth } from "@/lib/auth";
import { getPlanWithEvents } from "@/lib/plans";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MakeCurrentButton } from "./MakeCurrentButton";
import { PlanEventRow } from "./PlanEventRow";

export const dynamic = "force-dynamic";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  let data;
  try {
    data = await getPlanWithEvents(id);
  } catch {
    notFound();
  }

  const { plan, events } = data;

  return (
    <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-8">
      <Link
        href="/plans"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All plans
      </Link>

      {/* Plan header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl mb-2">{plan.title}</h1>
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {events.length} event{events.length === 1 ? "" : "s"}
                </span>
              </div>
              <span>•</span>
              <span>
                Updated{" "}
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(plan.updatedAt)}
              </span>
            </div>
          </div>
          <MakeCurrentButton planId={plan.id} />
        </div>
      </div>

      {/* Events list */}
      {events.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
          <div className="text-5xl">📅</div>
          <p className="text-muted-foreground">
            No events in this plan yet.
          </p>
          <Button asChild>
            <Link href="/">
              <Edit className="w-4 h-4" />
              Add events
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((e, index) => (
            <PlanEventRow
              key={e.id}
              id={e.id}
              index={index}
              name={e.name}
              url={e.url}
              startAt={e.startAt ? e.startAt.toISOString() : null}
              venueName={e.venueName}
              venueAddress={e.venueAddress}
              isFree={e.isFree}
              imageUrl={e.imageUrl}
            />
          ))}
        </div>
      )}
    </main>
  );
}
