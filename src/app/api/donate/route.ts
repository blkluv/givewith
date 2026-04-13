import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/locus";
import { decrypt, encrypt } from "@/lib/encrypt";

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyAuth(request);
    const { charityId, amount, memo } = await request.json();

    if (!charityId || !amount) {
      return NextResponse.json(
        { error: "charityId and amount are required" },
        { status: 400 },
      );
    }

    // Fetch charity's encrypted API key
    const charityDoc = await adminDb
      .collection("charities")
      .doc(charityId)
      .get();

    if (!charityDoc.exists) {
      return NextResponse.json(
        { error: "Charity not found" },
        { status: 404 },
      );
    }

    const charityData = charityDoc.data()!;
    const charityApiKey = decrypt(charityData.locusApiKey);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create checkout session using CHARITY's API key
    const session = await createCheckoutSession(charityApiKey, {
      amount: String(amount),
      description: `Donation to ${charityData.name}`,
      webhookUrl: `${appUrl}/api/webhooks/locus`,
      successUrl: `${appUrl}/donate/success`,
      cancelUrl: `${appUrl}/charities/${charityId}`,
      metadata: {
        donorId: decoded.uid,
        charityId,
      },
      expiresInMinutes: 30,
    });

    // Store pending donation in Firestore
    const donationRef = await adminDb.collection("donations").add({
      donorId: decoded.uid,
      charityId,
      charityName: charityData.name,
      amount: parseFloat(amount),
      memo: memo || `Donation to ${charityData.name}`,
      status: "PENDING",
      method: "checkout",
      checkoutSessionId: session.id,
      webhookSecret: session.webhookSecret
        ? encrypt(session.webhookSecret)
        : null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      sessionId: session.id,
      donationId: donationRef.id,
    });
  } catch (error: unknown) {
    console.error("Donate error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create donation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
