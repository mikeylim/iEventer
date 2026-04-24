import { auth } from "@/lib/auth";
import { getPlanWithEvents } from "@/lib/plans";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { MakeCurrentButton } from "./MakeCurrentButton";

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
    <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">
      <Link
        href="/plans"
        className="text-sm text-primary hover:underline mb-4 inline-block"
      >
        ← All plans
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {plan.title}
          </h1>
          <p className="text-xs text-muted mt-1">
            {events.length} event{events.length === 1 ? "" : "s"} · Updated{" "}
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(plan.updatedAt)}
          </p>
        </div>
        <MakeCurrentButton planId={plan.id} />
      </div>

      {events.length === 0 ? (
        <p className="text-center text-sm text-muted py-10">
          No events in this plan yet.
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-xl shadow-sm border border-foreground/5 p-4 flex gap-4"
            >
              {e.imageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={e.imageUrl}
                  alt=""
                  className="w-24 h-24 object-cover rounded-lg shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{e.name}</h3>
                {e.startAt && (
                  <p className="text-xs text-muted mt-0.5">
                    📅{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(e.startAt)}
                  </p>
                )}
                {e.venueName && (
                  <p className="text-xs text-muted mt-0.5 truncate">
                    📍 {e.venueName}
                    {e.venueAddress ? `, ${e.venueAddress}` : ""}
                  </p>
                )}
                {e.isFree && (
                  <span className="inline-block mt-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    FREE
                  </span>
                )}
                <div className="mt-2">
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View event page →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
