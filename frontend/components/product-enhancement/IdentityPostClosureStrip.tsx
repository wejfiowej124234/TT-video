"use client";

import Link from "next/link";
import { trackPesCtaClick } from "@/lib/conversionAnalyticsLayer";
import { buildPesAuthHref } from "@/lib/pesAuthReturnFlow";
import { PES_UI } from "@/lib/productEnhancementSprint";
import { usePesTouchpointImpression } from "@/lib/usePesAnalytics";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

const POST_RETURN = "/community?publish=1";

export type IdentityPostClosureStripProps = {
  t: (key: string) => string;
  className?: string;
};

/** Wave 4 · identity→post 收口：身份开通 + 发帖 Auth 回流 */
export function IdentityPostClosureStrip({ t, className = "" }: IdentityPostClosureStripProps) {
  usePesTouchpointImpression("community");
  const identityHref = buildPesAuthHref("login", POST_RETURN, "identity", "/me/identities");
  const postHref = buildPesAuthHref("login", POST_RETURN, "post", POST_RETURN);

  return (
    <aside
      className={`rounded-[var(--radius-md)] border border-ref-sun/35 bg-ref-sun/8 px-3 py-2.5 sm:px-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${className}`}
      aria-label={t("pes4_identity_post_aria")}
      data-tt-pes-wave4="CC-P0-02"
      data-tt-pes-identity-post-closure="1"
    >
      <div className="min-w-0 flex-1">
        <p className="text-meta font-semibold uppercase tracking-wide text-ref-sun/95">
          {t("pes4_identity_post_kicker")}
        </p>
        <p className="text-small text-ink-700 dark:text-slate-200/95 leading-snug">{t("pes4_identity_post_body")}</p>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <Link
          href={identityHref}
          onClick={() => trackPesCtaClick("community", identityHref, "pes4_identity_cta")}
          className={`${PES_UI.ctaSecondary} border-ink-300 text-ink-800 dark:border-slate-500 dark:text-slate-100 ${travelFocusRingCoreOffset2Classes}`}
        >
          {t("pes4_identity_cta")}
        </Link>
        <Link
          href={postHref}
          onClick={() => trackPesCtaClick("community", postHref, "pes4_post_cta")}
          className={`${PES_UI.ctaPrimary} ${travelFocusRingCoreOffset2Classes}`}
        >
          {t("pes4_post_cta")}
        </Link>
      </div>
    </aside>
  );
}
