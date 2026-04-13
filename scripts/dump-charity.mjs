import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
const db = getFirestore();

const snap = await db.collection("charities").get();
for (const doc of snap.docs) {
  const d = doc.data();
  console.log(`\n${d.name} (${doc.id})`);
  console.log(`  locusApiKey type: ${typeof d.locusApiKey}`);
  console.log(`  locusApiKey raw (first 80):  ${String(d.locusApiKey).slice(0, 80)}`);
  console.log(`  locusApiKey colons: ${String(d.locusApiKey).split(":").length - 1}`);
  console.log(`  locusWalletAddress: ${d.locusWalletAddress}`);
  console.log(`  registeredAt: ${d.registeredAt || "(none)"}`);
  console.log(`  walletStatus: ${d.walletStatus || "(none)"}`);
}
process.exit(0);
