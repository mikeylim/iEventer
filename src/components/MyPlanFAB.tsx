"use client";

import { ClipboardList } from "lucide-react";

/**
 * Floating action button — shows when the user's plan has events.
 * Click smooth-scrolls to the #my-plan section so the plan stays
 * accessible no matter how far down the user has scrolled.
 */
export function MyPlanFAB({ eventCount }: { eventCount: number }) {
  if (eventCount === 0) return null;

  function handleClick() {
    const target = document.getElementById("my-plan");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground rounded-full pl-4 pr-5 py-3 shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer animate-fade-in"
      aria-label={`Open My Plan, ${eventCount} event${eventCount === 1 ? "" : "s"}`}
    >
      <ClipboardList className="w-5 h-5" />
      <span className="font-medium text-sm">
        My Plan · {eventCount}
      </span>
    </button>
  );
}
