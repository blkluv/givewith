import { adminDb } from "@/lib/firebase-admin";
import {
  registerWallet,
  pollForDeployedWallet,
  LocusApiError,
} from "@/lib/locus";
import { encrypt } from "@/lib/encrypt";

export interface CreatedWallet {
  walletAddress: string;
  ownerAddress: string;
  claimUrl: string;
  ownerPrivateKey: string;
  alreadyExists: false;
}

export interface ExistingWallet {
  walletAddress: string;
  claimUrl: string;
  alreadyExists: true;
}

export type WalletSetupResult = CreatedWallet | ExistingWallet;

/**
 * Idempotent wallet provisioning for a Firebase user.
 *
 * - If `users/{uid}` already exists with a wallet, returns it untouched.
 * - Otherwise: registers a Locus wallet, polls /status until deployed (so we
 *   store the smart wallet address, not the EOA), encrypts secrets, and
 *   writes the user doc.
 *
 * Throws {@link LocusApiError} with `statusCode === 429` on rate limit so
 * callers can surface a structured error to the client.
 */
export async function setupUserWallet(opts: {
  uid: string;
  email: string;
  displayName: string;
}): Promise<WalletSetupResult> {
  const { uid, email, displayName } = opts;

  const ref = adminDb.collection("users").doc(uid);
  const existing = await ref.get();
  if (existing.exists) {
    const data = existing.data()!;
    if (data.locusApiKey && data.locusWalletAddress) {
      return {
        walletAddress: data.locusWalletAddress,
        claimUrl: data.locusClaimUrl,
        alreadyExists: true,
      };
    }
    // Doc exists but wallet incomplete — fall through and provision.
  }

  const wallet = await registerWallet(displayName, email);
  const { walletAddress, walletStatus } = await pollForDeployedWallet(
    wallet.apiKey,
  );

  await ref.set(
    {
      email,
      displayName: displayName || "User",
      role: "donor",
      locusApiKey: encrypt(wallet.apiKey),
      locusOwnerPrivateKey: encrypt(wallet.ownerPrivateKey),
      locusWalletAddress: walletAddress,
      locusOwnerAddress: wallet.ownerAddress,
      locusClaimUrl: wallet.claimUrl,
      walletStatus,
      createdAt: new Date().toISOString(),
    },
    { merge: true },
  );

  return {
    walletAddress,
    ownerAddress: wallet.ownerAddress,
    claimUrl: wallet.claimUrl,
    ownerPrivateKey: wallet.ownerPrivateKey,
    alreadyExists: false,
  };
}

/**
 * Map a thrown error into a structured response body for the client.
 * Returns null if the error is not a recognized Locus error.
 */
export function locusErrorToResponse(
  err: unknown,
): { status: number; body: Record<string, unknown>; headers?: HeadersInit } | null {
  if (err instanceof LocusApiError && err.statusCode === 429) {
    const retryAfterSeconds = 3600; // Locus window is 1h
    return {
      status: 429,
      body: {
        error: "RATE_LIMIT",
        message:
          "Locus wallet creation is rate-limited (5 per hour per IP). Try again later — your account is saved and we'll finish setup automatically.",
        retryAfterSeconds,
      },
      headers: { "Retry-After": String(retryAfterSeconds) },
    };
  }
  return null;
}
