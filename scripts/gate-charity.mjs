/**
 * Toggle a charity's `verified` flag. Used to hide a charity from the agent
 * when it doesn't have a real Locus wallet yet.
 *
 * Usage:
 *   node scripts/gate-charity.mjs <charityId> <true|false>
 */

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const [id, verifiedStr] = process.argv.slice(2);
if (!id || !["true", "false"].includes(verifiedStr)) {
  console.error("Usage: node scripts/gate-charity.mjs <charityId> <true|false>");
  process.exit(1);
}

initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
const db = getFirestore();

const ref = db.collection("charities").doc(id);
const snap = await ref.get();
if (!snap.exists) {
  console.error(`Charity ${id} not found`);
  process.exit(1);
}

await ref.update({ verified: verifiedStr === "true" });
console.log(`${snap.data().name}: verified = ${verifiedStr}`);
process.exit(0);
