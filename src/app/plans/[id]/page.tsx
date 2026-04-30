import { auth } from "@/lib/auth";
import { getPlanWithEvents } from "@/lib/plans";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MakeCurrentButton } from "./MakeCurrentButton";
import { PlanDescriptionForm } from "./PlanDescriptionForm";

export const dynamic = "force-dynamic";

function formatEventDate(input: string): string {
  if (!input) return "";
  const d = new Date(input);
  if (isNaN(d.getTime())) return input;
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

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

        <PlanDescriptionForm
          planId={plan.id}
          initialDescription={plan.description || ""}
        />
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
            <div key={e.id}>
              <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col sm:flex-row">
                  {e.imageUrl ? (
                    <div className="sm:w-48 aspect-[4/3] sm:aspect-auto overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={e.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="sm:w-48 aspect-[4/3] sm:aspect-auto bg-gradient-to-br from-muted to-accent/30 flex items-center justify-center shrink-0">
                      <Calendar className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      {e.startAt && (
                        <span className="text-sm text-muted-foreground">
                          {formatEventDate(e.startAt.toISOString())}
                        </span>
                      )}
                      {e.isFree && (
                        <Badge variant="secondary" className="ml-auto">
                          FREE
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-display text-xl">{e.name}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {e.venueName && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span>
                            {e.venueName}
                            {e.venueAddress ? `, ${e.venueAddress}` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={e.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Event Page
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Travel time indicator between events */}
              {index < events.length - 1 && (
                <div className="flex items-center justify-center py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                    <ArrowRight className="w-4 h-4" />
                    <span>Travel between</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
