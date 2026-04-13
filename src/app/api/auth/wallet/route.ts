import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { setupUserWallet, locusErrorToResponse } from "@/lib/wallet-setup";

/**
 * Recovery endpoint for users orphaned by a failed initial signup
 * (e.g. Locus 429'd while their Firebase Auth account was already created).
 * Idempotent — calling it again on a healthy user is a no-op.
 */
export async function POST(request: NextRequest) {
  let decoded;
  try {
    decoded = await verifyAuth(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { displayName?: string; email?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }

  try {
    const result = await setupUserWallet({
      uid: decoded.uid,
      email: body.email || decoded.email || "",
      displayName: body.displayName || decoded.name || "User",
    });

    if (result.alreadyExists) {
      return NextResponse.json({
        walletAddress: result.walletAddress,
        claimUrl: result.claimUrl,
        alreadyExists: true,
      });
    }

    return NextResponse.json({
      walletAddress: result.walletAddress,
      claimUrl: result.claimUrl,
      ownerPrivateKey: result.ownerPrivateKey,
      alreadyExists: false,
    });
  } catch (error: unknown) {
    const structured = locusErrorToResponse(error);
    if (structured) {
      return NextResponse.json(structured.body, {
        status: structured.status,
        headers: structured.headers,
      });
    }
    console.error("Wallet recovery error:", error);
    const message =
      error instanceof Error ? error.message : "Wallet creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
