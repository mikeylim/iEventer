"use client";

import { useTransition } from "react";
import { deletePlan } from "@/lib/plans";

export function DeletePlanButton({
  planId,
  planTitle,
}: {
  planId: string;
  planTitle: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${planTitle}"? This can't be undone.`)) return;
    startTransition(async () => {
      await deletePlan(planId);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs text-red-400 hover:text-red-600 cursor-pointer whitespace-nowrap"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
