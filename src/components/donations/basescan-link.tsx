import { ExternalLink } from "lucide-react";
import { BASESCAN_TX_URL } from "@/lib/constants";

interface BasescanLinkProps {
  txHash: string;
}

export function BasescanLink({ txHash }: BasescanLinkProps) {
  return (
    <a
      href={`${BASESCAN_TX_URL}/${txHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-mono text-xs link-lime"
    >
      {txHash.slice(0, 6)}…{txHash.slice(-4)}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
