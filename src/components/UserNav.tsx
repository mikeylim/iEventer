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
            <FileText className="mr-2 h-4 w-4" />
            My Plans
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/onboarding" className="cursor-pointer">
            <UserIcon className="mr-2 h-4 w-4" />
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
          <button
            type="submit"
            className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
