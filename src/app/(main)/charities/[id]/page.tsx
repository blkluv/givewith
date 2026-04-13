import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { CharityDetailClient } from "@/components/charity/charity-detail-client";
import type { CharityCause } from "@/lib/constants";

export default async function CharityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await adminDb.collection("charities").doc(id).get();

  if (!doc.exists) {
    notFound();
  }

  const data = doc.data()!;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { locusApiKey, ...publicData } = data;

  const charity = {
    id: doc.id,
    ...publicData,
  } as {
    id: string;
    name: string;
    mission: string;
    causes: CharityCause[];
    region: string;
    overheadRatio: number;
    impactScore: number;
    website: string;
    contactEmail: string;
    fundingGoal: number;
    fundingRaised: number;
    locusWalletAddress: string;
    verified: boolean;
  };

  return <CharityDetailClient charity={charity} />;
}
