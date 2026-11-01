import { NextResponse } from "next/server";
import Stripe from "stripe";
import { checkRateLimit, getClientIp, getTrustedOrigin } from "@/lib/security";

export async function POST(req: Request) {
  try {
    // 1. Rate limit Stripe Connect onboarding requests
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`stripe-connect:${clientIp}`, 10, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many onboarding attempts. Please wait a minute." },
        { status: 429 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Stripe Connect is not configured on this server." },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const uid = typeof body.uid === "string" ? body.uid.trim() : "";

    if (!uid || !/^[a-zA-Z0-9_-]{4,128}$/.test(uid)) {
      return NextResponse.json({ error: "Valid User ID is required." }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const trustedOrigin = getTrustedOrigin(req);

    // 2. Create a Stripe Express Account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        firebaseUid: uid,
      },
    });

    // 3. Create an Account Link for onboarding using trusted origin
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${trustedOrigin}/dashboard`,
      return_url: `${trustedOrigin}/api/stripe/callback?account_id=${encodeURIComponent(account.id)}&uid=${encodeURIComponent(uid)}`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      account_id: account.id,
    });
  } catch (error: any) {
    console.error("Stripe Connect error:", error);
    return NextResponse.json(
      { error: "Unable to create Stripe Connect onboarding link." },
      { status: 500 }
    );
  }
}
