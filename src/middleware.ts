import { type NextRequest, NextResponse } from "next/server";

// Auth.js v5 session cookie names (database strategy: cookie = raw session token).
// In development (HTTP) the cookie is unprefixed; in production (HTTPS) it is __Secure-prefixed.
const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

// Fast-path redirect for obviously unauthenticated requests.
// Prisma cannot run in the Edge runtime, so we check cookie existence here;
// server components and API routes call auth() (Node.js) for real DB-backed verification.
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/projects/:path*", "/registry", "/account/:path*"],
};
