/**
 * Backfill / repair charity Locus wallet addresses.
 *
 * Problem: earlier versions of register-charity-wallets.mjs stored
 * `ownerAddress` (EOA) as `locusWalletAddress`. Donations should settle at
 * the deployed smart wallet (visible only via /status), not the EOA. Also,
 * two charity API keys (HKI + AMF) started returning 403 "Agent wallet is
 * unavailable" and can't be queried or sent from anymore.
 *
 * For each charity:
 *   - GET /status with stored apiKey.
 *   - 200 + deployed: if walletAddress != locusWalletAddress, update it.
 *     Preserve the old value under `previousOwnerAddress`.
 *   - 403 (unavailable) or other hard failure: re-register the wallet (new
 *     apiKey + new smart wallet), poll /status until deployed, then update
 *     the Firestore doc in place. Preserve the prior ownerAddress.
 *
 * Usage:
 *   node scripts/backfill-wallet-addresses.mjs            # dry-run
 *   node scripts/backfill-wallet-addresses.mjs --apply    # apply changes
 *
 * Notes:
 *   - Respects Locus rate limit (5 registrations/IP/hour). Stops on 429.
 *   - Re-registration creates a NEW smart wallet — any USDC stuck at the
 *     OLD ownerAddress (EOA) is NOT swept here (would require raw web3).
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as crypto from "crypto";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const LOCUS_API_BASE = "https://beta-api.paywithlocus.com/api";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const APPLY = process.argv.includes("--apply");

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

function decrypt(ciphertext) {
  const p = ciphertext.split(":");
  const k = Buffer.from(ENCRYPTION_KEY, "hex");
  const d = crypto.createDecipheriv("aes-256-gcm", k, Buffer.from(p[0], "hex"));
  d.setAuthTag(Buffer.from(p[1], "hex"));
  let o = d.update(p[2], "hex", "utf8");
  o += d.final("utf8");
  return o;
}

async function getStatus(apiKey) {
  const r = await fetch(`${LOCUS_API_BASE}/status`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, ok: r.ok && j.success, data: j.data, message: j.message };
}

async function register(name, email) {
  const r = await fetch(`${LOCUS_API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 429) throw new Error("RATE_LIMIT");
  if (!r.ok || !j.success) {
    throw new Error(`Register failed ${r.status}: ${j.message || JSON.stringify(j)}`);
  }
  return j.data;
}

async function pollForDeployed(apiKey, { maxAttempts = 20, delayMs = 3000 } = {}) {
  for (let i = 0; i < maxAttempts; i++) {
    const s = await getStatus(apiKey);
    if (s.ok && s.data?.walletAddress && s.data?.walletStatus === "deployed") {
      return { walletAddress: s.data.walletAddress, walletStatus: s.data.walletStatus };
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`Wallet did not deploy within ${(maxAttempts * delayMs) / 1000}s`);
}

initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
const db = getFirestore();

console.log(`\n${APPLY ? "=== APPLY MODE ===" : "=== DRY RUN (pass --apply to commit) ==="}\n`);

const snap = await db.collection("charities").get();
const report = [];
let rateLimited = false;

for (const doc of snap.docs) {
  if (rateLimited) {
    report.push({ name: doc.data().name, action: "SKIPPED_RATE_LIMIT" });
    continue;
  }
  const d = doc.data();
  const id = doc.id;
  console.log(`\n→ ${d.name} (${id})`);
  console.log(`  stored locusWalletAddress: ${d.locusWalletAddress}`);

  let apiKey;
  try {
    apiKey = decrypt(d.locusApiKey);
  } catch (e) {
    console.log(`  ✗ cannot decrypt apiKey: ${e.message}`);
    report.push({ name: d.name, action: "CANNOT_DECRYPT" });
    continue;
  }

  const s = await getStatus(apiKey);
  console.log(`  /status → HTTP ${s.status}`, s.ok ? `walletAddress=${s.data.walletAddress} status=${s.data.walletStatus}` : `(${s.message})`);

  if (s.ok && s.data?.walletAddress) {
    const real = s.data.walletAddress;
    if (real.toLowerCase() === (d.locusWalletAddress || "").toLowerCase()) {
      console.log(`  ✓ already correct`);
      report.push({ name: d.name, action: "OK", address: real });
      continue;
    }
    console.log(`  ⚠ mismatched — will update: ${d.locusWalletAddress} → ${real}`);
    if (APPLY) {
      await db.collection("charities").doc(id).update({
        locusWalletAddress: real,
        locusOwnerAddress: d.locusWalletAddress, // preserve old EOA
        walletStatus: s.data.walletStatus,
        walletAddressBackfilledAt: new Date().toISOString(),
      });
      console.log(`  ✓ updated`);
    }
    report.push({
      name: d.name,
      action: "BACKFILLED",
      old: d.locusWalletAddress,
      new: real,
    });
    continue;
  }

  // /status failed — need to re-register
  console.log(`  ✗ /status failed — will RE-REGISTER (creates new wallet)`);
  if (!APPLY) {
    report.push({ name: d.name, action: "WOULD_REREGISTER" });
    continue;
  }

  const email =
    typeof d.contactEmail === "string" && d.contactEmail.endsWith("@blkluv.org")
      ? d.contactEmail
      : `${id.toLowerCase()}@blkluv.org`;

  try {
    const newWallet = await register(d.name, email);
    console.log(`  ✓ re-registered, ownerAddress: ${newWallet.ownerAddress}`);
    console.log(`  … polling /status for deployed smart wallet…`);
    const { walletAddress, walletStatus } = await pollForDeployed(newWallet.apiKey);
    console.log(`  ✓ smart wallet: ${walletAddress}`);

    await db.collection("charities").doc(id).update({
      locusApiKey: encrypt(newWallet.apiKey),
      locusOwnerPrivateKey: encrypt(newWallet.ownerPrivateKey),
      locusWalletAddress: walletAddress,
      locusOwnerAddress: newWallet.ownerAddress,
      previousOwnerAddress: d.locusWalletAddress, // for reference / manual recovery
      locusClaimUrl: newWallet.claimUrl,
      walletStatus,
      walletId: newWallet.walletId || null,
      registeredAt: new Date().toISOString(),
      reRegisteredAt: new Date().toISOString(),
      verified: true,
    });
    console.log(`  ✓ Firestore updated`);
    report.push({
      name: d.name,
      action: "RE_REGISTERED",
      old: d.locusWalletAddress,
      new: walletAddress,
    });
  } catch (err) {
    if (err.message === "RATE_LIMIT") {
      console.log(`  ⏸ RATE LIMIT hit — stopping further re-registrations`);
      rateLimited = true;
      report.push({ name: d.name, action: "RATE_LIMIT" });
      continue;
    }
    console.log(`  ✗ re-register failed: ${err.message}`);
    report.push({ name: d.name, action: "ERROR", error: err.message });
  }
}

console.log("\n\n======= SUMMARY =======");
for (const r of report) {
  const tail = r.address ? ` [${r.address}]` : r.old && r.new ? ` [${r.old} → ${r.new}]` : r.error ? ` (${r.error})` : "";
  console.log(`  ${r.action.padEnd(18)} ${r.name}${tail}`);
}
console.log("=======================");
if (!APPLY) console.log("\nDry-run only. Re-run with --apply to commit changes.");
process.exit(0);
