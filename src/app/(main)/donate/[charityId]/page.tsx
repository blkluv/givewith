import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { DonationFlow } from "@/components/donation/donation-flow";

export default async function DonatePage({
  params,
}: {
  params: Promise<{ charityId: string }>;
}) {
  const { charityId } = await params;
  const doc = await adminDb.collection("charities").doc(charityId).get();

  if (!doc.exists) {
    notFound();
  }

  const data = doc.data()!;
  const charity = {
    id: doc.id,
    name: data.name,
    mission: data.mission,
    impactScore: data.impactScore,
    overheadRatio: data.overheadRatio,
  };

  return <DonationFlow charity={charity} />;
}
