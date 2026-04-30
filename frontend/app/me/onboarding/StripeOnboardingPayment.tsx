"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { FormEvent } from "react";
import { useId, useMemo, useState } from "react";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

const publishableKey =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.trim()
    : "";

type InnerProps = {
  onComplete: () => void;
  submitLabel: string;
  submitBusyLabel: string;
};

function Inner({ onComplete, submitLabel, submitBusyLabel }: InnerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const errId = useId();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!stripe || !elements) return;
    setBusy(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: typeof window !== "undefined" ? window.location.href : undefined,
        },
        redirect: "if_required",
      });
      if (error) {
        setErr(error.message ?? "payment_failed");
      } else {
        onComplete();
      }
    } finally {
      setBusy(false);
    }
  };

  const submitBtnClass = `min-h-[44px] rounded-[var(--radius-sm)] border border-travel-500 bg-travel-500 px-4 text-small font-semibold text-white transition-colors ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console enabled:hover:bg-travel-600 disabled:cursor-not-allowed disabled:opacity-50`;

  return (
    <form
      onSubmit={(ev) => void onSubmit(ev)}
      className="mt-3 space-y-3"
      aria-describedby={err ? errId : undefined}
    >
      <PaymentElement options={{ layout: "tabs" }} />
      {err ? (
        <p id={errId} className="text-small text-red-700" role="alert">
          {err}
        </p>
      ) : null}
      <button
        type="submit"
        aria-busy={busy}
        disabled={!stripe || busy}
        className={submitBtnClass}
      >
        {busy ? submitBusyLabel : submitLabel}
      </button>
    </form>
  );
}

export type StripeOnboardingPaymentProps = {
  clientSecret: string;
  onComplete: () => void;
  submitLabel: string;
  /** Shown on the pay button while Stripe `confirmPayment` is in flight (i18n). */
  submitBusyLabel: string;
  missingPkMessage: string;
};

export function StripeOnboardingPayment(props: StripeOnboardingPaymentProps) {
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), []);

  if (!publishableKey) {
    return (
      <p className="text-meta text-ink-600" role="status">
        {props.missingPkMessage}
      </p>
    );
  }

  if (!stripePromise) {
    return null;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: props.clientSecret,
        appearance: { theme: "stripe" },
      }}
    >
      <Inner
        onComplete={props.onComplete}
        submitLabel={props.submitLabel}
        submitBusyLabel={props.submitBusyLabel}
      />
    </Elements>
  );
}
