import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth";
import { decrypt } from "@/lib/encrypt";
import { getTransactions } from "@/lib/locus";

/**
 * Reconcile stale Firestore donation statuses against Locus's live tx state.
 * Direct /pay/send donations don't emit webhooks (only checkout does), so
 * donations written as QUEUED need a client-triggered refresh once the tx
 * settles on-chain. Safe to call on every page load.
 */
export async function POST(req: NextRequest) {
  let decoded;
  try {
    decoded = await verifyAuth(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
  if (!userSnap.exists) {
    return NextResponse.json({ updated: 0 });
  }

  let apiKey: string;
  try {
    apiKey = decrypt(userSnap.data()!.locusApiKey);
  } catch {
    return NextResponse.json({ error: "Decrypt failed" }, { status: 500 });
  }

  // Pull the user's recent Locus txs and index by id. The listing endpoint
  // uses `id` (not `transaction_id` like /pay/send's response).
  const txs = await getTransactions(apiKey, { limit: 50 });
  const byId = new Map(txs.map((t) => [t.id, t]));

  // Scan Firestore donations that might be stale
  const donationsSnap = await adminDb
    .collection("donations")
    .where("donorId", "==", decoded.uid)
    .get();

  const updates: Promise<unknown>[] = [];
  let updated = 0;
  for (const doc of donationsSnap.docs) {
    const d = doc.data();
    const tx = byId.get(d.transactionId);
    if (!tx) continue;
    const statusChanged = tx.status && tx.status !== d.status;
    const hashChanged = tx.tx_hash && tx.tx_hash !== d.txHash;
    if (!statusChanged && !hashChanged) continue;
    updates.push(
      doc.ref.update({
        ...(statusChanged && { status: tx.status }),
        ...(hashChanged && { txHash: tx.tx_hash }),
        reconciledAt: new Date().toISOString(),
      }),
    );
    updated++;
  }
  await Promise.all(updates);

  return NextResponse.json({ updated });
}
