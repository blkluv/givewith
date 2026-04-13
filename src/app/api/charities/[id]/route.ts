import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection("charities").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Charity not found" },
        { status: 404 },
      );
    }

    const data = doc.data()!;
    const { locusApiKey, ...publicData } = data;

    return NextResponse.json({
      id: doc.id,
      ...publicData,
    });
  } catch (error: unknown) {
    console.error("Charity fetch error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch charity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
