import { LOCUS_API_BASE } from "./constants";

// ─── Error handling ───────────────────────────────────────────────────────────

export class LocusApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
  ) {
    super(message);
    this.name = "LocusApiError";
  }
}

async function locusRequest<T>(
  path: string,
  options: {
    method?: string;
    apiKey: string;
    body?: Record<string, unknown>;
  },
): Promise<T> {
  const { method = "GET", apiKey, body } = options;
  const url = `${LOCUS_API_BASE}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new LocusApiError(
      res.status,
      json.error || "UNKNOWN_ERROR",
      json.message || `Locus API error: ${res.status}`,
    );
  }

  return json.data as T;
}

// ─── Wallet Registration ──────────────────────────────────────────────────────

export interface RegisterWalletResponse {
  apiKey: string;
  apiKeyPrefix: string;
  ownerPrivateKey: string;
  ownerAddress: string;
  walletId: string;
  walletStatus: string;
  statusUrl: string;
  claimUrl: string;
  defaults: {
    allowanceUsdc: string;
    maxAllowedTxnSizeUsdc: string;
    chain: string;
  };
}

export async function registerWallet(
  name?: string,
  email?: string,
): Promise<RegisterWalletResponse> {
  // Registration doesn't require auth — uses no apiKey
  const url = `${LOCUS_API_BASE}/register`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new LocusApiError(
      res.status,
      json.error || "REGISTRATION_FAILED",
      json.message || "Wallet registration failed",
    );
  }

  return json.data as RegisterWalletResponse;
}

// ─── Wallet Status ────────────────────────────────────────────────────────────

export interface WalletStatus {
  walletStatus: string;
  walletAddress?: string;
}

export async function getWalletStatus(
  apiKey: string,
): Promise<WalletStatus> {
  return locusRequest<WalletStatus>("/status", { apiKey });
}

// `/register` returns the EOA `ownerAddress`, but donations must settle at
// the deployed smart wallet which only appears on `/status`. Poll until
// walletStatus === "deployed" or throw.
export async function pollForDeployedWallet(
  apiKey: string,
  { maxAttempts = 15, delayMs = 3000 }: { maxAttempts?: number; delayMs?: number } = {},
): Promise<{ walletAddress: string; walletStatus: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const s = await getWalletStatus(apiKey);
      if (s.walletAddress && s.walletStatus === "deployed") {
        return { walletAddress: s.walletAddress, walletStatus: s.walletStatus };
      }
    } catch {
      // swallow and retry — /status may 4xx briefly right after /register
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(
    `Wallet did not deploy within ${(maxAttempts * delayMs) / 1000}s`,
  );
}

// ─── Balance ──────────────────────────────────────────────────────────────────

export interface BalanceRawResponse {
  wallet_address: string;
  chain: string;
  usdc_balance: string;
  allowance: string | null;
  max_transaction_size: string | null;
}

export interface BalanceResponse {
  balance: string;
  token: string;
  wallet_address: string;
}

export async function getBalance(apiKey: string): Promise<BalanceResponse> {
  const raw = await locusRequest<BalanceRawResponse>("/pay/balance", { apiKey });
  return {
    balance: raw.usdc_balance,
    token: "USDC",
    wallet_address: raw.wallet_address,
  };
}

// ─── Send Payment ─────────────────────────────────────────────────────────────

export interface SendPaymentResponse {
  transaction_id: string;
  queue_job_id: string;
  status: string;
  from_address: string;
  to_address: string;
  amount: number;
  token: string;
  approval_url?: string;
}

export async function sendPayment(
  apiKey: string,
  toAddress: string,
  amount: number,
  memo: string,
): Promise<SendPaymentResponse> {
  return locusRequest<SendPaymentResponse>("/pay/send", {
    method: "POST",
    apiKey,
    body: { to_address: toAddress, amount, memo },
  });
}

// ─── Send Email (Escrow) ──────────────────────────────────────────────────────

export interface SendEmailResponse {
  transaction_id: string;
  status: string;
}

export async function sendEmailPayment(
  apiKey: string,
  email: string,
  amount: number,
  memo: string,
  expiresInDays = 30,
): Promise<SendEmailResponse> {
  return locusRequest<SendEmailResponse>("/pay/send-email", {
    method: "POST",
    apiKey,
    body: { email, amount, memo, expires_in_days: expiresInDays },
  });
}

// ─── Transaction History ──────────────────────────────────────────────────────

// NOTE: the /pay/transactions listing uses different field names than
// /pay/send's response. Listing returns `id` + `amount_usdc`; the send
// response returns `transaction_id` + `amount`. To correlate a send with its
// listing entry, match `tx.id === sendResult.transaction_id`.
export interface Transaction {
  id: string;
  status: string;
  amount_usdc: string;
  memo?: string;
  to_address: string;
  to_ens_name?: string | null;
  recipient_email?: string | null;
  tx_hash?: string | null;
  category: string;
  created_at: string;
}

interface TransactionsListResponse {
  transactions: Transaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export async function getTransactions(
  apiKey: string,
  params?: { limit?: number; offset?: number; status?: string },
): Promise<Transaction[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  // Locus returns { transactions, pagination } under `data` — unwrap to the
  // array so callers get a flat list.
  const res = await locusRequest<TransactionsListResponse>(
    `/pay/transactions${qs ? `?${qs}` : ""}`,
    { apiKey },
  );
  return res.transactions;
}

// ─── Checkout Sessions ────────────────────────────────────────────────────────

export interface CreateCheckoutSessionParams {
  amount: string;
  description?: string;
  webhookUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
  expiresInMinutes?: number;
}

export interface CheckoutSession {
  id: string;
  checkoutUrl: string;
  amount: string;
  currency: string;
  status: string;
  expiresAt: string;
  webhookSecret?: string;
}

export async function createCheckoutSession(
  apiKey: string,
  params: CreateCheckoutSessionParams,
): Promise<CheckoutSession> {
  return locusRequest<CheckoutSession>("/checkout/sessions", {
    method: "POST",
    apiKey,
    body: params as unknown as Record<string, unknown>,
  });
}

export async function getCheckoutSession(
  apiKey: string,
  sessionId: string,
): Promise<CheckoutSession> {
  return locusRequest<CheckoutSession>(`/checkout/sessions/${sessionId}`, {
    apiKey,
  });
}

// ─── Wrapped APIs ─────────────────────────────────────────────────────────────
//
// NOTE: `callWrappedGemini` was removed when the chat engine was swapped to
// Thesys C1 (Claude Sonnet 4). Brave and Firecrawl stay as agent tools.
//

// Brave Web Search
export interface BraveSearchResult {
  web?: {
    results: Array<{
      title: string;
      url: string;
      description: string;
    }>;
  };
}

export async function callWrappedBrave(
  apiKey: string,
  query: string,
  count = 5,
): Promise<BraveSearchResult> {
  return locusRequest<BraveSearchResult>("/wrapped/brave/web-search", {
    method: "POST",
    apiKey,
    body: { q: query, count },
  });
}

// Firecrawl Scrape
export interface FirecrawlScrapeResult {
  markdown?: string;
  metadata?: {
    title?: string;
    description?: string;
  };
}

export async function callWrappedFirecrawl(
  apiKey: string,
  url: string,
): Promise<FirecrawlScrapeResult> {
  // Locus wraps Firecrawl's own {success, data} envelope inside its own
  // {success, data} envelope, so the real payload lives at data.data.
  const wrapped = await locusRequest<{ success: boolean; data: FirecrawlScrapeResult }>(
    "/wrapped/firecrawl/scrape",
    {
      method: "POST",
      apiKey,
      body: { url, formats: ["markdown"] },
    },
  );
  return wrapped.data;
}
