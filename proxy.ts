import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/login"];
const AUTH_ROUTES = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes and API/static paths - allow access
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  // Get session token - check both dev and prod cookie names
  // In production (HTTPS), Better Auth prefixes cookies with "__Secure-"
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  if (!sessionToken) {
    // No session token - redirect to login for protected routes
    if (!AUTH_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Has session token - verify it's valid
  try {
    const response = await fetch(
      `${request.nextUrl.origin}/api/auth/get-session`,
      {
        headers: { cookie: request.headers.get("cookie") || "" },
      },
    );

    const session = response.ok ? await response.json() : null;

    if (!session?.user) {
      // Invalid session - redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Valid session - redirect authenticated users away from auth pages
    if (AUTH_ROUTES.includes(pathname)) {
      // OrgProvider will handle org routing, just go to /redirect
      return NextResponse.redirect(new URL("/redirect", request.url));
    }

    // All other routes - let OrgProvider handle org logic
    return NextResponse.next();
  } catch {
    // Session check failed - redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
