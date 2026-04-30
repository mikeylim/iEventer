"use client";

import { useTransition, type ReactNode } from "react";
import { deletePlan } from "@/lib/plans";

export function DeletePlanButton({
  planId,
  planTitle,
  children,
}: {
  planId: string;
  planTitle: string;
  children: ReactNode;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${planTitle}"? This can't be undone.`)) return;
    startTransition(async () => {
      await deletePlan(planId);
    });
  }

  return (
    <span
      onClick={handleDelete}
      className={isPending ? "opacity-50 pointer-events-none" : ""}
    >
      {children}
    </span>
  );
}
