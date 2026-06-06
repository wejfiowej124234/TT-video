"use client";

import Link from "next/link";
import { useState } from "react";
import { postMeAcquisitionPublishBond } from "@/lib/apiClient";
import type { MeTrustSummary } from "@/lib/meTrust";
import { FOCUS_RING } from "./constants";

export interface MeAcquisitionPublishBondActionProps {
  t: (k: string) => string;
  trust: MeTrustSummary;
  compact?: boolean;
  onBondLocked?: () => void;
}

export default function MeAcquisitionPublishBondAction({
  t,
  trust,
  compact = false,
  onBondLocked,
}: MeAcquisitionPublishBondActionProps) {
  const [locking, setLocking] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const bondActive = trust.acquisition_publish_bond_active === true;
  const bondWaived = trust.acquisition_publish_bond_waived === true;
  const eligible = trust.acquisition_publish_eligible === true;
  const suspended = trust.acquisition_publish_suspended === true;

  if (suspended) {
    return (
      <div
        className={`rounded-[var(--radius-md)] border border-danger/35 bg-danger/10 ${
          compact ? "px-2.5 py-2 mt-2" : "px-3 py-3 mt-3"
        }`}
        role="status"
      >
        <p className={`text-danger/95 ${compact ? "text-[0.7rem]" : "text-meta"}`}>
          {t("me_trust_acquisition_publish_suspended")}
        </p>
      </div>
    );
  }

  if (eligible || bondActive || bondWaived) {
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
      await postMeAcquisitionPublishBond();
      setSuccess(true);
      onBondLocked?.();
    } catch {
      setErrorKey("me_trust_acquisition_publish_error");
    } finally {
      setLocking(false);
    }
  }

  return (
    <div
      className={`rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 ${
        compact ? "px-2.5 py-2 mt-2" : "px-3 py-3 mt-3"
      }`}
      role="region"
      aria-label={t("me_trust_acquisition_publish_title")}
    >
      <h3 className={`font-semibold text-amber-200/95 ${compact ? "text-small mb-0.5" : "text-meta mb-1"}`}>
        {t("me_trust_acquisition_publish_title")}
      </h3>
      <p className={`text-slate-300/95 leading-snug ${compact ? "text-[0.7rem] mb-1.5" : "text-meta mb-2"}`}>
        {t("me_trust_acquisition_publish_caption")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={locking}
          onClick={() => void handleLockBond()}
          className={`inline-flex min-h-[36px] items-center justify-center rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-1.5 text-meta font-medium text-amber-100 hover:bg-amber-500/30 disabled:opacity-60 motion-sub motion-reduce:transition-none ${FOCUS_RING}`}
        >
          {locking ? t("me_trust_acquisition_publish_locking") : t("me_trust_acquisition_publish_lock_btn")}
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
          {t("me_trust_acquisition_publish_success")}
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
