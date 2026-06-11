"use client";

import Link from "next/link";

import MeAcquisitionFulfillmentBondAction from "@/components/me/MeAcquisitionFulfillmentBondAction";
import MeAcquisitionPublishBondAction from "@/components/me/MeAcquisitionPublishBondAction";
import { acquisitionL5BondCalloutDataAttrs } from "@/lib/acquisition/acquisitionL5";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import type { MeTrustSummary } from "@/lib/meTrust";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

type TFunc = (k: string, vars?: Record<string, string | number>) => string;

export default function CommunityMeAcquisitionTrustStrip({
  t,
  trust,
  onTrustRefresh,
}: {
  t: TFunc;
  trust: MeTrustSummary | null;
  onTrustRefresh?: () => void;
}) {
  if (!trust) return null;

  const suspended = trust.acquisition_publish_suspended === true;
  const walletOk = trust.wallet_linked === true;
  const publishEligible = trust.acquisition_publish_eligible === true;
  const bondWaived = trust.acquisition_publish_bond_waived === true;
  const bondActive = trust.acquisition_publish_bond_active === true;
  const fulfillmentActive = trust.acquisition_fulfillment_bond_active === true;
  const score =
    typeof trust.acquisition_trust_score === "number" ? trust.acquisition_trust_score : null;

  const needsPublishBond = walletOk && !publishEligible && !bondWaived && !bondActive && !suspended;
  const showFulfillmentHint = walletOk && !fulfillmentActive && !suspended;
  const showStrip =
    suspended || needsPublishBond || showFulfillmentHint || (walletOk && score != null);

  if (!showStrip) return null;

  return (
    <section
      {...acquisitionL5BondCalloutDataAttrs()}
      className={`${TT_COMMUNITY_PAGE_L5.panelLoose} space-y-3`}
      aria-label={t("community_me_acquisition_trust_aria")}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className={TT_COMMUNITY_PAGE_L5.pageTitleH4}>{t("community_me_acquisition_trust_title")}</h2>
          <p className="mt-1 text-meta text-slate-400/95 leading-snug">
            {t("community_me_acquisition_trust_caption")}
          </p>
        </div>
        {score != null ? (
          <span className="inline-flex min-h-[44px] items-center rounded-full border border-ref-sun/35 bg-ref-sun/10 px-3 py-1 text-meta font-semibold text-ref-sun">
            {t("community_me_acquisition_trust_score", { score: String(score) })}
          </span>
        ) : null}
      </div>

      {suspended ? (
        <p className="rounded-[var(--radius-md)] border border-danger/35 bg-danger/10 px-3 py-2 text-meta text-danger/95">
          {t("me_trust_acquisition_publish_suspended")}
        </p>
      ) : null}

      {!walletOk ? (
        <p className="text-meta text-slate-300/95">
          {t("community_me_acquisition_trust_wallet_hint")}{" "}
          <Link href="#me-platform-profile" className={`text-ref-sun underline underline-offset-2 ${communityCardLinkFocus}`}>
            {t("community_me_edit_profile")}
          </Link>
        </p>
      ) : null}

      {needsPublishBond ? (
        <MeAcquisitionPublishBondAction t={t} trust={trust} compact onBondLocked={onTrustRefresh} />
      ) : null}

      {showFulfillmentHint && publishEligible ? (
        <MeAcquisitionFulfillmentBondAction t={t} trust={trust} compact onBondLocked={onTrustRefresh} />
      ) : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          href="/market/acquisition"
          className={`${TT_COMMUNITY_PAGE_L5.pillCompact} ${communityCardLinkFocus}`}
        >
          {t("community_me_acquisition_trust_open_subsite")}
        </Link>
      </div>
    </section>
  );
}
