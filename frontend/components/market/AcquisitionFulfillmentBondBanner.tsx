"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { postMeAcquisitionFulfillmentBond } from "@/lib/apiClient";
import {
  acquisitionFulfillmentRequiredForBounty,
  fetchAcquisitionFulfillmentEligibility,
} from "@/lib/acquisition/acquisitionFulfillmentEligibility";
import { ACQUISITION_FULFILLMENT_BOND_MIN_USDC } from "@/lib/acquisition/acquisitionBondConstants";
import { travelFocusRingOffset2Classes, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

export default function AcquisitionFulfillmentBondBanner({
  bountyMaxUsdc,
  onBondLocked,
}: {
  bountyMaxUsdc: number;
  onBondLocked?: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [needsBond, setNeedsBond] = useState(false);
  const [sessionOk, setSessionOk] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const refresh = useCallback(async () => {
    if (!acquisitionFulfillmentRequiredForBounty(bountyMaxUsdc)) {
      setNeedsBond(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const el = await fetchAcquisitionFulfillmentEligibility(bountyMaxUsdc);
    setSessionOk(el.sessionOk);
    setNeedsBond(el.fulfillmentRequired && !el.fulfillmentBondActive);
    setLoading(false);
  }, [bountyMaxUsdc]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading || !needsBond) {
    return null;
  }

  async function handleLock() {
    setLocking(true);
    setErrorKey(null);
    setSuccess(false);
    try {
      await postMeAcquisitionFulfillmentBond({ amount: String(ACQUISITION_FULFILLMENT_BOND_MIN_USDC) });
      setSuccess(true);
      setNeedsBond(false);
      onBondLocked?.();
    } catch {
      setErrorKey("market_acquisition_fulfillment_bond_lock_error");
    } finally {
      setLocking(false);
    }
  }

  const D = TT_MARKETING_MARKET_DARK_PATH;

  return (
    <div
      className="rounded-[var(--radius-md)] border border-violet-400/35 bg-violet-500/10 px-3 py-3"
      role="region"
      aria-label={t("market_acquisition_fulfillment_bond_title")}
    >
      <p className="text-meta font-medium text-violet-100/95 m-0">{t("market_acquisition_fulfillment_bond_title")}</p>
      <p className="text-[0.7rem] text-slate-300/95 mt-1.5 mb-2 leading-relaxed">
        {t("market_acquisition_fulfillment_bond_body").replace(
          /\{\{min\}\}/g,
          String(ACQUISITION_FULFILLMENT_BOND_MIN_USDC),
        )}
      </p>
      {!sessionOk ? (
        <Link
          href="/auth/login"
          className={`${touchTargetLink44Classes} inline-flex ${D.subsiteGhostCta} ${travelFocusRingOffset2Classes}`}
        >
          {t("market_acquisition_fulfillment_bond_login")}
        </Link>
      ) : (
        <button
          type="button"
          disabled={locking}
          onClick={() => void handleLock()}
          className={`${touchTargetLink44Classes} inline-flex rounded-full border border-violet-400/50 bg-violet-500/20 px-4 py-2 text-meta font-medium text-violet-100 hover:bg-violet-500/30 disabled:opacity-60 ${travelFocusRingOffset2Classes}`}
        >
          {locking ? t("market_acquisition_fulfillment_bond_locking") : t("market_acquisition_fulfillment_bond_lock_btn")}
        </button>
      )}
      {success ? (
        <p className="text-meta text-success mt-2 m-0" role="status">
          {t("market_acquisition_fulfillment_bond_success")}
        </p>
      ) : null}
      {errorKey ? (
        <p className="text-meta text-red-300/95 mt-2 m-0" role="alert">
          {t(errorKey)}
        </p>
      ) : null}
    </div>
  );
}
