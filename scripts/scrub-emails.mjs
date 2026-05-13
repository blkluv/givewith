/**
 * Replace real charity contact emails with safe demo emails so the agent's
 * recruit_charity tool can't accidentally email a real org's inbox.
 *
 * Sets each charity's contactEmail to `{slug}@blkluv.org`.
 *
 * Usage:
 *   node scripts/scrub-emails.mjs
 */

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
const db = getFirestore();

function slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const snap = await db.collection("charities").get();
console.log(`\nScrubbing emails for ${snap.size} charities…\n`);

for (const doc of snap.docs) {
  const data = doc.data();
  const demoEmail = `${slug(data.name)}@blkluv.org`;
  await doc.ref.update({
    contactEmail: demoEmail,
    originalContactEmail: data.contactEmail, // preserve for reference
  });
  console.log(`  ${data.name}: ${data.contactEmail} → ${demoEmail}`);
}

console.log("\n✓ All contact emails scrubbed to @blkluv.org\n");
process.exit(0);
