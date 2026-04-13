import { signInWithEmailAndPassword, type Auth } from "firebase/auth";

/**
 * Public demo account — shared across all visitors so they can explore the
 * app without going through signup. Credentials are NOT secret; the account
 * is intentionally public-read/write and funded with a small USDC balance.
 *
 * Provisioning lives in `scripts/setup-demo-account.mjs` (idempotent).
 */
export const DEMO_EMAIL = "demo@givewithlocus.demo";
export const DEMO_PASSWORD = "locus-demo-public-2026";

export function isDemoEmail(email: string | null | undefined) {
  return email === DEMO_EMAIL;
}

export async function signInAsDemo(auth: Auth) {
  return signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
}
