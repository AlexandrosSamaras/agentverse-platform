import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Global Cybersecurity Middleware for AgentVerse
 * Enforces HTTP security headers, Content Security Policy (CSP),
 * clickjacking protection, and CSRF Origin verification on state-changing API routes.
 */
export function middleware(request: NextRequest) {
  // 1. CSRF / Origin protection for state-changing API requests
  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
  ) {
    const originHeader = request.headers.get("origin");
    const hostHeader = request.headers.get("host");

    if (originHeader && hostHeader) {
      try {
        const originHost = new URL(originHeader).host;
        if (originHost !== hostHeader) {
          return NextResponse.json(
            { error: "Forbidden: Cross-origin state-changing request blocked." },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Forbidden: Malformed Origin header." },
          { status: 403 }
        );
      }
    }
  }

  const response = NextResponse.next();

  // 2. Hardened Security Headers
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://placehold.co https://*.googleusercontent.com https://*.stripe.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.firebaseapp.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com",
    "object-src 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: [
    /*
     * Apply security headers to all routes except static assets
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
