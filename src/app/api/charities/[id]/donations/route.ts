import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const snapshot = await adminDb
      .collection("donations")
      .where("charityId", "==", id)
      .where("status", "==", "CONFIRMED")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const donations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ donations });
  } catch (error: unknown) {
    console.error("Donations fetch error:", error);
    return NextResponse.json({ donations: [] });
  }
}
