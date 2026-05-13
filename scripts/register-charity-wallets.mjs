/**
 * Upgrade placeholder charity docs to REAL Locus wallets.
 *
 * For each charity in Firestore whose apiKey is still a "placeholder_*" string:
 *   1. POST /api/register to Locus to create a real wallet
 *   2. Encrypt the returned apiKey + ownerPrivateKey with our ENCRYPTION_KEY
 *   3. UPDATE the existing Firestore doc (same docId) with real wallet data
 *
 * Respects Locus rate limit (5 registrations / IP / hour) — if we hit 429,
 * we stop cleanly. Re-run after ~60 min for the remaining charities.
 *
 * Usage:
 *   node scripts/register-charity-wallets.mjs [--limit=N]
 *
 * --limit=N  cap how many charities to process in this run (default: 5)
 */

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as crypto from "crypto";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const LOCUS_API_BASE = "https://beta-api.paywithlocus.com/api";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || Buffer.from(ENCRYPTION_KEY, "hex").length !== 32) {
  console.error("ENCRYPTION_KEY missing or wrong length in .env.local");
  process.exit(1);
}

function encrypt(plaintext) {
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let enc = cipher.update(plaintext, "utf8", "hex");
  enc += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc}`;
}

async function registerWallet(name, email) {
  const res = await fetch(`${LOCUS_API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 429) {
    throw new Error("RATE_LIMIT");
  }
  if (!res.ok || !json.success) {
    throw new Error(
      `Register failed ${res.status}: ${json.message || JSON.stringify(json)}`,
    );
  }
  return json.data;
}

// Locus /register returns `ownerAddress` (EOA) but the on-chain smart wallet
// — the address donations should flow to — is only revealed by /status after
// deployment (~30s). Poll until deployed, or throw.
async function pollForWalletAddress(apiKey, { maxAttempts = 15, delayMs = 3000 } = {}) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${LOCUS_API_BASE}/status`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success && json.data?.walletAddress && json.data?.walletStatus === "deployed") {
      return { walletAddress: json.data.walletAddress, walletStatus: json.data.walletStatus };
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`Wallet did not deploy within ${(maxAttempts * delayMs) / 1000}s`);
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : 5;

  initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  const db = getFirestore();

  const snap = await db.collection("charities").get();
  console.log(`\nFound ${snap.size} charity docs.\n`);

  // Identify which need upgrading (apiKey still a raw placeholder_* string)
  const todo = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const key = data.locusApiKey || "";
    // Covers "placeholder", "placeholder_name", and anything else that
    // obviously isn't an encrypted triple (iv:tag:ciphertext, 3 colons apart).
    const isPlaceholder =
      typeof key === "string" &&
      (key.startsWith("placeholder") || key.split(":").length !== 3);
    if (isPlaceholder) {
      todo.push({ id: doc.id, data });
    }
  }

  console.log(`${todo.length} charities need real wallets.\n`);
  if (todo.length === 0) {
    console.log("Nothing to do. All charities have real wallets.");
    process.exit(0);
  }

  const processed = [];
  const failed = [];
  let rateLimited = false;

  const toProcess = todo.slice(0, limit);
  for (const { id, data } of toProcess) {
    console.log(`--- ${data.name} (${id}) ---`);
    // Use demo email (safe) — the charity's contactEmail in Firestore is
    // already scrubbed by scripts/scrub-emails.mjs. Never pass a real inbox.
    const registrationEmail =
      typeof data.contactEmail === "string" &&
      data.contactEmail.endsWith("@blkluv.org")
        ? data.contactEmail
        : `${id.toLowerCase()}@blkluv.org`;
    console.log(`  email: ${registrationEmail}`);
    try {
      const wallet = await registerWallet(data.name, registrationEmail);
      console.log(`  ✓ registered, ownerAddress: ${wallet.ownerAddress}`);
      console.log(`  … polling /status for deployed smart wallet…`);
      const { walletAddress, walletStatus } = await pollForWalletAddress(wallet.apiKey);
      console.log(`  ✓ smart wallet: ${walletAddress}`);

      await db.collection("charities").doc(id).update({
        locusApiKey: encrypt(wallet.apiKey),
        locusOwnerPrivateKey: encrypt(wallet.ownerPrivateKey),
        locusWalletAddress: walletAddress,
        locusOwnerAddress: wallet.ownerAddress,
        locusClaimUrl: wallet.claimUrl,
        walletStatus,
        walletId: wallet.walletId || null,
        registeredAt: new Date().toISOString(),
        verified: true, // auto-re-enable once wallet is real
      });
      console.log(`  ✓ Firestore updated`);
      processed.push({ id, name: data.name, address: walletAddress });
    } catch (err) {
      if (err.message === "RATE_LIMIT") {
        console.log(
          "  ⏸  Rate limit hit (429). Stopping this batch.",
        );
        rateLimited = true;
        break;
      }
      console.error(`  ✗ ${err.message}`);
      failed.push({ id, name: data.name, error: err.message });
    }
  }

  console.log("\n======= SUMMARY =======");
  console.log(`Registered: ${processed.length}`);
  for (const p of processed) {
    console.log(`  ${p.name} → ${p.address}`);
  }
  if (failed.length) {
    console.log(`\nFailed (non-rate-limit): ${failed.length}`);
    for (const f of failed) console.log(`  ${f.name}: ${f.error}`);
  }
  const remaining =
    todo.length - processed.length - failed.length + (rateLimited ? 0 : 0);
  if (remaining > 0 || rateLimited) {
    console.log(
      `\nRemaining: ${todo.length - processed.length - failed.length} charity(ies).`,
    );
    if (rateLimited) {
      console.log(
        "Re-run in ~60 minutes (Locus rate limit is 5 registrations / IP / hour).",
      );
    }
  }
  console.log("=======================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("\n✗ Script failed:", err);
  process.exit(1);
});
