import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        {/* Tagline */}
        <div className="space-y-3">
          <h1 className="font-display text-5xl tracking-tight">
            Bored?
          </h1>
          <p className="text-xl text-muted-foreground">
            Let AI find your next adventure.
          </p>
        </div>

        {/* Sign-in card */}
        <div className="bg-card rounded-3xl border border-border p-8 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h2 className="font-display text-2xl">Welcome</h2>
            <p className="text-sm text-muted-foreground">
              Sign in to get personalized picks and save your event plans
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/onboarding" });
            }}
          >
            <Button type="submit" size="lg" className="w-full" variant="outline">
              <svg className="w-5 h-5" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </form>

          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our terms of service.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="space-y-2">
            <div className="text-3xl">✨</div>
            <p className="text-xs text-muted-foreground leading-tight">
              Daily curated picks
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl">🗺️</div>
            <p className="text-xs text-muted-foreground leading-tight">
              AI route planning
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl">🎯</div>
            <p className="text-xs text-muted-foreground leading-tight">
              Personalized for you
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
