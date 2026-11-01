/**
 * Cybersecurity & Input Sanitization Utilities for AgentVerse
 * Protects against XSS, open-redirect, prototype pollution, and API abuse.
 */

// Simple in-memory sliding-window rate limiter per IP + route key
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 25,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetInSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown-ip";
}

/**
 * Validates and returns a safe base URL for redirects (prevents Open Redirect via forged Origin header).
 */
export function getTrustedOrigin(req: Request): string {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredAppUrl) {
    try {
      return new URL(configuredAppUrl).origin;
    } catch {
      // Fallback below
    }
  }

  try {
    const reqUrl = new URL(req.url);
    return reqUrl.origin;
  } catch {
    return "http://localhost:9002";
  }
}

/**
 * Validates external URLs (e.g. documentationLink, benchmarkingResultsLink, caseStudies.link)
 * to ensure they use only http:// or https:// protocols and block javascript:/data:/vbscript: URIs.
 */
export function isSafeHttpUrl(rawUrl?: string | null): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Strips dangerous HTML/script tags and control characters from user-supplied text.
 */
export function sanitizePlainText(input: string, maxLength: number = 2000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Extracts a numeric USD price from an Agent's price tier string on the server side
 * so clients cannot tamper with checkout prices.
 */
export function resolveServerSideAgentPrice(
  agentData: Record<string, any>,
  requestedTierName?: string
): number {
  const DEFAULT_PRICE_USD = 100;
  const MIN_PRICE_USD = 5;
  const MAX_PRICE_USD = 50_000;

  if (!Array.isArray(agentData.priceTiers) || agentData.priceTiers.length === 0) {
    return DEFAULT_PRICE_USD;
  }

  const tier =
    (requestedTierName &&
      agentData.priceTiers.find((t: any) => t?.name === requestedTierName)) ||
    agentData.priceTiers[0];

  if (!tier || typeof tier.price !== "string") {
    return DEFAULT_PRICE_USD;
  }

  const match = tier.price.replace(/,/g, "").match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  if (!match) {
    return DEFAULT_PRICE_USD;
  }

  const parsed = parseFloat(match[1]);
  if (Number.isNaN(parsed) || parsed < MIN_PRICE_USD) {
    return DEFAULT_PRICE_USD;
  }

  return Math.min(parsed, MAX_PRICE_USD);
}
