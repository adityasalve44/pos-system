import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { canAccessRoute } from "@/lib/rbac";

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

  // In production (HTTPS), next-auth stores the session in a cookie named
  // __Secure-next-auth.session-token. In development it uses the unprefixed
  // next-auth.session-token. Passing `secureCookie` explicitly ensures
  // getToken() reads the right cookie in both environments — without this,
  // getToken() returns null in production and the proxy redirect-loops.
  const secureCookie = process.env.NODE_ENV === "production";

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie,
  });

  const isLoggedIn = !!token;
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