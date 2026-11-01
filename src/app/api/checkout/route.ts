import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { mockAgents } from "@/data/mock";
import {
  checkRateLimit,
  getClientIp,
  getTrustedOrigin,
  resolveServerSideAgentPrice,
  sanitizePlainText,
} from "@/lib/security";

export async function POST(req: Request) {
  try {
    // 1. Rate Limit check (max 15 checkout attempts per minute per IP)
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`checkout:${clientIp}`, 15, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many checkout requests. Please wait before trying again." },
        { status: 429 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Payment service is currently unavailable." },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawAgentId = typeof body.agentId === "string" ? body.agentId.trim() : "";
    const requestedTierName =
      typeof body.tierName === "string" ? sanitizePlainText(body.tierName, 80) : undefined;

    if (!rawAgentId || !/^[a-zA-Z0-9_-]{1,128}$/.test(rawAgentId)) {
      return NextResponse.json({ error: "Invalid agent identifier." }, { status: 400 });
    }

    // 2. Fetch the Agent from Firestore or fallback to mockAgents
    let agentData: Record<string, any> | undefined;
    try {
      const agentRef = doc(db, "agents", rawAgentId);
      const agentSnap = await getDoc(agentRef);
      if (agentSnap.exists()) {
        agentData = agentSnap.data();
      }
    } catch (err) {
      console.warn("Firestore lookup failed in checkout, checking mockAgents:", err);
    }

    if (!agentData) {
      agentData = mockAgents.find((a) => a.id === rawAgentId);
    }

    if (!agentData) {
      return NextResponse.json({ error: "Agent not found." }, { status: 404 });
    }

    const developerId = agentData.developerId;
    let connectedAccountId: string | null = null;

    // 3. Fetch the Developer (User) to get their stripeAccountId if present
    if (developerId && typeof developerId === "string") {
      try {
        const userRef = doc(db, "users", developerId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const candidateId = userSnap.data().stripeAccountId;
          if (typeof candidateId === "string" && /^acct_[a-zA-Z0-9]+$/.test(candidateId)) {
            connectedAccountId = candidateId;
          }
        }
      } catch (err) {
        console.warn("Could not fetch developer user doc:", err);
      }
    }

    // 4. Compute authoritative price on the server (prevents client-side price tampering)
    const authoritativePriceUsd = resolveServerSideAgentPrice(agentData, requestedTierName);
    const amountInCents = Math.round(authoritativePriceUsd * 100);
    const applicationFeeAmount = Math.round(amountInCents * 0.2); // 20% Platform Fee

    const trustedOrigin = getTrustedOrigin(req);
    const stripe = new Stripe(stripeSecretKey);

    // 5. Create Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Hire Agent: ${sanitizePlainText(String(agentData.name || "AI Agent"), 120)}`,
              metadata: {
                agentId: rawAgentId,
              },
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${trustedOrigin}/agents/${encodeURIComponent(rawAgentId)}?success=true`,
      cancel_url: `${trustedOrigin}/agents/${encodeURIComponent(rawAgentId)}?canceled=true`,
    };

    // 6. Add Transfer Data if we have a verified connected account
    if (connectedAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: connectedAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Unable to initiate checkout session. Please try again later." },
      { status: 500 }
    );
  }
}
