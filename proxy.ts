import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { canAccessRoute } from "@/lib/rbac";
import type { Role } from "@/lib/rbac";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  const isApiAuth = pathname.startsWith("/api/auth");
  const isLoginPage = pathname === "/login";
  const isLoggedIn = !!session;
  const role = (session?.user as any)?.role as Role | undefined;

  // Always allow NextAuth callbacks and static assets
  if (isApiAuth) return NextResponse.next();

  // Redirect logged-in users away from login page
  if (isLoginPage && isLoggedIn)
    return NextResponse.redirect(new URL("/tables", nextUrl));

  // Redirect unauthenticated users to login
  if (!isLoginPage && !isLoggedIn)
    return NextResponse.redirect(new URL("/login", nextUrl));

  // Role-based page guard — redirect unauthorized roles to /tables (their home)
  if (isLoggedIn && !isLoginPage && !canAccessRoute(role, pathname)) {
    return NextResponse.redirect(new URL("/tables", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
