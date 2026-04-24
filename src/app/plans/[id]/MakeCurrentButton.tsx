"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`bg-primary hover:bg-primary-light text-white font-semibold text-sm px-5 py-2 rounded-full transition-colors cursor-pointer
        ${isPending ? "opacity-70 cursor-not-allowed" : ""}`}
    >
      {isPending ? "Loading..." : "Edit this plan →"}
    </button>
  );
}
