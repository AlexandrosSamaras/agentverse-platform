# Security Policy & Architecture — AgentVerse

Because **AgentVerse** manages autonomous AI agents, provider payouts, and enterprise client workflows, security is enforced across every layer of the stack.

## 1. HTTP & Transport Hardening (`src/middleware.ts`)
- **Content Security Policy (CSP)**: Restricts script, frame, font, style, and connect origins to trusted domains (`self`, Firebase, Google APIs, and Stripe).
- **CSRF Origin Verification**: State-changing API requests (`POST`, `PUT`, `PATCH`, `DELETE` under `/api/*`) validate that the `Origin` header matches the `Host` header.
- **Anti-Clickjacking & MIME Sniffing**: Enforces `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` (HSTS), and `Permissions-Policy`.

## 2. Payment & Stripe Connect Integrity (`src/app/api/checkout/route.ts`)
- **Server-Side Price Resolution**: Client requests cannot dictate agent prices. Checkout amounts are resolved exclusively on the server from the authoritative agent record (`resolveServerSideAgentPrice`).
- **Trusted Origin Redirects**: Stripe Checkout and Stripe Connect callbacks validate redirect origins via `getTrustedOrigin()` and enforce strict regex validation on `acct_*` and UID parameters to prevent Open Redirect attacks.
- **Sliding-Window Rate Limiting**: Protects `/api/checkout`, `/api/stripe/connect`, and `/api/seed` against automated abuse.

## 3. Input Sanitization & Safe External Links (`src/lib/security.ts`)
- **Plain-Text Sanitization**: All user-submitted fields (agent listings, job requests, reviews, proposals, and inquiries) are stripped of `<script>` tags, inline HTML, and control characters before persistence.
- **Protocol Whitelisting**: External links (`documentationLink`, `benchmarkingResultsLink`, `caseStudies.link`) are verified via `isSafeHttpUrl()` to allow only `https:` and `http:` schemes, blocking `javascript:` and `data:` URIs.

## 4. Firestore Security Rules (`firestore.rules`)
- Enforces document ownership on `users/{userId}` and `agents/{agentId}`.
- Validates field lengths, rating bounds (`1..5`), and required fields at the database layer.
