import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth";
import { getBalance } from "@/lib/locus";
import { decrypt } from "@/lib/encrypt";

export async function GET(request: NextRequest) {
  let decoded;
  try {
    decoded = await verifyAuth(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userDoc = await adminDb
      .collection("users")
      .doc(decoded.uid)
      .get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const apiKey = decrypt(userDoc.data()!.locusApiKey);
    const balance = await getBalance(apiKey);

    return NextResponse.json({
      balance: balance.balance,
      token: balance.token,
      walletAddress: balance.wallet_address,
    });
  } catch (error: unknown) {
    console.error("Balance error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch balance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
