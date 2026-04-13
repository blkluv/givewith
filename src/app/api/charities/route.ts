import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cause = searchParams.get("cause");
    const region = searchParams.get("region");
    const sort = searchParams.get("sort") || "impactScore";

    let query: FirebaseFirestore.Query = adminDb.collection("charities");

    if (cause) {
      query = query.where("causes", "array-contains", cause);
    }
    if (region) {
      query = query.where("region", "==", region);
    }

    // Sort
    const sortDirection = sort === "overheadRatio" ? "asc" : "desc";
    query = query.orderBy(sort as string, sortDirection as FirebaseFirestore.OrderByDirection);

    const snapshot = await query.get();

    const charities = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Strip encrypted fields from response
      const { locusApiKey, ...publicData } = data;
      return {
        id: doc.id,
        ...publicData,
      };
    });

    return NextResponse.json({ charities });
  } catch (error: unknown) {
    console.error("Charities fetch error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch charities";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
