import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { setupUserWallet, locusErrorToResponse } from "@/lib/wallet-setup";

export async function POST(request: NextRequest) {
  let decoded;
  try {
    decoded = await verifyAuth(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { displayName, email } = await request.json();

  try {
    const result = await setupUserWallet({
      uid: decoded.uid,
      email: email || decoded.email,
      displayName: displayName || decoded.name || "User",
    });

    if (result.alreadyExists) {
      return NextResponse.json({
        walletAddress: result.walletAddress,
        claimUrl: result.claimUrl,
        message: "User already registered",
      });
    }

    return NextResponse.json({
      walletAddress: result.walletAddress,
      claimUrl: result.claimUrl,
      ownerPrivateKey: result.ownerPrivateKey,
    });
  } catch (error: unknown) {
    const structured = locusErrorToResponse(error);
    if (structured) {
      return NextResponse.json(structured.body, {
        status: structured.status,
        headers: structured.headers,
      });
    }
    console.error("Registration error:", error);
    const message =
      error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
