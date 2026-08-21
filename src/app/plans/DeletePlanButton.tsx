"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePlan } from "@/lib/plans";

export function DeletePlanButton({
  planId,
  planTitle,
}: {
  planId: string;
  planTitle: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleDelete() {
    if (!confirm(`Delete "${planTitle}"? This can't be undone.`)) return;
    setError("");
    startTransition(async () => {
      try {
        await deletePlan(planId);
      } catch (err) {
        console.error("Failed to delete plan:", err);
        setError(`Couldn't delete ${planTitle}. Try again.`);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
        aria-label={`Delete plan ${planTitle}`}
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" />
      </Button>
      {error && (
        <span role="alert" className="max-w-40 text-right text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
