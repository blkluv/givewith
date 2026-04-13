/**
 * One-shot: transfer USDC from a user's Locus wallet to a destination.
 * Writes a `transfers` doc in Firestore for audit.
 *
 * Usage:
 *   node scripts/transfer-funds.mjs <firebase-uid> <destination-address> [amount] [type] [memo]
 *
 * If [amount] is omitted, sends the entire balance.
 * [type] defaults to "manual". Other accepted types: "refund", "charity_topup".
 */

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as crypto from "crypto";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const LOCUS_API_BASE = "https://beta-api.paywithlocus.com/api";

function decrypt(ciphertext) {
  if (!ciphertext || typeof ciphertext !== "string") {
    throw new Error("Missing ciphertext");
  }
  const parts = ciphertext.split(":");
  if (parts.length !== 3) throw new Error("Invalid ciphertext format");
  const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  let out = decipher.update(parts[2], "hex", "utf8");
  out += decipher.final("utf8");
  return out;
}

async function locusRequest(path, { method = "GET", apiKey, body }) {
  const res = await fetch(`${LOCUS_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(
      `Locus ${path} failed: ${res.status} ${JSON.stringify(json)}`,
    );
  }
  return json.data;
}

async function main() {
  const [uid, destination, amountArg, typeArg, memoArg] = process.argv.slice(2);
  if (!uid || !destination) {
    console.error(
      "Usage: node scripts/transfer-funds.mjs <firebase-uid> <destination-address> [amount] [type] [memo]",
    );
    process.exit(1);
  }

  const type = typeArg || "manual";
  const memo = memoArg || `Manual transfer (script)`;

  initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  const db = getFirestore();

  console.log(`\n→ Loading user doc users/${uid}…`);
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) throw new Error(`No user doc for uid ${uid}`);

  const user = snap.data();
  console.log(`  email:   ${user.email}`);
  console.log(`  wallet:  ${user.locusWalletAddress}`);
  console.log(`  dest:    ${destination}`);
  console.log(`  type:    ${type}`);

  const apiKey = decrypt(user.locusApiKey);

  console.log("\n→ Checking balance…");
  const balance = await locusRequest("/pay/balance", { apiKey });
  const usdc = parseFloat(balance.usdc_balance);
  console.log(`  USDC balance: ${usdc.toFixed(6)}`);

  const amount = amountArg ? parseFloat(amountArg) : usdc;

  if (amount <= 0) {
    console.log("\nNothing to send. Exiting.");
    process.exit(0);
  }
  if (amount > usdc) {
    throw new Error(`Requested ${amount} but wallet only has ${usdc}`);
  }

  console.log(`\n→ Sending ${amount.toFixed(6)} USDC to ${destination}…`);
  const payResult = await locusRequest("/pay/send", {
    method: "POST",
    apiKey,
    body: {
      to_address: destination,
      amount,
      memo,
    },
  });

  console.log("\n✓ Send dispatched:");
  console.log(`  transaction_id: ${payResult.transaction_id}`);
  console.log(`  queue_job_id:   ${payResult.queue_job_id}`);
  console.log(`  status:         ${payResult.status}`);
  if (payResult.approval_url) {
    console.log(`  approval_url:   ${payResult.approval_url}`);
  }

  console.log("\n→ Writing transfers/ audit log…");
  const transferRef = await db.collection("transfers").add({
    type,
    fromUid: uid,
    fromAddress: user.locusWalletAddress,
    toAddress: destination,
    amount,
    transactionId: payResult.transaction_id,
    queueJobId: payResult.queue_job_id || null,
    txHash: null,
    status: payResult.status,
    approvalUrl: payResult.approval_url || null,
    memo,
    initiator: "script:transfer-funds",
    createdAt: new Date().toISOString(),
  });
  console.log(`  transfers/${transferRef.id}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("\n✗ Transfer failed:", err.message);
  process.exit(1);
});
