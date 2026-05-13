import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth";
import { sendEmailPayment } from "@/lib/locus";
import { decrypt } from "@/lib/encrypt";

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyAuth(request);
    const { email, charityName, amount } = await request.json();

    if (!email || !charityName || !amount) {
      return NextResponse.json(
        { error: "email, charityName, and amount are required" },
        { status: 400 },
      );
    }

    // Get donor's API key
    const userDoc = await adminDb
      .collection("users")
      .doc(decoded.uid)
      .get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const donorApiKey = decrypt(userDoc.data()!.locusApiKey);

    // Send email escrow
    const result = await sendEmailPayment(
      donorApiKey,
      email,
      amount,
      `Invitation to join BLKLUV.ORG — a donor wants to support ${charityName}. Claim your funds and join.`,
    );

    return NextResponse.json({
      status: result.status,
      transactionId: result.transaction_id,
      charityName,
      email,
    });
  } catch (error: unknown) {
    console.error("Recruit error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to send invitation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
