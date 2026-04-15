"use client";

import { LocusCheckout } from "@withlocus/checkout-react";

interface CheckoutWrapperProps {
  sessionId: string;
  checkoutUrl?: string;
  onSuccess: (data: {
    sessionId: string;
    amount: string;
    currency: string;
    txHash: string;
    payerAddress: string;
    paidAt: string;
  }) => void;
  onCancel: () => void;
  onError: (error: Error) => void;
}

export function CheckoutWrapper({
  sessionId,
  checkoutUrl: checkoutUrlProp,
  onSuccess,
  onCancel,
  onError,
}: CheckoutWrapperProps) {
  // Prefer the checkoutUrl returned by the API (env-independent, always
  // matches the environment the session was created in). Fall back to env /
  // beta default so the iframe origin still matches the beta API even if the
  // prop is missing.
  const checkoutUrl =
    checkoutUrlProp ||
    process.env.NEXT_PUBLIC_LOCUS_CHECKOUT_URL ||
    "https://beta-checkout.paywithlocus.com";

  return (
    <div className="min-h-[700px] w-full">
      <LocusCheckout
        sessionId={sessionId}
        mode="embedded"
        checkoutUrl={checkoutUrl}
        onSuccess={onSuccess}
        onCancel={onCancel}
        onError={onError}
      />
    </div>
  );
}
