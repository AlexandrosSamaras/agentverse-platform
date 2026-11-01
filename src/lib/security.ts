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

/**
 * AgentVerse Control Plane (ACP) — DLP & Guardrail Firewall
 * Scans incoming prompts for:
 *  1. Direct & indirect Prompt Injection / Jailbreak attempts
 *  2. Sensitive PII / Credentials (emails, SSNs, credit cards, API keys, phone numbers)
 *  3. High-risk state-changing operations (for Human-in-the-Loop gating)
 */
export function inspectAndRedactPrompt(
  rawPrompt: string,
  enablePiiRedaction: boolean = true
): {
  passed: boolean;
  promptInjectionDetected: boolean;
  promptInjectionReason?: string;
  piiRedactedCount: number;
  piiTypesFound: string[];
  sanitizedPrompt: string;
  highRiskActionDetected: boolean;
  detectedActions: string[];
} {
  const cleanText = sanitizePlainText(rawPrompt, 4000);

  // 1. Prompt Injection / Jailbreak heuristics
  const injectionPatterns: { regex: RegExp; reason: string }[] = [
    {
      regex: /\b(ignore|disregard|override|forget)\b.{0,40}\b(previous|prior|above|system|all)\b.{0,30}\b(instructions?|prompts?|rules?|guardrails?)\b/i,
      reason: "Attempt to override system instructions ('ignore previous instructions').",
    },
    {
      regex: /\b(reveal|print|dump|output|leak|exfiltrate)\b.{0,40}\b(system\s*prompt|secret\s*key|api\s*key|env|environment\s*variables|credentials?)\b/i,
      reason: "Attempt to exfiltrate system prompts or credentials.",
    },
    {
      regex: /\b(you\s+are\s+now\s+DAN|do\s+anything\s+now|developer\s+mode\s+enabled|jailbreak)\b/i,
      reason: "Known jailbreak persona pattern detected.",
    },
    {
      regex: /(?:https?:\/\/|curl\s+|wget\s+|fetch\s*\().{0,60}(?:attacker|evil|webhook\.site|ngrok|burpcollaborator|requestbin)/i,
      reason: "Suspicious data exfiltration endpoint detected in prompt.",
    },
  ];

  let promptInjectionDetected = false;
  let promptInjectionReason: string | undefined;

  for (const item of injectionPatterns) {
    if (item.regex.test(cleanText)) {
      promptInjectionDetected = true;
      promptInjectionReason = item.reason;
      break;
    }
  }

  // 2. DLP PII & Secret Redaction
  let sanitizedPrompt = cleanText;
  let piiRedactedCount = 0;
  const piiTypesSet = new Set<string>();

  const piiRules: { name: string; regex: RegExp; replacement: string }[] = [
    {
      name: "API_SECRET_KEY",
      regex: /\b(sk_(?:live|test)_[0-9a-zA-Z]{10,}|AIza[0-9A-Za-z\-_]{20,}|ghp_[0-9A-Za-z]{20,}|xox[baprs]-[0-9A-Za-z\-]{10,})\b/g,
      replacement: "[REDACTED_API_KEY]",
    },
    {
      name: "CREDIT_CARD",
      regex: /\b(?:\d[ -]*?){13,16}\b/g,
      replacement: "[REDACTED_PAYMENT_CARD]",
    },
    {
      name: "US_SSN",
      regex: /\b\d{3}-\d{2}-\d{4}\b/g,
      replacement: "[REDACTED_SSN]",
    },
    {
      name: "EMAIL_ADDRESS",
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
      replacement: "[REDACTED_EMAIL]",
    },
    {
      name: "PHONE_NUMBER",
      regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
      replacement: "[REDACTED_PHONE]",
    },
  ];

  for (const rule of piiRules) {
    const matches = sanitizedPrompt.match(rule.regex);
    if (matches && matches.length > 0) {
      piiTypesSet.add(rule.name);
      if (enablePiiRedaction) {
        piiRedactedCount += matches.length;
        sanitizedPrompt = sanitizedPrompt.replace(rule.regex, rule.replacement);
      }
    }
  }

  // 3. High-Risk State-Changing Action Detection (for HITL Governance)
  const highRiskRules: { label: string; regex: RegExp }[] = [
    {
      label: "financial_transfer_or_refund",
      regex: /\b(wire\s+transfer|issue\s+refund|refund\s+\$?\d+|charge\s+card|send\s+payment|payout)\b/i,
    },
    {
      label: "destructive_database_or_repo_write",
      regex: /\b(drop\s+table|delete\s+all|truncate|force\s+push|merge\s+pull\s+request|production\s+deploy|terminate\s+instance)\b/i,
    },
    {
      label: "mass_external_communication",
      regex: /\b(email\s+all\s+customers|blast\s+campaign|publish\s+to\s+production|send\s+contract)\b/i,
    },
  ];

  const detectedActions: string[] = [];
  for (const rule of highRiskRules) {
    if (rule.regex.test(cleanText)) {
      detectedActions.push(rule.label);
    }
  }

  return {
    passed: !promptInjectionDetected,
    promptInjectionDetected,
    promptInjectionReason,
    piiRedactedCount,
    piiTypesFound: Array.from(piiTypesSet),
    sanitizedPrompt,
    highRiskActionDetected: detectedActions.length > 0,
    detectedActions,
  };
}

