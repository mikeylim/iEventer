import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentProfile, getInterests } from "./actions";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const [allInterests, profile] = await Promise.all([
    getInterests(),
    getCurrentProfile(),
  ]);

  return (
    <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div className="mb-8 space-y-2">
        <h1 className="font-display text-4xl">
          👋 Welcome, {session.user.name?.split(" ")[0]}
        </h1>
        <p className="text-lg text-muted-foreground">
          Let&apos;s personalize your experience.
        </p>
      </div>

      <OnboardingForm
        interests={allInterests}
        initialLocation={profile?.location || ""}
        initialSelected={profile?.selectedSlugs || []}
      />
    </main>
  );
}
