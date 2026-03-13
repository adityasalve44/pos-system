/**
 * proxy.ts — Next.js 16 request interception layer.
 *
 * Next.js 16 renames middleware.ts → proxy.ts and the export from
 * `middleware` → `proxy`. The logic is identical.
 *
 * Uses next-auth v4's getToken() to read the JWT from the request cookie.
 * No database call is made here — JWT verification is cryptographic only.
 * All real permission checks are re-enforced inside each API route handler.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { canAccessRoute } from "@/lib/rbac";

/** Paths that never need auth checks */
const PUBLIC_PATHS = new Set(["/login"]);

function isPassthrough(pathname: string): boolean {
  return (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/seed") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  );
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  if (isPassthrough(pathname)) return NextResponse.next();

  const isPublic = PUBLIC_PATHS.has(pathname);

  // next-auth v4: getToken reads the JWT from the `next-auth.session-token` cookie
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!token;
  // token is typed as JWT (from types/next-auth.d.ts), so token.role is UserRole
  const role = token?.role;

  if (isPublic && isLoggedIn) {
    return NextResponse.redirect(new URL("/tables", request.nextUrl));
  }

  if (!isPublic && !isLoggedIn) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && !isPublic && !canAccessRoute(role, pathname)) {
    return NextResponse.redirect(new URL("/tables", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};