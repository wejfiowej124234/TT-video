"use client";

import Link from "next/link";
import { useState } from "react";
import { postMeAcquisitionFulfillmentBond } from "@/lib/apiClient";
import type { MeTrustSummary } from "@/lib/meTrust";
import { FOCUS_RING } from "./constants";

export interface MeAcquisitionFulfillmentBondActionProps {
  t: (k: string) => string;
  trust: MeTrustSummary;
  compact?: boolean;
  onBondLocked?: () => void;
}

export default function MeAcquisitionFulfillmentBondAction({
  t,
  trust,
  compact = false,
  onBondLocked,
}: MeAcquisitionFulfillmentBondActionProps) {
  const [locking, setLocking] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (trust.acquisition_fulfillment_bond_active === true) {
    return null;
  }
  if (!trust.wallet_linked) {
    return null;
  }

  async function handleLockBond() {
    setLocking(true);
    setErrorKey(null);
    setSuccess(false);
    try {
      await postMeAcquisitionFulfillmentBond();
      setSuccess(true);
      onBondLocked?.();
    } catch {
      setErrorKey("me_trust_acquisition_fulfillment_error");
    } finally {
      setLocking(false);
    }
  }

  return (
    <div
      className={`rounded-[var(--radius-md)] border border-violet-500/30 bg-violet-500/10 ${
        compact ? "px-2.5 py-2 mt-2" : "px-3 py-3 mt-2"
      }`}
      role="region"
      aria-label={t("me_trust_acquisition_fulfillment_title")}
    >
      <h3 className={`font-semibold text-violet-200/95 ${compact ? "text-small mb-0.5" : "text-meta mb-1"}`}>
        {t("me_trust_acquisition_fulfillment_title")}
      </h3>
      <p className={`text-slate-300/95 leading-snug ${compact ? "text-[0.7rem] mb-1.5" : "text-meta mb-2"}`}>
        {t("me_trust_acquisition_fulfillment_caption")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={locking}
          onClick={() => void handleLockBond()}
          className={`inline-flex min-h-[36px] items-center justify-center rounded-full border border-violet-400/50 bg-violet-500/20 px-3 py-1.5 text-meta font-medium text-violet-100 hover:bg-violet-500/30 disabled:opacity-60 motion-sub motion-reduce:transition-none ${FOCUS_RING}`}
        >
          {locking
            ? t("me_trust_acquisition_fulfillment_locking")
            : t("me_trust_acquisition_fulfillment_lock_btn")}
        </button>
        <Link
          href="/market/acquisition"
          className={`text-meta text-cyan-300 hover:text-cyan-100 underline motion-sub ${FOCUS_RING}`}
        >
          {t("me_trust_acquisition_market_link")}
        </Link>
      </div>
      {success ? (
        <p className="text-meta text-success mt-2" role="status">
          {t("me_trust_acquisition_fulfillment_success")}
        </p>
      ) : null}
      {errorKey ? (
        <p className="text-meta text-danger/95 mt-2" role="alert">
          {t(errorKey)}
        </p>
      ) : null}
    </div>
  );
}
