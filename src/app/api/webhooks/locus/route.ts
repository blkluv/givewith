import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { decrypt } from "@/lib/encrypt";
import crypto from "crypto";

function verifySignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("X-Signature-256");
    const event = request.headers.get("X-Webhook-Event");
    const sessionId = request.headers.get("X-Session-Id");

    if (!signature || !event || !sessionId) {
      return NextResponse.json(
        { error: "Missing webhook headers" },
        { status: 400 },
      );
    }

    // Find donation by checkout session ID
    const snapshot = await adminDb
      .collection("donations")
      .where("checkoutSessionId", "==", sessionId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.error(`No donation found for session ${sessionId}`);
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 },
      );
    }

    const donationDoc = snapshot.docs[0];
    const donationData = donationDoc.data();

    // Verify HMAC signature
    if (donationData.webhookSecret) {
      const secret = decrypt(donationData.webhookSecret);
      if (!verifySignature(rawBody, signature, secret)) {
        console.error("Webhook signature verification failed");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
    }

    const payload = JSON.parse(rawBody);

    if (event === "checkout.session.paid") {
      const { paymentTxHash, paidAt, amount } = payload.data;

      // Update donation status
      await adminDb.collection("donations").doc(donationDoc.id).update({
        status: "CONFIRMED",
        txHash: paymentTxHash || null,
        paidAt: paidAt || new Date().toISOString(),
      });

      // Increment charity funding
      const charityId = donationData.charityId;
      if (charityId) {
        const charityDoc = await adminDb
          .collection("charities")
          .doc(charityId)
          .get();
        if (charityDoc.exists) {
          const currentRaised = charityDoc.data()?.fundingRaised || 0;
          await adminDb
            .collection("charities")
            .doc(charityId)
            .update({
              fundingRaised: currentRaised + parseFloat(amount || donationData.amount),
            });
        }
      }
    } else if (event === "checkout.session.expired") {
      await adminDb.collection("donations").doc(donationDoc.id).update({
        status: "EXPIRED",
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
