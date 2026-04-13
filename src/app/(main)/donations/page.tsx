import type { Metadata } from "next";
import { DonationsClient } from "@/components/donations/donations-client";

export const metadata: Metadata = {
  title: "Donations",
};

export default function DonationsPage() {
  return <DonationsClient />;
}
