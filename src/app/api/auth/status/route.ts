import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth";
import { getWalletStatus } from "@/lib/locus";
import { decrypt } from "@/lib/encrypt";

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyAuth(request);

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

    const userData = userDoc.data()!;

    // If already deployed, return immediately
    if (userData.walletStatus === "deployed") {
      return NextResponse.json({ status: "deployed" });
    }

    // Poll Locus for status
    const apiKey = decrypt(userData.locusApiKey);
    const status = await getWalletStatus(apiKey);

    // Update Firestore if status changed
    if (
      status.walletStatus === "deployed" &&
      userData.walletStatus !== "deployed"
    ) {
      await adminDb.collection("users").doc(decoded.uid).update({
        walletStatus: "deployed",
        locusWalletAddress:
          status.walletAddress || userData.locusWalletAddress,
      });
    }

    return NextResponse.json({ status: status.walletStatus });
  } catch (error: unknown) {
    console.error("Status check error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to check status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
