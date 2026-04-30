"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updatePlanDescription } from "./actions";

export function PlanDescriptionForm({
  planId,
  initialDescription,
}: {
  planId: string;
  initialDescription: string;
}) {
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(initialDescription);
  const [draft, setDraft] = useState(initialDescription);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        await updatePlanDescription(planId, draft);
        setDescription(draft);
        setEditing(false);
      } catch (err) {
        console.error("Failed to save description:", err);
      }
    });
  }

  function handleCancel() {
    setDraft(description);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a description for this plan (optional)..."
          rows={2}
          className="resize-none"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isPending}
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isPending}
          >
            <Check className="w-4 h-4" />
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  if (!description) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setEditing(true)}
        className="text-muted-foreground"
      >
        <Pencil className="w-4 h-4" />
        Add a description
      </Button>
    );
  }

  return (
    <div className="group relative">
      <p className="text-muted-foreground pr-10">{description}</p>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-muted"
        aria-label="Edit description"
      >
        <Pencil className="w-4 h-4" />
      </button>
    </div>
  );
}
