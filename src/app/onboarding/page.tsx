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
    <div className="flex-1 bg-gradient-to-br from-primary/5 via-white to-accent/5 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            👋 Welcome, {session.user.name?.split(" ")[0]}
          </h1>
          <p className="text-muted mt-2">
            Help us understand what excites you. Takes 30 seconds.
          </p>
        </div>

        <OnboardingForm
          interests={allInterests}
          initialLocation={profile?.location || ""}
          initialSelected={profile?.selectedSlugs || []}
        />
      </div>
    </div>
  );
}
