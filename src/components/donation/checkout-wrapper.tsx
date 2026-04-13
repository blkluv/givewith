"use client";

import { LocusCheckout } from "@withlocus/checkout-react";

interface CheckoutWrapperProps {
  sessionId: string;
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
  onSuccess,
  onCancel,
  onError,
}: CheckoutWrapperProps) {
  const checkoutUrl =
    process.env.NEXT_PUBLIC_LOCUS_CHECKOUT_URL ||
    "https://checkout.paywithlocus.com";

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
