/**
 * One-time (idempotent) setup for the shared public demo account.
 *
 * Creates Firebase Auth user + Locus wallet + Firestore user doc + funds
 * the wallet to $3 USDC from the platform wallet. Safe to re-run:
 *  - If the auth user exists → skipped
 *  - If the wallet exists → skipped
 *  - If balance < $3 → topped up to $3
 *
 * Usage:
 *   node scripts/setup-demo-account.mjs
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import * as crypto from "crypto";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const DEMO_EMAIL = "demo@givewithlocus.demo";
const DEMO_PASSWORD = "locus-demo-public-2026";
const DEMO_DISPLAY_NAME = "Demo Explorer";
const TARGET_BALANCE = 3.0;

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
  return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${enc}`;
}

function decrypt(c) {
  const p = c.split(":");
  const k = Buffer.from(ENCRYPTION_KEY, "hex");
  const d = crypto.createDecipheriv("aes-256-gcm", k, Buffer.from(p[0], "hex"));
  d.setAuthTag(Buffer.from(p[1], "hex"));
  let o = d.update(p[2], "hex", "utf8");
  o += d.final("utf8");
  return o;
}

async function locusRequest(path, { method = "GET", apiKey, body } = {}) {
  const res = await fetch(`${LOCUS_API_BASE}${path}`, {
    method,
    headers: {
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      "Content-Type": "application/json",
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 429) throw new Error("RATE_LIMIT");
  if (!res.ok || !json.success) {
    throw new Error(`${path} failed ${res.status}: ${json.message || JSON.stringify(json)}`);
  }
  return json.data;
}

async function registerWallet(name, email) {
  return locusRequest("/register", { method: "POST", body: { name, email } });
}

async function pollForDeployedWallet(apiKey, { maxAttempts = 20, delayMs = 3000 } = {}) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const s = await locusRequest("/status", { apiKey });
      if (s.walletAddress && s.walletStatus === "deployed") {
        return { walletAddress: s.walletAddress, walletStatus: s.walletStatus };
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`Wallet did not deploy within ${(maxAttempts * delayMs) / 1000}s`);
}

initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
const auth = getAuth();
const db = getFirestore();

// ─── Step 1: Firebase Auth user ─────────────────────────────────────────────
console.log(`\n[1/4] Firebase Auth user for ${DEMO_EMAIL}`);
let authUser;
try {
  authUser = await auth.getUserByEmail(DEMO_EMAIL);
  console.log(`  ✓ already exists: uid=${authUser.uid}`);
  // Ensure state stays correct even if this script ran earlier with a bug.
  if (!authUser.emailVerified || authUser.displayName !== DEMO_DISPLAY_NAME) {
    await auth.updateUser(authUser.uid, {
      emailVerified: true,
      displayName: DEMO_DISPLAY_NAME,
    });
    console.log(`  ✎ normalized emailVerified + displayName`);
  }
} catch (err) {
  if (err.code !== "auth/user-not-found") throw err;
  authUser = await auth.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    emailVerified: true,
    displayName: DEMO_DISPLAY_NAME,
  });
  console.log(`  ✓ created: uid=${authUser.uid}`);
}

// ─── Step 2: Locus wallet + Firestore doc ──────────────────────────────────
console.log(`\n[2/4] Locus wallet + Firestore user doc`);
const userRef = db.collection("users").doc(authUser.uid);
let userDoc = await userRef.get();
let demoApiKey;
let demoWalletAddress;

if (userDoc.exists && userDoc.data().locusApiKey && userDoc.data().locusWalletAddress) {
  console.log(`  ✓ already provisioned`);
  demoApiKey = decrypt(userDoc.data().locusApiKey);
  demoWalletAddress = userDoc.data().locusWalletAddress;
  console.log(`    wallet: ${demoWalletAddress}`);
} else {
  console.log(`  … registering Locus wallet`);
  const wallet = await registerWallet(DEMO_DISPLAY_NAME, DEMO_EMAIL);
  console.log(`  ✓ registered, ownerAddress: ${wallet.ownerAddress}`);
  console.log(`  … polling /status for deployed smart wallet`);
  const { walletAddress, walletStatus } = await pollForDeployedWallet(wallet.apiKey);
  console.log(`  ✓ smart wallet: ${walletAddress}`);

  await userRef.set({
    email: DEMO_EMAIL,
    displayName: DEMO_DISPLAY_NAME,
    role: "donor",
    locusApiKey: encrypt(wallet.apiKey),
    locusOwnerPrivateKey: encrypt(wallet.ownerPrivateKey),
    locusWalletAddress: walletAddress,
    locusOwnerAddress: wallet.ownerAddress,
    locusClaimUrl: wallet.claimUrl,
    walletStatus,
    createdAt: new Date().toISOString(),
    isDemoAccount: true,
  }, { merge: true });
  console.log(`  ✓ Firestore updated`);

  demoApiKey = wallet.apiKey;
  demoWalletAddress = walletAddress;
}

// ─── Step 3: Fund to TARGET_BALANCE ────────────────────────────────────────
console.log(`\n[3/4] Wallet balance check`);
const bal = await locusRequest("/pay/balance", { apiKey: demoApiKey });
const current = parseFloat(bal.usdc_balance || "0");
console.log(`  current: $${current.toFixed(4)} USDC`);

if (current < TARGET_BALANCE) {
  const topUp = TARGET_BALANCE - current;
  console.log(`  … topping up $${topUp.toFixed(4)} from platform wallet`);
  const platformKey = process.env.LOCUS_PLATFORM_API_KEY;
  const sendRes = await locusRequest("/pay/send", {
    method: "POST",
    apiKey: platformKey,
    body: {
      to_address: demoWalletAddress,
      amount: topUp,
      memo: "Demo account top-up",
    },
  });
  await db.collection("transfers").add({
    type: "charity_topup",
    fromUid: "platform",
    fromAddress: "0x975ec457900717fd2cc1912793d3a4639931bed7",
    toAddress: demoWalletAddress,
    amount: topUp,
    transactionId: sendRes.transaction_id,
    queueJobId: sendRes.queue_job_id || null,
    txHash: null,
    status: sendRes.status,
    memo: "Demo account top-up",
    initiator: "script:setup-demo-account",
    createdAt: new Date().toISOString(),
  });
  console.log(`  ✓ sent tx ${sendRes.transaction_id}`);
} else {
  console.log(`  ✓ already at or above target`);
}

// ─── Step 4: Summary ────────────────────────────────────────────────────────
console.log(`\n[4/4] Summary`);
console.log(`  email:         ${DEMO_EMAIL}`);
console.log(`  password:      ${DEMO_PASSWORD}`);
console.log(`  uid:           ${authUser.uid}`);
console.log(`  wallet:        ${demoWalletAddress}`);
console.log(`  target bal:    $${TARGET_BALANCE.toFixed(2)}`);
console.log(`\nLogin via the "Explore with demo account" button on /login.\n`);
process.exit(0);
