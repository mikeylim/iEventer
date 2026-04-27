import { auth, signIn, signOut } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export async function UserNav() {
  const session = await auth();

  if (!session?.user) {
    return (
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/onboarding" });
        }}
      >
        <button
          type="submit"
          className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors cursor-pointer"
        >
          Sign in
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/plans"
        className="text-white/90 hover:text-white text-sm font-semibold transition-colors"
      >
        📋 My Plans
      </Link>
      <Link
        href="/onboarding"
        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold px-3 py-1.5 rounded-full transition-colors"
      >
        {session.user.image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={session.user.image}
            alt=""
            className="w-6 h-6 rounded-full"
          />
        )}
        <span className="hidden sm:inline">
          {session.user.name?.split(" ")[0]}
        </span>
      </Link>
      <form
        action={async () => {
          "use server";
          await signOut({ redirect: false });
          revalidatePath("/", "layout");
          // Hard redirect so client state (plan, etc.) is fully reset
          const { redirect } = await import("next/navigation");
          redirect("/");
        }}
      >
        <button
          type="submit"
          className="text-white/70 hover:text-white text-xs transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
