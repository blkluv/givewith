import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as crypto from "crypto";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
const db = getFirestore();

function decrypt(ciphertext) {
  if (!ciphertext || typeof ciphertext !== "string") return "(missing)";
  const parts = ciphertext.split(":");
  if (parts.length !== 3) return `(unencrypted: ${ciphertext.slice(0, 30)}...)`;
  try {
    const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    const iv = Buffer.from(parts[0], "hex");
    const tag = Buffer.from(parts[1], "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    let out = decipher.update(parts[2], "hex", "utf8");
    out += decipher.final("utf8");
    return out;
  } catch (e) {
    return `(decrypt error: ${e.message})`;
  }
}

const snap = await db.collection("charities").get();
console.log(`\nFound ${snap.size} charities:\n`);
for (const doc of snap.docs) {
  const d = doc.data();
  const apiKey = decrypt(d.locusApiKey);
  const isPlaceholder = apiKey.startsWith("placeholder_");
  const status = isPlaceholder ? "❌ PLACEHOLDER" : "✅ REAL";
  console.log(`${status}  ${d.name}`);
  console.log(`    apiKey: ${apiKey.slice(0, 40)}`);
  console.log(`    address: ${d.locusWalletAddress}`);
  console.log();
}
process.exit(0);
