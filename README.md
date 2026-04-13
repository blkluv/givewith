<div align="center">

# GiveWithLocus

**AI-powered charitable giving with on-chain transparency, built on Locus.**

[![Built on Locus](https://img.shields.io/badge/Built%20on-Locus-d7ff4b?style=flat-square&labelColor=0f0f10)](https://paywithlocus.com)
[![Base mainnet](https://img.shields.io/badge/Network-Base%20mainnet-0052ff?style=flat-square)](https://base.org)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat-square)](https://nextjs.org)
[![Firebase App Hosting](https://img.shields.io/badge/Hosting-Firebase%20App%20Hosting-ffa000?style=flat-square)](https://firebase.google.com/docs/app-hosting)
[![Paygentic Hackathon 2026](https://img.shields.io/badge/Paygentic-Hackathon%202026-d7ff4b?style=flat-square&labelColor=0f0f10)](https://paywithlocus.com)

### → [givewithlocus.web.app](https://givewithlocus.web.app)

Click **"Explore with demo account"** on the login page, or use:
`demo@givewithlocus.demo` / `locus-demo-public-2026`

</div>

> Donors chat with a generative-UI agent that finds verified high-impact charities, evaluates them with live web search, and executes real USDC donations on Base mainnet — every dollar traceable on-chain. Submitted to the **Paygentic Hackathon 2026** by team **@Athena19**.

---

### Contents

1. [Built on Locus — integration depth](#1-built-on-locus--integration-depth)
2. [Agent architecture](#2-agent-architecture)
3. [Data model (Firestore)](#3-data-model-firestore)
4. [Security](#4-security)
5. [Tech stack](#5-tech-stack)
6. [Local development](#6-local-development)
7. [Deployment — Firebase App Hosting](#7-deployment--firebase-app-hosting)
8. [What we built](#8-what-we-built)
9. [Known constraints](#9-known-constraints)
10. [Where this could go](#10-where-this-could-go)
11. [Monetization strategy](#11-monetization-strategy)

---

## 1. Built on Locus — integration depth

GiveWithLocus uses **6 distinct Locus endpoints** to power the entire donor-to-charity flow. No Locus surface is a cosmetic wrapper; each is load-bearing.

| # | Capability | Locus endpoint | Where it lives | Cost |
|---|---|---|---|---|
| 1 | **Wallet provisioning** for donors + charities | `POST /api/register` + poll `GET /api/status` | `src/lib/locus.ts` (`registerWallet`, `pollForDeployedWallet`) | Free (rate-limit 5/IP/hr) |
| 2 | **Direct USDC transfers** for agent-executed donations | `POST /api/pay/send` | `src/lib/agent/tools.ts` (`executeDonation`) | Free (gas sponsored) |
| 3 | **Email escrow** for inviting off-platform charities | `POST /api/pay/send-email` | `src/lib/agent/tools.ts` (`recruitCharity`) | Free |
| 4 | **Embedded checkout** for conventional donations | `POST /api/checkout/sessions` + `@withlocus/checkout-react` | `src/app/api/donate/route.ts` + `src/components/donation/checkout-wrapper.tsx` | Free |
| 5 | **Web search** via Brave (agent evaluates off-DB charities) | `POST /api/wrapped/brave/web-search` | `src/lib/agent/tools.ts` (`searchWeb`) | **$0.035/call** |
| 6 | **Website scraping** via Firecrawl (agent reads mission pages) | `POST /api/wrapped/firecrawl/scrape` | `src/lib/agent/tools.ts` (`scrapeCharityWebsite`) | **$0.003/call** |

All Locus calls go through a single typed client at `src/lib/locus.ts` with uniform error handling (`LocusApiError`) and a canonical request wrapper that enforces `Bearer` auth headers, JSON bodies, and envelope unwrapping.

### Wallet provisioning — full lifecycle

`POST /api/register` returns an `ownerAddress` (EOA) and an `apiKey`, but **the on-chain smart wallet doesn't exist yet** — it deploys asynchronously (~30 s). We learned this the hard way: storing `ownerAddress` as the deposit address means donations settle at an EOA the Locus API can't see, and the charity's Locus wallet forever reports `$0` balance.

Our flow in `src/lib/wallet-setup.ts`:

```
POST /api/register          → { apiKey, ownerPrivateKey, ownerAddress, claimUrl }
GET  /api/status   (poll)   → { walletStatus: "deployed", walletAddress }  ← keep polling up to 45s
  ↓
AES-256-GCM encrypt apiKey + ownerPrivateKey
write users/{uid} with:
  locusWalletAddress  = walletAddress    (smart wallet — where donations go)
  locusOwnerAddress   = ownerAddress     (EOA — for reference)
  locusClaimUrl       = claimUrl         (surfaced in user menu as "Open wallet on Locus")
```

The registration is idempotent (`setupUserWallet()` short-circuits if the user doc already has a wallet), and the Firestore write uses `{ merge: true }` so orphaned-signup recovery is clean.

### Direct USDC transfers — agent path with status reconciliation

The agent tool `executeDonation(charityId, amount, memo, reasoning)` does:

1. Looks up the charity's smart-wallet address from Firestore.
2. Calls `POST /api/pay/send` from the donor's wallet.
3. Writes `donations/{id}` with initial `status: "QUEUED"`.
4. **Polls `GET /api/pay/transactions` for up to 3 s**, so by the time the agent replies the donation is usually already `CONFIRMED` with a real `txHash` on Base.
5. Bumps `charities/{id}.fundingRaised`.

Because `/api/pay/send` does not emit webhooks (only `/checkout/sessions` does), we also ship a background reconciler at `POST /api/donations/reconcile`. The donations page and dashboard both call it on mount — any stale `QUEUED` doc gets patched against live Locus state before the user sees it.

### Email escrow — charity recruitment flywheel

The agent can invite a charity it finds via web search by calling `recruitCharity(email, charityName, amount)` → `POST /api/pay/send-email`. Locus locks the USDC in escrow and sends the charity a claim link. If they claim it, they get a Locus wallet; we then onboard them to GiveWithLocus. If the escrow expires, funds return to the donor automatically.

This closes a growth loop: **donors bring charities, charities bring donors.** All via real USDC, all auditable.

### Embedded checkout — conventional path

For users who prefer a classic checkout over the chat flow, the donation page (`/donate/[charityId]`) renders `<LocusCheckout mode="embedded">` from `@withlocus/checkout-react` against a session created with the **charity's own API key** (decrypted server-side in `/api/donate`). A webhook at `POST /api/webhooks/locus` verifies the HMAC-SHA256 signature with the session's stored `webhookSecret` using `timingSafeEqual`, then flips the donation to `CONFIRMED` and bumps the charity's `fundingRaised`.

### Brave + Firecrawl — paid wrapped APIs

When the agent can't find a match in our verified DB (`searchCharityDb` → empty result), it calls Brave for discovery and Firecrawl for mission-page reading. These are **pay-per-use**; spend is capped per request by Thesys's `stepCountIs(6)` tool-loop limit.

A subtle gotcha worth noting: Locus wraps the Firecrawl response in its own `{ success, data }` envelope *on top of* Firecrawl's own envelope, so `locusRequest` returns `{ success, data: {...} }` and we have to drill one level deeper. We discovered this by watching the agent silently return empty scrape content until we inspected the raw response. See `callWrappedFirecrawl` in `src/lib/locus.ts`.

---

## 2. Agent architecture

The chat agent is a **Vercel AI SDK `streamText`** loop pointed at **Thesys C1 (`c1/google/gemini-3-flash/v-20251230`)** for generative UI, with 6 tools exposed to the LLM. Responses render as interactive Crayon components via `<C1Component>`.

```
         ┌──── user message ────────────────────┐
         │                                       │
         ▼                                       │
  ┌────────────────────┐       ┌──────────────── │ ────────────┐
  │ /api/chat (server) │──────▶│ Thesys C1 →     │ Gemini 3     │
  │ verifyAuth +       │ tools │ generative UI + tool-call      │
  │ buildAgentTools    │◀──────│                                │
  └────────────────────┘       └───────────────────────────────┘
         │                            │
         │ stepCountIs(6) cap         │ up to 6 tool turns per user message
         ▼                            │
  ┌────────────────────┐              │
  │ Firestore +        │◀─────────────┘
  │ Locus Beta API     │
  └────────────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │ toUIMessageStreamResponse()       │
  │ → C1Component renders rich UI     │
  └──────────────────────────────────┘
```

- **System prompt** (`src/lib/agent/system-prompt.ts`) enforces the `CONFIRMED_DONATION` / `CONFIRMED_RECRUITMENT` protocol so a click on "Confirm donation" passes full context in `action.llmFriendlyMessage` back to the next LLM turn instead of requiring re-prompting.
- **External links** (`View Website`, `View on BaseScan`) are intercepted client-side: if the button carries `params.url` or `OPEN_URL <https-url>`, we `window.open` instead of firing a chat turn. Prevents the agent hallucinating "you've just viewed the site."
- **Hard refusals** — the system prompt explicitly forbids rendering a transfer form for arbitrary wallet addresses. `executeDonation` only accepts `charityId` (Firestore doc IDs); any P2P-to-address request is refused with a clear card offering the real paths.

---

## 3. Data model (Firestore)

All collections are governed by `firestore.rules` — all writes are server-side-only, reads are scoped to the owning user (except `charities/` which is public-read).

```
users/{uid}
  ├── email, displayName, role
  ├── locusApiKey, locusOwnerPrivateKey   (AES-256-GCM encrypted)
  ├── locusWalletAddress                   (smart wallet — donations target)
  ├── locusOwnerAddress                    (EOA, reference)
  ├── locusClaimUrl                        (user-facing Locus dashboard link)
  ├── walletStatus                         ("deployed")
  ├── isDemoAccount?: true                 (only on the public demo user)
  └── createdAt

charities/{charityId}
  ├── name, mission, causes[], region
  ├── overheadRatio, impactScore
  ├── fundingGoal, fundingRaised
  ├── website, contactEmail
  ├── locusApiKey, locusOwnerPrivateKey   (encrypted)
  ├── locusWalletAddress, locusOwnerAddress
  ├── locusClaimUrl, walletStatus, walletId
  ├── verified                             (gated — false while placeholder)
  └── createdAt

donations/{donationId}
  ├── donorId, charityId, charityName
  ├── amount, memo
  ├── transactionId, txHash
  ├── status  (QUEUED | PENDING_APPROVAL | CONFIRMED | FAILED | EXPIRED)
  ├── method  ("direct" — agent-executed · "checkout" — embedded UI)
  ├── agentReasoning?                      (for direct donations)
  ├── reconciledAt?                        (set by /api/donations/reconcile)
  ├── webhookSecret?                       (encrypted, checkout method only)
  └── createdAt

transfers/{transferId}                     ← admin-op audit log
  ├── type ("manual" | "refund" | "charity_topup")
  ├── fromUid, fromAddress, toAddress, amount
  ├── transactionId, queueJobId, txHash, status
  └── initiator
```

---

## 4. Security

- **Encryption at rest:** `locusApiKey` and `locusOwnerPrivateKey` are AES-256-GCM encrypted with `ENCRYPTION_KEY` (32-byte hex from env). Format `iv:authTag:ciphertext`. See `src/lib/encrypt.ts`.
- **Firestore security rules** (`firestore.rules`): all writes rejected for clients; reads scoped to the authed UID. `charities/` is public-read only; `donations/` are readable only by their donor.
- **Server-side-only secrets:** `LOCUS_PLATFORM_API_KEY`, `ENCRYPTION_KEY`, `THESYS_API_KEY` never ship to the client bundle. Validated via `NEXT_PUBLIC_*` naming.
- **Rate-limit recovery:** the Firebase Auth account is created before the Locus wallet. If Locus 429s on wallet creation, the user is shown a `<WalletSetupCard />` and can finish provisioning once the limit clears — no orphaned-account dead ends.
- **Account linking safety:** we call `sendEmailVerification` immediately after password signup so Firebase doesn't silently replace the password credential when a user later signs in with Google using the same email (a documented Firebase footgun).
- **Production secrets:** `apphosting.yaml` references 6 Google Secret Manager entries, not inline values. The App Hosting compute SA is the only principal granted `roles/secretmanager.secretAccessor`.

---

## 5. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** App Router + Turbopack | `params` / `cookies()` / `headers()` are async |
| UI | **shadcn/ui on Base UI** + Tailwind CSS 4 | No `asChild` — Base UI uses `render={}` |
| Typography | **Geist Sans + Instrument Serif** | Serif reserved for display moments |
| Motion | **Framer Motion** | Ease-out cubic `[0.22, 1, 0.36, 1]`, max 400ms |
| Forms | **React Hook Form** + Zod schemas | Zod pinned at 3.25 for Crayon peer dep |
| Auth | **Firebase Auth** | Email+password + Google (currently hidden) + shared demo |
| DB | **Firestore** (us-central1) | Composite indexes in `firestore.indexes.json` |
| AI agent | **Thesys C1** (`c1/google/gemini-3-flash/v-20251230`) via **Vercel AI SDK** | Stable tier, fast, cheap for UI gen |
| Payments | **Locus Beta API** + `@withlocus/checkout-react` | USDC on Base mainnet |
| Hosting | **Firebase App Hosting** | `apphosting.yaml` + Secret Manager |

---

## 6. Local development

### Prerequisites

- Node 20+
- A Firebase project with Auth + Firestore (Blaze plan required for App Hosting)
- Locus Beta API key (from `https://beta.paywithlocus.com`)
- Thesys API key (from `https://console.thesys.dev`)

### Setup

```bash
# 1. Install
npm install

# 2. Env
cp .env.example .env.local
# Fill in: Firebase config (6 vars), LOCUS_PLATFORM_API_KEY,
# ENCRYPTION_KEY (32-byte hex), THESYS_API_KEY, NEXT_PUBLIC_APP_URL

# 3. ADC for Firebase Admin (Firestore writes)
gcloud auth application-default login --project <your-firebase-project>

# 4. Register charity Locus wallets (uses Locus rate limit 5/hr/IP)
node scripts/register-charity-wallets.mjs

# 5. (Optional) Create the shared demo account — idempotent, funds to $3
node scripts/setup-demo-account.mjs

# 6. Run
npm run dev
```

Generate a secure `ENCRYPTION_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Key scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server (Turbopack) on `:3000` |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `node scripts/check-charity.mjs` | Audit all charity wallet state |
| `node scripts/register-charity-wallets.mjs [--limit=N]` | Upgrade placeholder charities → real wallets |
| `node scripts/backfill-wallet-addresses.mjs [--apply]` | Repair mis-stored wallet addresses; re-register 403'd wallets |
| `node scripts/setup-demo-account.mjs` | Idempotent demo-account top-up to $3 |
| `node scripts/scrub-emails.mjs` | Replace real charity emails with `@givewithlocus.demo` |
| `node scripts/transfer-funds.mjs <uid> <toAddr> [amount]` | Admin transfer with `transfers/` audit |

---

## 7. Deployment

Deployed on **Firebase App Hosting** (`us-central1`), fronted by **Firebase Hosting** for the clean `givewithlocus.web.app` URL (it rewrites every path to the App Hosting Cloud Run service). Config lives in `apphosting.yaml` (runtime + env declarations) and `firebase.json` (Firestore rules, App Hosting target, Hosting rewrite). Server-only secrets (`LOCUS_PLATFORM_API_KEY`, `ENCRYPTION_KEY`, `THESYS_API_KEY`) are stored in Google Secret Manager and referenced by name — the compute service account holds `roles/secretmanager.secretAccessor` on each.

---

## 8. What we built

A snapshot of what's wired up end-to-end in this submission:

- **Six load-bearing Locus integrations** — wallet provisioning, direct payments, email escrow, embedded checkout, Brave web search, Firecrawl scraping. Plus the `@withlocus/checkout-react` SDK on the donation flow. None of them are decorative; the agent uses each in concrete user paths.
- **A generative-UI giving agent** that interprets natural-language intent, calls real tools, renders interactive cards via Thesys C1, and only executes payments after explicit on-screen confirmation.
- **Real on-chain donations** — every confirmed donation produces a Base transaction hash that the donor can verify on BaseScan, written into a Firestore `donations/` doc with the agent's reasoning attached.
- **A growth loop in code, not slides** — the `recruitCharity` tool lets the agent invite charities it discovers via web search, sending them USDC via `/api/pay/send-email` escrow with a claim link.
- **Production-grade auth + recovery** — email verification on signup (so a later Google sign-in can't silently replace the password), demo-account mode for trial visitors, an orphan-recovery card if Locus rate-limits during signup.
- **Operational thoughtfulness** — admin scripts for charity wallet provisioning, address backfill, demo top-up, status reconciliation between Firestore and Locus's tx history, plus an audit-log collection (`transfers/`) for every admin-initiated USDC move.

---

## 9. Known constraints

Limitations that come from the Locus integration surface specifically:

- **Wallet-creation rate limit** — `POST /api/register` is capped at 5 calls per IP per hour. The signup flow handles this via `<WalletSetupCard />`: if Locus 429s, the user's Firebase account stays valid and they can complete wallet setup once the limit clears, no orphaned-account dead end.
- **`/api/pay/send` doesn't emit webhooks** — only `/checkout/sessions` does. Direct (agent-executed) donations land in Firestore as `QUEUED` and are reconciled to `CONFIRMED` either by the in-tool short-poll (3s, 3 attempts) or by `POST /api/donations/reconcile` on the next dashboard/donations-page mount.
- **Demo wallet is shared real USDC** — by design. The `demo@givewithlocus.demo` account is one Locus wallet shared across every visitor who clicks "Explore with demo account." Donations from it are real on-chain USDC transfers; if the wallet drains, run `node scripts/setup-demo-account.mjs` to top it back up.

---

## 10. Where this could go

What we shipped is the donor side of a much bigger flywheel. Each direction below leans further into Locus's payment + agent rails:

### Self-serve charity onboarding

Right now, charities are seeded by an admin script. The next step is a **public charity signup flow** that mirrors the donor flow:

- Charity rep lands on `/charities/apply` → fills mission, region, causes → uploads proof (501(c)(3) letter, registration docs).
- A **verification agent** (Brave + Firecrawl on the application URL + cross-checks against IRS/Charity Navigator data) auto-scores the application and either approves, requests more info, or routes to manual review.
- On approval: provision a Locus wallet via `POST /api/register` (same path the donor flow uses), encrypt + store keys, mark `verified: true`.
- The whole flow takes minutes, not weeks.

### Charity dashboard + agentic outreach

A first-class **charity-side dashboard** with:

- Donation feed (already in `donations/`) + donor cohort analytics
- Withdrawal flows (charity → bank/stablecoin off-ramp via Locus checkout)
- Per-campaign smart wallets (dedicate a Locus wallet per fundraising drive — built-in transparency)
- An **outreach agent** that uses Locus pay-per-use APIs to:
  - Find lapsed donors (Firestore + AI segmentation)
  - Draft personalized re-engagement emails based on donation history
  - Send via `POST /api/pay/send-email` so the email itself carries a $0.50 thank-you that converts to "claim and keep giving"
  - Use `/api/wrapped/brave/web-search` to surface news mentions of the charity → trigger campaign moments

### CSR budget management

Most corporate giving doesn't flow through employee matches — it flows through a CSR / sustainability office writing direct grants. The existing tooling there is spreadsheets + manual ACH + chasing nonprofits for receipts at year-end. Locus's primitives map almost directly to that workflow:

- **CSR budget = a dedicated Locus wallet** with sub-allowances per cause area and per quarter (`$50K climate / $30K education / $20K emergency response`). The same allowance + max-tx caps that protect individual donors scale up unchanged to govern an org-level budget — no new infra required.
- **Agent-assisted strategic allocation** — CSR officer says *"distribute this quarter's climate budget across the top 5 climate charities by impact score in regions where we operate"* → our agent runs `searchCharityDb` + `searchWeb` + drafts an `executeDonation` plan. The officer reviews and confirms; no spreadsheets.
- **The ESG / SASB / GRI annual report becomes a BaseScan query**, not a six-month Excel reconciliation. Every dollar from corporate treasury → charity wallet is queryable on Base in seconds.
- **Public real-time CSR ledger** — companies can publish their live giving dashboard from their sustainability page. Replaces the glossy annual PDF with continuous transparency, which is a meaningful trust differentiator for brands competing on values.
- **Optional: employee match programs** — for companies that already run them. Encode the rule (`match employee donations 1:1 up to $500/employee/year`) on the corporate wallet and let it fire automatically when a verified employee donates. No claim forms. Smaller slice of CSR spend than direct grants, but a nice complement.

### Government + civic

Public-sector spending on social programs is opaque by default. On-chain rails fix that:

- **Grant disbursements** — agencies route subsidies through Locus wallets so beneficiaries (and the public) can verify funds actually arrived.
- **Multi-sig approvals** — large transfers require multiple signers, enforced on-chain via Locus governance primitives instead of email approval chains.
- **Public audit dashboards** — every grant becomes a BaseScan-linkable receipt; auditors get continuous monitoring instead of annual sampling.

### Other directions

- **Recurring giving** — subscription-style donations using Locus's allowance + scheduled-transaction patterns (donor sets a monthly cap, the agent executes within it).
- **Multi-charity portfolios** — donor picks a cause area, the agent allocates across the top N verified charities by impact score and rebalances quarterly. DAO-style preferences without the DAO complexity.
- **Donor reputation** — every confirmed donation is a verifiable on-chain attestation. Build a portable "giving identity" donors can carry across platforms.
- **Conditional / programmable giving** — "donate $100 to climate charities if global CO2 hits Y" or "match my friend's donation up to $X" — straightforward to encode now that the donate path is a single tool call.
- **Multi-currency + cross-chain** — start with USDC on Base (today); extend to other Locus-supported assets and chains as they become available.
- **Tax-receipt automation** — every donation already has the metadata needed for a tax letter; pipe through a templating service and email it on confirmation.

The throughline: **Locus's primitives — wallets, sponsored gas, escrow, sub-allowances, pay-per-use APIs — are already the right shape** for civic-scale financial infrastructure. We're using them for giving, but the same surface area generalizes to grants, payroll, beneficiary disbursement, programmable budgets, and any flow where transparency and agent-driven automation matter.

---

## 11. Monetization strategy

Charity platforms have to be careful about extracting value — the perception of "platform skimming the donation" can be brand-fatal. Our model is **donor-free, charity-neutral, enterprise-funded**: the bulk of revenue comes from the actors with the largest budgets and the most to gain from the platform (CSR teams, large foundations), not from the people clicking "donate $5."

Five revenue streams, layered:

1. **Optional donor tip at checkout** — *zero-friction baseline.* The donate flow includes a one-click "add 5% to support GiveWithLocus" toggle (default off, presented neutrally). Same model GoFundMe and DAFs use; converts at ~10–20% in their data. Pure goodwill, scales with platform volume, no impact on the charity's take.

2. **Charity Pro tier** — *aligned with charity success.* Free for any verified charity to list and accept donations. Charities that want **operational tooling** subscribe ($X/month):
   - Cohort analytics + retention dashboards
   - Outreach agent quota (the AI re-engagement campaigns described in §10)
   - Per-campaign smart wallets with their own donation feeds
   - Automated tax-receipt generation
   - Custom branded donation page
   
   Free tier covers the long tail of small nonprofits; mid-to-large charities self-select into paid because the analytics and outreach pay for themselves.

3. **CSR Enterprise** — *the high-margin core.* Annual subscription for corporates ($X–$X0K/yr, tiered by budget volume) covering everything in §10's CSR section: budget wallet + sub-allowances, allocation agent, ESG/SASB report exports, public CSR ledger, audit trail. Comparable to existing ESG reporting SaaS (Workiva, Sphera) but with the on-chain audit trail as the differentiator they can't replicate.

4. **Donor-Advised Fund (DAF) custody** — *capital-efficient compounding.* Let donors deposit USDC into a "giving fund" they distribute over time (the agent helps them allocate). Charge a small AUM fee (~0.5%/year) like Fidelity Charitable's 0.6%. With on-chain transparency we should price below traditional DAFs, not above.

5. **Verification-as-a-service** — *platform-as-infrastructure.* Our charity verification pipeline (Brave + Firecrawl + cross-checks against IRS / Charity Navigator) is reusable. License it as an API to other giving platforms, payroll-deduction tools, employee-giving portals — anyone who needs trustworthy charity data without building it themselves. Per-call or seat-based pricing.

**Why this composition works:**

- **Donor-side stays free** — the trust angle that makes the platform credible in the first place stays intact. We don't compete with the donation itself.
- **Small charities pay nothing** — preserves the long-tail discoverability that powers the agent's value (more verified charities = better recommendations = better donor experience = more donations = ...).
- **Revenue concentrates on payers who can pay** — CSR teams already budget for ESG / sustainability reporting software (mid-market quotes for Workiva, Sphera, Persefoni, Watershed and similar typically land in five-to-six figures annually), so we sit in a familiar budget line, not a new one. DAF custody is a benchmarked market — Fidelity Charitable, Schwab Charitable, and Vanguard Charitable all charge ~0.60% on accounts under $500K, with community foundations often at 1.0%. With on-chain transparency we can credibly price below those incumbents.
- **Marginal cost per dollar moved is near zero** — Locus's gas-sponsored wallet model means each new donor or each new $1 of volume costs us essentially nothing to process. Pure operating leverage.
- **Expansion doesn't require new product surface** — the verification API and DAF custody both reuse infrastructure we already have to build for the consumer flow.

A reasonable steady-state mix: **~60% CSR Enterprise, ~25% DAF AUM, ~10% Charity Pro, ~5% donor tips + verification API**. Donor-side conversion drives top-of-funnel; enterprise + AUM make the unit economics work.

---

## Team

**@Athena19** — Paygentic Hackathon 2026.
