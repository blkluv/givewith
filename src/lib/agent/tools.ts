import { tool } from "ai";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import {
  getBalance,
  sendPayment,
  sendEmailPayment,
  callWrappedBrave,
  callWrappedFirecrawl,
  getTransactions,
} from "@/lib/locus";
import { CHARITY_CAUSES, REGIONS, MIN_DONATION_AMOUNT } from "@/lib/constants";
import type { AgentAction, AgentContext } from "./types";

type ActionCollector = (action: AgentAction) => void;

/**
 * Build the tool set for a given authenticated user's agent turn.
 *
 * Each tool's `execute` reuses the decrypted `userApiKey` via closure so the
 * agent never sees credentials. Side-effects (Firestore writes, payments) are
 * preserved identically to the pre-Thesys `executor.ts`.
 */
export function buildAgentTools(
  ctx: AgentContext,
  collectAction: ActionCollector,
) {
  const ts = () => new Date().toISOString();

  return {
    searchCharityDb: tool({
      description:
        "Search the GiveWithLocus verified charity database by cause, region, or free-text query. Always try this first before searching the web.",
      inputSchema: z.object({
        cause: z
          .enum(CHARITY_CAUSES as unknown as [string, ...string[]])
          .optional()
          .describe("Cause category"),
        region: z
          .enum(REGIONS as unknown as [string, ...string[]])
          .optional()
          .describe("Geographic region"),
        query: z
          .string()
          .optional()
          .describe("Free-text search across charity name and mission"),
      }),
      execute: async ({ cause, region, query }) => {
        let firestoreQuery: FirebaseFirestore.Query =
          adminDb.collection("charities").where("verified", "==", true);
        if (cause) {
          firestoreQuery = firestoreQuery.where(
            "causes",
            "array-contains",
            cause,
          );
        }
        if (region) {
          firestoreQuery = firestoreQuery.where("region", "==", region);
        }

        const snapshot = await firestoreQuery.limit(10).get();
        let charities = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name as string,
            mission: data.mission as string,
            causes: data.causes as string[],
            region: data.region as string,
            impactScore: data.impactScore as number,
            overheadRatio: data.overheadRatio as number,
            fundingGoal: data.fundingGoal as number,
            fundingRaised: data.fundingRaised as number,
            website: data.website as string,
            verified: data.verified as boolean,
          };
        });

        if (query) {
          const q = query.toLowerCase();
          charities = charities.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.mission.toLowerCase().includes(q),
          );
        }

        collectAction({
          type: "search_db",
          input: { cause, region, query },
          result: { found: charities.length },
          timestamp: ts(),
        });

        return { found: charities.length, charities };
      },
    }),

    searchWeb: tool({
      description:
        "Search the web for charities not in our database. Use when DB search returns no good matches. Costs $0.035 per call.",
      inputSchema: z.object({
        query: z
          .string()
          .describe(
            'Search query, e.g. "top-rated mangrove restoration charities Indonesia"',
          ),
      }),
      execute: async ({ query }) => {
        const results = await callWrappedBrave(ctx.platformApiKey, query, 5);
        const webResults =
          results.web?.results?.map((r) => ({
            title: r.title,
            url: r.url,
            description: r.description,
          })) || [];

        collectAction({
          type: "search_web",
          input: { query },
          result: { count: webResults.length },
          timestamp: ts(),
        });

        return { results: webResults };
      },
    }),

    scrapeCharityWebsite: tool({
      description:
        "Scrape a charity website for mission, impact metrics, financial transparency, and legitimacy signals. Costs $0.003 per call.",
      inputSchema: z.object({
        url: z.string().url().describe("Full URL of the charity website"),
      }),
      execute: async ({ url }) => {
        const scraped = await callWrappedFirecrawl(ctx.platformApiKey, url);
        const content = scraped.markdown?.slice(0, 3000) || "No content found";

        collectAction({
          type: "scrape",
          input: { url },
          result: { title: scraped.metadata?.title },
          timestamp: ts(),
        });

        return {
          title: scraped.metadata?.title || "Unknown",
          content,
        };
      },
    }),

    checkBalance: tool({
      description:
        "Check the donor's current USDC wallet balance. Use before recommending donation amounts.",
      inputSchema: z.object({}),
      execute: async () => {
        const balance = await getBalance(ctx.userApiKey);
        collectAction({
          type: "check_balance",
          input: {},
          result: { balance: balance.balance },
          timestamp: ts(),
        });
        return {
          balance: balance.balance,
          token: balance.token,
          walletAddress: balance.wallet_address,
        };
      },
    }),

    executeDonation: tool({
      description:
        "Execute a USDC donation to a charity. ONLY call after explicit user confirmation (yes / confirm / approve). Writes the donation to Firestore and bumps the charity's fundingRaised.",
      inputSchema: z.object({
        charityId: z.string().describe("Firestore charity document ID"),
        amount: z
          .number()
          .min(MIN_DONATION_AMOUNT)
          .describe(`Donation amount in USDC (min ${MIN_DONATION_AMOUNT})`),
        memo: z.string().describe("Donation memo describing the purpose"),
        reasoning: z
          .string()
          .describe("Agent reasoning for this recommendation"),
      }),
      execute: async ({ charityId, amount, memo, reasoning }) => {
        const charityDoc = await adminDb
          .collection("charities")
          .doc(charityId)
          .get();
        if (!charityDoc.exists) {
          collectAction({
            type: "donate",
            input: { charityId, amount },
            result: { error: "Charity not found" },
            timestamp: ts(),
          });
          return { error: "Charity not found" };
        }

        const charityData = charityDoc.data()!;
        const walletAddress = charityData.locusWalletAddress as string;

        const result = await sendPayment(
          ctx.userApiKey,
          walletAddress,
          amount,
          memo,
        );

        const donationRef = await adminDb.collection("donations").add({
          donorId: ctx.userId,
          charityId,
          charityName: charityData.name,
          amount,
          memo,
          transactionId: result.transaction_id,
          txHash: null,
          status: result.status,
          method: "direct",
          agentReasoning: reasoning,
          createdAt: new Date().toISOString(),
        });

        await adminDb
          .collection("charities")
          .doc(charityId)
          .update({
            fundingRaised: (charityData.fundingRaised || 0) + amount,
          });

        // Poll Locus for settlement so the agent can report a real
        // CONFIRMED status + txHash in the same turn. Locus typically takes
        // 5–10s to register; 3s wasn't enough in practice. Cap at ~10s
        // (5 attempts × 2s) so the agent reply doesn't stall too long if
        // settlement is slower than usual — the page-mount reconcilers
        // will catch any straggler.
        let finalStatus = result.status;
        let finalTxHash: string | null = null;
        for (let i = 0; i < 5; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          try {
            const txs = await getTransactions(ctx.userApiKey, { limit: 10 });
            // Listing uses `id`; /pay/send returns `transaction_id`. Same value, different field name.
            const match = txs.find((t) => t.id === result.transaction_id);
            if (match) {
              finalStatus = match.status;
              finalTxHash = match.tx_hash || null;
              if (match.status === "CONFIRMED" || match.status === "FAILED") break;
            }
          } catch {
            /* keep whatever we have */
          }
        }
        if (finalStatus !== result.status || finalTxHash) {
          await donationRef.update({
            status: finalStatus,
            ...(finalTxHash && { txHash: finalTxHash }),
            reconciledAt: new Date().toISOString(),
          });
        }

        collectAction({
          type: "donate",
          input: { charityId, amount, memo },
          result: {
            transactionId: result.transaction_id,
            status: finalStatus,
          },
          timestamp: ts(),
        });

        return {
          transactionId: result.transaction_id,
          txHash: finalTxHash,
          settledStatus: finalStatus,
          status: result.status,
          charityName: charityData.name,
          amount,
          approvalUrl: result.approval_url,
        };
      },
    }),

    recruitCharity: tool({
      description:
        "Invite a charity not yet on GiveWithLocus by sending them USDC via email escrow. The charity receives an email with a claim link. Typical amount: $0.50.",
      inputSchema: z.object({
        email: z.string().email().describe("Charity's contact email address"),
        charityName: z
          .string()
          .describe("Name of the charity being recruited"),
        amount: z
          .number()
          .min(MIN_DONATION_AMOUNT)
          .describe("Invitation incentive amount in USDC (typically 0.50)"),
      }),
      execute: async ({ email, charityName, amount }) => {
        const result = await sendEmailPayment(
          ctx.userApiKey,
          email,
          amount,
          `Invitation to join GiveWithLocus — a donor wants to support ${charityName}. Claim your funds and set up your charity profile.`,
        );
        collectAction({
          type: "recruit",
          input: { email, charityName, amount },
          result: { status: result.status },
          timestamp: ts(),
        });
        return {
          status: result.status,
          charityName,
          email,
          amount,
        };
      },
    }),
  };
}
