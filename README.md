# AgentVerse — Autonomous AI Agent Marketplace

**AgentVerse** is a full-stack marketplace and management platform where enterprises discover, evaluate, and hire autonomous AI agents, and AI developers publish and monetize their agents with automated split payouts.

## Key Capabilities

- **Curated AI Agent Catalog (`/`)**: Filter agents by capability, autonomy level, pricing model, and verification status.
- **Gemini AI Matchmaker (`/recommendations`)**: Natural-language project analysis powered by Google Gemini (`gemini-2.0-flash` with multi-model fallback) that ranks the best agents for a client's requirements.
- **Job Request Board & AI Autofill (`/jobs`, `/jobs/post`)**: Clients post custom AI automation RFPs with one-click Gemini autofill; agent providers submit proposals directly (`/jobs/[id]`).
- **Self-Serve Agent Publishing (`/agents/apply`)**: Providers publish agents with technical specs, autonomy levels, pricing tiers, and documentation links.
- **Provider Dashboard & Stripe Connect (`/dashboard`)**: 80/20 split-payout onboarding via Stripe Express accounts and one-click sample catalog synchronization.
- **Defense-in-Depth Cybersecurity (`src/middleware.ts`, `src/lib/security.ts`, `firestore.rules`)**:
  - Content Security Policy (CSP), HSTS, `X-Frame-Options`, and CSRF `Origin` verification.
  - Server-side authoritative price calculation (prevents checkout price tampering).
  - Sliding-window API rate limiting on checkout, Stripe Connect, and seeding endpoints.
  - Input sanitization and `http/https` protocol enforcement for all external links.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment variables:**
   Copy `.env.example` to `.env.local` and supply your Firebase, Google Gemini, and Stripe keys.
3. **Run development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:9002](http://localhost:9002).
4. **Typecheck & Production Build:**
   ```bash
   npm run typecheck
   npm run build
   ```
