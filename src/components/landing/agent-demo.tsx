"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ExternalLink,
  Globe,
  Search,
  Mail,
} from "lucide-react";
import { LocusLogo } from "@/components/ui/locus-logo";

interface DemoCharity {
  name: string;
  cause: string;
  region: string;
  impact: number;
  overhead: number;
}

type Step =
  | { kind: "user"; text: string }
  | { kind: "typing" }
  | { kind: "reply"; text: string }
  | { kind: "charity-options"; charities: DemoCharity[]; selectedIdx?: number }
  | { kind: "amount-selector"; amounts: number[]; selectedIdx?: number }
  | { kind: "confirm-card"; charity: DemoCharity; amount: number }
  | { kind: "success"; charity: DemoCharity; amount: number; txShort: string }
  | { kind: "tool"; label: string; detail: string; icon: "search" | "globe" }
  | {
      kind: "web-results";
      results: { title: string; url: string; note?: string }[];
    }
  | { kind: "new-charity-card"; charity: DemoCharity; offPlatform?: boolean }
  | { kind: "recruit-card"; name: string; email: string; amount: number }
  | { kind: "recruit-success"; name: string; email: string };

const DB_OPTIONS: DemoCharity[] = [
  {
    name: "Helen Keller International",
    cause: "Health · Nutrition",
    region: "Asia",
    impact: 92,
    overhead: 11,
  },
  {
    name: "Seva Foundation",
    cause: "Health · Vision",
    region: "Asia",
    impact: 88,
    overhead: 14,
  },
  {
    name: "Fred Hollows Foundation",
    cause: "Health · Vision",
    region: "Asia",
    impact: 85,
    overhead: 18,
  },
];

const MANGROVE: DemoCharity = {
  name: "Yayasan Mangrove Indonesia",
  cause: "Environment · Biodiversity",
  region: "Indonesia",
  impact: 84,
  overhead: 9,
};

const WEB_RESULTS = [
  {
    title: "Yayasan Mangrove Indonesia — Coastal restoration, Java+Sumatra",
    url: "yayasanmangrove.id",
    note: "8 years · nonprofit",
  },
  {
    title: "Mangrove Action Project — Southeast Asia chapter",
    url: "mangroveactionproject.org",
    note: "global NGO",
  },
  {
    title: "Blue Carbon Initiative — Indonesia program",
    url: "thebluecarboninitiative.org",
    note: "gov-adjacent",
  },
];

const SCRIPT: Step[] = [
  { kind: "user", text: "I want to support vision health in Southeast Asia" },
  { kind: "typing" },
  {
    kind: "reply",
    text: "Three verified matches in our directory. Impact scores 85–92, overhead under 20% each.",
  },
  { kind: "charity-options", charities: DB_OPTIONS },
  { kind: "typing" },
  {
    kind: "charity-options",
    charities: DB_OPTIONS,
    selectedIdx: 0,
  },
  {
    kind: "reply",
    text: "Helen Keller International has the lowest overhead. How much would you like to give?",
  },
  { kind: "amount-selector", amounts: [0.5, 1, 2, 5] },
  {
    kind: "amount-selector",
    amounts: [0.5, 1, 2, 5],
    selectedIdx: 1,
  },
  { kind: "confirm-card", charity: DB_OPTIONS[0], amount: 1 },
  { kind: "user", text: "Confirm" },
  { kind: "typing" },
  { kind: "success", charity: DB_OPTIONS[0], amount: 1, txShort: "0x4f82…ae1c" },

  // --- Discovery + Recruitment arc ---
  {
    kind: "user",
    text: "Now find me a mangrove restoration org in Indonesia",
  },
  { kind: "typing" },
  {
    kind: "tool",
    label: "Web search",
    detail: '"mangrove restoration Indonesia 2026"',
    icon: "search",
  },
  { kind: "web-results", results: WEB_RESULTS },
  {
    kind: "reply",
    text: "Top pick isn't on our platform yet. Checking their site.",
  },
  {
    kind: "tool",
    label: "Scraping site",
    detail: "yayasanmangrove.id",
    icon: "globe",
  },
  { kind: "new-charity-card", charity: MANGROVE, offPlatform: true },
  {
    kind: "reply",
    text: "Want me to invite them? $0.50 via email escrow — they claim it and auto-register.",
  },
  { kind: "user", text: "Yes, invite them" },
  {
    kind: "recruit-card",
    name: MANGROVE.name,
    email: "info@yayasanmangrove.id",
    amount: 0.5,
  },
  { kind: "typing" },
  {
    kind: "recruit-success",
    name: MANGROVE.name,
    email: "info@yayasanmangrove.id",
  },
];

const DELAYS: Record<Step["kind"], number> = {
  user: 850,
  typing: 1000,
  reply: 1300,
  "charity-options": 1500,
  "amount-selector": 1200,
  "confirm-card": 1300,
  success: 2200,
  tool: 1400,
  "web-results": 1800,
  "new-charity-card": 1500,
  "recruit-card": 1500,
  "recruit-success": 2400,
};

export function AgentDemo() {
  const [step, setStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = SCRIPT[step];
    if (!current) {
      timerRef.current = setTimeout(() => setStep(0), 5000);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
    const delay = DELAYS[current.kind] ?? 1200;
    timerRef.current = setTimeout(() => setStep((s) => s + 1), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [step]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [step]);

  // Collapse consecutive "update" steps so we don't re-add a new bubble when
  // the agent is updating an existing multi-card (e.g. charity-options twice).
  const visible = dedupeUpdates(SCRIPT.slice(0, step));

  return (
    <div className="relative w-full max-w-xl">
      <div className="overflow-hidden border border-border bg-card shadow-2xl shadow-black/40">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center bg-primary text-primary-foreground">
              <LocusLogo size={14} />
            </div>
            <span className="type-caption text-foreground">Giving agent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="type-caption text-muted-foreground">Live</span>
          </div>
        </div>

        {/* Message list */}
        <div
          ref={scrollRef}
          className="h-[500px] space-y-3 overflow-y-auto px-4 py-5"
        >
          <AnimatePresence initial={false}>
            {visible.map(({ step: s, key }) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {renderStep(s)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="border-t border-border bg-background px-4 py-3">
          <Link
            href="/register"
            className="group flex items-center justify-between border border-border bg-card px-3 py-2 transition-colors hover:border-primary"
          >
            <span className="type-body-sm text-muted-foreground transition-colors group-hover:text-foreground">
              Try the real agent →
            </span>
            <span className="type-caption text-primary">Sign up</span>
          </Link>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 -bottom-6 h-6 blur-2xl"
        style={{ background: "var(--color-lime-subtle)" }}
      />
    </div>
  );
}

/**
 * When two consecutive items of the same "update-kind" appear (e.g. the
 * unselected and selected variant of a charity-options card), collapse them
 * so AnimatePresence just morphs the card in place instead of stacking two.
 */
function dedupeUpdates(steps: Step[]): { step: Step; key: string }[] {
  const result: { step: Step; key: string }[] = [];
  let multiCharityKey: string | null = null;
  let amountKey: string | null = null;

  steps.forEach((s, i) => {
    if (s.kind === "charity-options") {
      if (multiCharityKey) {
        const idx = result.findIndex((r) => r.key === multiCharityKey);
        if (idx >= 0) result[idx] = { step: s, key: multiCharityKey };
        return;
      }
      multiCharityKey = `co-${i}`;
      result.push({ step: s, key: multiCharityKey });
      return;
    }
    if (s.kind === "amount-selector") {
      if (amountKey) {
        const idx = result.findIndex((r) => r.key === amountKey);
        if (idx >= 0) result[idx] = { step: s, key: amountKey };
        return;
      }
      amountKey = `as-${i}`;
      result.push({ step: s, key: amountKey });
      return;
    }
    result.push({ step: s, key: `s-${i}` });
  });

  return result;
}

function renderStep(s: Step) {
  switch (s.kind) {
    case "user":
      return <UserBubble text={s.text} />;
    case "typing":
      return <TypingDots />;
    case "reply":
      return <ReplyBubble text={s.text} />;
    case "charity-options":
      return (
        <CharityOptions
          charities={s.charities}
          selectedIdx={s.selectedIdx}
        />
      );
    case "amount-selector":
      return <AmountSelector amounts={s.amounts} selectedIdx={s.selectedIdx} />;
    case "confirm-card":
      return <ConfirmCard charity={s.charity} amount={s.amount} />;
    case "success":
      return (
        <SuccessCard
          charity={s.charity}
          amount={s.amount}
          txShort={s.txShort}
        />
      );
    case "tool":
      return (
        <ToolCard
          label={s.label}
          detail={s.detail}
          icon={s.icon === "search" ? Search : Globe}
        />
      );
    case "web-results":
      return <WebResults results={s.results} />;
    case "new-charity-card":
      return <NewCharityCard charity={s.charity} offPlatform={s.offPlatform} />;
    case "recruit-card":
      return <RecruitCard name={s.name} email={s.email} amount={s.amount} />;
    case "recruit-success":
      return <RecruitSuccess name={s.name} email={s.email} />;
  }
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] whitespace-pre-wrap bg-primary px-3 py-2 type-body-sm text-primary-foreground">
        {text}
      </div>
    </div>
  );
}

function ReplyBubble({ text }: { text: string }) {
  return (
    <div className="border border-border bg-card p-2.5 type-body-sm text-foreground">
      {text}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 pl-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-1.5 w-1.5 bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

function ToolCard({
  icon: Icon,
  label,
  detail,
}: {
  icon: typeof Search;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-2.5 border border-dashed border-border bg-card px-3 py-2">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.6} />
      </motion.div>
      <div className="min-w-0 flex-1">
        <div className="type-caption text-muted-foreground">{label}</div>
        <div className="truncate type-body-sm text-foreground">{detail}</div>
      </div>
    </div>
  );
}

function CharityOptions({
  charities,
  selectedIdx,
}: {
  charities: DemoCharity[];
  selectedIdx?: number;
}) {
  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border px-3 py-1.5">
        <span className="type-caption text-muted-foreground">
          {charities.length} matches · verified
        </span>
      </div>
      <ul className="divide-y divide-border">
        {charities.map((c, i) => {
          const isSelected = selectedIdx === i;
          const isDimmed = selectedIdx !== undefined && selectedIdx !== i;
          return (
            <li
              key={c.name}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 transition-opacity ${
                isDimmed ? "opacity-40" : ""
              } ${isSelected ? "bg-primary/5" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center bg-primary">
                      <Check
                        className="h-2.5 w-2.5 text-primary-foreground"
                        strokeWidth={3}
                      />
                    </div>
                  ) : null}
                  <div className="truncate type-body-sm font-medium text-foreground">
                    {c.name}
                  </div>
                </div>
                <div className="mt-0.5 type-caption text-muted-foreground">
                  {c.cause} · {c.region}
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="type-mono text-xs text-primary">
                  {c.impact}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  {c.overhead}% OH
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AmountSelector({
  amounts,
  selectedIdx,
}: {
  amounts: number[];
  selectedIdx?: number;
}) {
  return (
    <div className="border border-border bg-card p-2.5">
      <div className="mb-2 type-caption text-muted-foreground">
        Choose an amount
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {amounts.map((amt, i) => {
          const isSelected = selectedIdx === i;
          return (
            <div
              key={amt}
              className={`border px-2 py-2 text-center type-mono text-sm transition-colors ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground"
              }`}
            >
              ${amt.toFixed(amt % 1 === 0 ? 0 : 2)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConfirmCard({
  charity,
  amount,
}: {
  charity: DemoCharity;
  amount: number;
}) {
  return (
    <div className="border border-primary/60 bg-card p-3">
      <div className="type-caption text-primary">Confirm donation</div>
      <div className="mt-2 flex items-baseline justify-between">
        <div className="type-body-sm font-medium text-foreground">
          {charity.name}
        </div>
        <div className="type-mono text-base text-foreground">
          ${amount.toFixed(2)}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled
          className="flex-1 bg-primary px-3 py-1.5 type-body-sm font-medium text-primary-foreground"
        >
          Confirm
        </button>
        <button
          type="button"
          disabled
          className="border border-border bg-transparent px-3 py-1.5 type-body-sm text-muted-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function SuccessCard({
  charity,
  amount,
  txShort,
}: {
  charity: DemoCharity;
  amount: number;
  txShort: string;
}) {
  return (
    <div className="border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center bg-primary">
          <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
        </div>
        <div className="type-body-sm font-medium text-foreground">
          Sent ${amount.toFixed(2)} USDC to {charity.name}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 type-caption">
        <span className="text-muted-foreground">Base tx</span>
        <span className="inline-flex items-center gap-1 font-mono text-primary">
          {txShort}
          <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

function WebResults({
  results,
}: {
  results: { title: string; url: string; note?: string }[];
}) {
  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border px-3 py-1.5">
        <span className="type-caption text-muted-foreground">
          {results.length} results · brave
        </span>
      </div>
      <ul className="divide-y divide-border">
        {results.map((r) => (
          <li key={r.url} className="px-3 py-2">
            <div className="line-clamp-1 type-body-sm text-foreground">
              {r.title}
            </div>
            <div className="mt-0.5 flex items-center gap-2 type-caption text-muted-foreground">
              <span className="font-mono text-primary">{r.url}</span>
              {r.note ? <span>· {r.note}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewCharityCard({
  charity,
  offPlatform,
}: {
  charity: DemoCharity;
  offPlatform?: boolean;
}) {
  return (
    <div className="border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate type-body-sm font-medium text-foreground">
              {charity.name}
            </div>
            {offPlatform ? (
              <span className="border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-primary">
                Off-platform
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 type-caption text-muted-foreground">
            {charity.cause} · {charity.region}
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="type-mono text-sm text-primary">
            {charity.impact}
          </span>
          <span className="type-caption text-muted-foreground">impact</span>
        </div>
      </div>
    </div>
  );
}

function RecruitCard({
  name,
  email,
  amount,
}: {
  name: string;
  email: string;
  amount: number;
}) {
  return (
    <div className="border border-primary/60 bg-card p-3">
      <div className="flex items-center gap-2">
        <Mail className="h-3.5 w-3.5 text-primary" />
        <div className="type-caption text-primary">Recruit via email escrow</div>
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex items-baseline justify-between">
          <div className="type-body-sm font-medium text-foreground">{name}</div>
          <div className="type-mono text-sm text-foreground">
            ${amount.toFixed(2)}
          </div>
        </div>
        <div className="type-caption text-muted-foreground">{email}</div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled
          className="flex-1 bg-primary px-3 py-1.5 type-body-sm font-medium text-primary-foreground"
        >
          Send invitation
        </button>
        <button
          type="button"
          disabled
          className="border border-border bg-transparent px-3 py-1.5 type-body-sm text-muted-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function RecruitSuccess({ name, email }: { name: string; email: string }) {
  return (
    <div className="border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center bg-primary">
          <Mail className="h-3 w-3 text-primary-foreground" strokeWidth={2} />
        </div>
        <div className="type-body-sm font-medium text-foreground">
          Invitation sent to {name}
        </div>
      </div>
      <div className="mt-2 type-caption text-muted-foreground">
        {email} · $0.50 USDC escrowed · claim link expires in 30 days
      </div>
    </div>
  );
}
