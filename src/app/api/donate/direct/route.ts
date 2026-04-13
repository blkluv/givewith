import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth";
import { sendPayment } from "@/lib/locus";
import { decrypt } from "@/lib/encrypt";

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyAuth(request);
    const { charityId, amount, memo, agentReasoning } = await request.json();

    if (!charityId || !amount) {
      return NextResponse.json(
        { error: "charityId and amount are required" },
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

    // Get charity wallet address
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

    // Send payment directly using donor's API key
    const result = await sendPayment(
      donorApiKey,
      charityData.locusWalletAddress,
      amount,
      memo || `Donation to ${charityData.name} via GiveWithLocus`,
    );

    // Record donation in Firestore
    const donationRef = await adminDb.collection("donations").add({
      donorId: decoded.uid,
      charityId,
      charityName: charityData.name,
      amount: parseFloat(amount),
      memo: memo || `Donation to ${charityData.name}`,
      txHash: null,
      transactionId: result.transaction_id,
      status: result.status === "PENDING_APPROVAL" ? "PENDING_APPROVAL" : "QUEUED",
      method: "direct",
      agentReasoning: agentReasoning || null,
      approvalUrl: result.approval_url || null,
      createdAt: new Date().toISOString(),
    });

    // Update charity funding raised
    if (result.status !== "PENDING_APPROVAL") {
      await adminDb
        .collection("charities")
        .doc(charityId)
        .update({
          fundingRaised:
            (charityData.fundingRaised || 0) + parseFloat(amount),
        });
    }

    return NextResponse.json({
      donationId: donationRef.id,
      transactionId: result.transaction_id,
      status: result.status,
      approvalUrl: result.approval_url,
    });
  } catch (error: unknown) {
    console.error("Direct donate error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to send donation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
