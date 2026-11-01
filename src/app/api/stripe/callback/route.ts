import { NextResponse } from "next/server";
import { getTrustedOrigin } from "@/lib/security";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("account_id")?.trim() || "";
  const uid = searchParams.get("uid")?.trim() || "";

  const trustedOrigin = getTrustedOrigin(req);

  // Strict validation of Stripe account ID format and Firebase UID format
  const isValidStripeAccount = /^acct_[a-zA-Z0-9]{8,64}$/.test(accountId);
  const isValidUid = /^[a-zA-Z0-9_-]{4,128}$/.test(uid);

  if (!isValidStripeAccount || !isValidUid) {
    return NextResponse.redirect(new URL("/dashboard?error=invalid_params", trustedOrigin));
  }

  return NextResponse.redirect(
    new URL(
      `/dashboard?stripe_connect_success=true&account_id=${encodeURIComponent(accountId)}`,
      trustedOrigin
    )
  );
}
