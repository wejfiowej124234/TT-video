"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { getMeFull } from "@/lib/apiClient";
import { canPerformGuideIdentityStaking } from "@/lib/guide/guideIdentityStakingNav";
import { parseMeTrustFromMeResponse } from "@/lib/meTrust";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";
import { touchTargetLink44Classes, authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";

type GuideIdentityStakingOpsGateProps = {
  children: ReactNode;
};

/**
 * 向导身份池写操作门闸：仅管理员审核通过后可质押/解押（申请页不交质押）。
 */
export default function GuideIdentityStakingOpsGate({ children }: GuideIdentityStakingOpsGateProps) {
  const { t } = useTranslation();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [pendingReview, setPendingReview] = useState(false);
  const [exitingGuide, setExitingGuide] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      getMeFull({ force: true })
        .then((res) => {
          if (cancelled) return;
          const user = (res as { user?: Parameters<typeof parseMeTrustFromMeResponse>[1] } | null)?.user;
          if (!user) {
            setAllowed(false);
            setPendingReview(false);
            setExitingGuide(false);
            return;
          }
          const trust = parseMeTrustFromMeResponse(res, user);
          const status = trust?.guide_registration_status ?? null;
          const s = status?.trim().toLowerCase() ?? "";
          setPendingReview(s === "pending" || s === "pending_review");
          setExitingGuide(s === "exiting" || s === "exited");
          setAllowed(canPerformGuideIdentityStaking(status) && s !== "exiting" && s !== "exited");
        })
        .catch(() => {
          if (!cancelled) {
            setAllowed(false);
            setPendingReview(false);
            setExitingGuide(false);
          }
        });
    };

    refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (allowed === null) {
    return (
      <div
        className={`${TT_STAKING_PAGE_L5.panelCard} text-meta text-slate-400`}
        aria-busy="true"
        data-tt-guide-staking-ops-gate="loading"
      >
        {t("staking_guide_ops_gate_loading")}
      </div>
    );
  }

  if (allowed) {
    return <>{children}</>;
  }

  const messageKey = exitingGuide
    ? "staking_guide_ops_gate_exiting"
    : pendingReview
      ? "staking_guide_ops_gate_pending"
      : "staking_guide_ops_gate_not_approved";

  return (
    <div
      role="note"
      className={TT_STAKING_PAGE_L5.calloutWarn}
      data-tt-guide-staking-ops-gate="blocked"
    >
      <p className="text-body text-slate-200">{t(messageKey)}</p>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        <Link
          href="/guide"
          className={`${touchTargetLink44Classes} font-semibold text-[#fde9a8] underline decoration-ref-sun/50 ${authL5InlineLinkFocusClasses}`}
        >
          {t("guideRegister_doneGuideWorkbench")}
        </Link>
        {!pendingReview ? (
          <Link
            href="/guide/register"
            className={`${touchTargetLink44Classes} font-semibold text-trust-700 underline`}
          >
            {t("staking_ctaApply")}
          </Link>
        ) : null}
      </p>
    </div>
  );
}
