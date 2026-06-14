"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import WorkspaceL5PageShell from "@/components/workspace/WorkspaceL5PageShell";
import { StakingL5CrossNav } from "@/components/staking/StakingL5CrossNav";
import { FOCUS_RING } from "@/components/me/constants";
import { TT_STAKING_PAGE_L5 } from "@/lib/staking/stakingPageL5";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** `/staking` 路由 · 页面级错误边界（体验深壳 · 与主面 L5 同族） */
export default function StakingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  const appErrorRetryHintId = useId();
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("Staking page error:", error?.message);
    }
  }, [error]);

  return (
    <WorkspaceL5PageShell
      kind="guide"
      ariaLabel={t("staking_pageTitle")}
      dataAttrs={TT_STAKING_PAGE_L5.guideScopePageAttrs}
      footerTarget="guide"
    >
      <section
        className={`${TT_STAKING_PAGE_L5.panelCard} text-center`}
        role="alert"
        data-tt-error-boundary-root="staking"
        data-tt-staking-error-l5="1"
      >
        <p className={TT_STAKING_PAGE_L5.panelMeta}>{t("staking_pageTitle")}</p>
        <h1 className={`mt-2 ${TT_STAKING_PAGE_L5.panelTitle}`}>{t("common_errorTitle")}</h1>
        <p className={`mt-2 ${TT_STAKING_PAGE_L5.bodyProse}`}>{t("common_errorMessage")}</p>
        <p id={appErrorRetryHintId} className={`mt-3 ${TT_STAKING_PAGE_L5.metaProse}`}>
          {t("app_error_boundary_retry_hint")}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <form
            className="inline"
            aria-describedby={appErrorRetryHintId}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              reset();
            }}
          >
            <button type="submit" aria-label={t("common_retry")} className={TT_STAKING_PAGE_L5.primaryBtn}>
              {t("common_retry")}
            </button>
          </form>
          <Link
            href="/guide"
            aria-label={t("staking_guide_scope_backWorkbench")}
            className={`${touchTargetLink44Classes} ${TT_STAKING_PAGE_L5.secondaryBtn} inline-flex no-underline ${FOCUS_RING}`}
          >
            {t("staking_guide_scope_backWorkbench")}
          </Link>
        </div>
        <p className={`mt-5 flex flex-wrap justify-center gap-x-2 gap-y-1 ${TT_STAKING_PAGE_L5.metaProse}`}>
          <Link href="/staking?scope=guide" className={`${touchTargetLink44Classes} ${TT_STAKING_PAGE_L5.backLink}`}>
            {t("staking_guide_scope_pageTitle")}
          </Link>
          <span className="text-ref-sun/25" aria-hidden>
            ·
          </span>
          <Link href="/guide/register" className={`${touchTargetLink44Classes} ${TT_STAKING_PAGE_L5.backLink}`}>
            {t("staking_ctaApply")}
          </Link>
        </p>
      </section>
      <StakingL5CrossNav />
    </WorkspaceL5PageShell>
  );
}
