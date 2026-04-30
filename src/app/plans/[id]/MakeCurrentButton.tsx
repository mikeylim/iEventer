"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { touchPlan } from "./actions";

export function MakeCurrentButton({ planId }: { planId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      await touchPlan(planId);
      router.push("/");
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending} size="lg">
      <Edit className="w-4 h-4" />
      {isPending ? "Loading..." : "Edit this plan"}
    </Button>
  );
}
