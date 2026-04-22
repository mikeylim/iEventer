import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Public routes
  const publicPaths = ["/", "/auth/signin", "/api/auth"];
  const isPublic = publicPaths.some((p) => nextUrl.pathname.startsWith(p));

  // Redirect signed-in users away from signin page
  if (isLoggedIn && nextUrl.pathname.startsWith("/auth/signin")) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Protect /onboarding, /dashboard, /plans, /profile
  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
