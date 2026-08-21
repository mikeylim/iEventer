import { auth, signIn, signOut } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { LogOut, FileText, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        <Button type="submit" size="sm">
          Sign in
        </Button>
      </form>
    );
  }

  const initial =
    session.user.name?.charAt(0)?.toUpperCase() ||
    session.user.email?.charAt(0)?.toUpperCase() ||
    "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="rounded-full p-0 h-9 w-9 hover:bg-muted"
          aria-label="Open account menu"
        >
          <Avatar className="h-9 w-9">
            {session.user.image && (
              <AvatarImage src={session.user.image} alt="" />
            )}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium truncate">
              {session.user.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/plans" className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
            My Plans
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/onboarding" className="cursor-pointer">
            <UserIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            Profile / Interests
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form
          action={async () => {
            "use server";
            await signOut({ redirect: false });
            revalidatePath("/", "layout");
            const { redirect } = await import("next/navigation");
            redirect("/");
          }}
        >
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
