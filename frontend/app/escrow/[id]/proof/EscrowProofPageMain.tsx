"use client";

import Link from "next/link";
import InlineTransparencyVerification from "@/components/trust/InlineTransparencyVerification";
import TrustGrowthMomentBanner from "@/components/trust/TrustGrowthMomentBanner";
import OrderEvidenceSection from "@/components/order/OrderEvidenceSection";
import EscrowDetailLoadErrorView from "@/components/escrow/EscrowDetail/EscrowDetailLoadErrorView";
import EscrowDetailSkeleton from "@/components/escrow/EscrowDetail/EscrowDetailSkeleton";
import { useTranslation } from "@/components/LocaleProvider";
import { useEscrowDetail } from "@/components/escrow/EscrowDetail/useEscrowDetail";
import {
  escrowProtocolHeadingClass,
  escrowProtocolLinkClass,
  escrowProtocolMetaClass,
  TT_ESCROW_PROTOCOL_PANEL,
  TT_ESCROW_PROTOCOL_ZONE,
} from "@/lib/escrowProtocolUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export function EscrowProofPageMain({ escrowId }: { escrowId: string }) {
  const { t } = useTranslation();
  const data = useEscrowDetail(escrowId, t);

  if (!data.order && !data.error) return <EscrowDetailSkeleton />;
  if (data.error || !data.order) {
    return (
      <EscrowDetailLoadErrorView
        message={data.error ?? t("escrow_loadFailed")}
        onRetry={() => void data.refreshOrder({ force: true })}
        cancelPolicyHeadingId="escrow-cancel-policy"
        t={t}
        orderGetRateLimited={data.orderGetRateLimited}
      />
    );
  }

  const panelClass = TT_ESCROW_PROTOCOL_PANEL;

  return (
    <main
      className="space-y-6"
      role="main"
      aria-label={t("escrow_proof_page_aria")}
      data-tt-escrow-proof-page="1"
    >
      <p className="text-meta print:hidden">
        <Link
          href={`/escrow/${encodeURIComponent(escrowId)}`}
          className={`${touchTargetLink44Classes} inline-flex items-center ${escrowProtocolLinkClass}`}
        >
          {t("escrow_proof_back")}
        </Link>
      </p>

      <div data-zone="order-proof" className={`${TT_ESCROW_PROTOCOL_ZONE} space-y-5`}>
        <header className="space-y-1">
          <h1 className={escrowProtocolHeadingClass}>{t("escrow_proof_title")}</h1>
          <p className={escrowProtocolMetaClass}>{t("escrow_proof_subtitle")}</p>
        </header>

        <TrustGrowthMomentBanner moment="first_order" surface="slate" dismissible />
        <InlineTransparencyVerification context="order" surface="slate" verificationKey={escrowId} />
        <OrderEvidenceSection orderId={escrowId} panelClassName={panelClass} variantDid />

        {data.snapshotHash ? (
          <div className={`${panelClass} p-4 space-y-1`}>
            <p className="text-small font-semibold text-ref-sun/90">{t("escrow_proof_planDigest_title")}</p>
            <p className={`${escrowProtocolMetaClass} m-0`}>{t("escrow_proof_planDigest_body")}</p>
            <p className="text-meta font-mono text-white/70 break-all mt-2">{data.snapshotHash}</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
