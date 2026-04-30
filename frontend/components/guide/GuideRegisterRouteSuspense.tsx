"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import TrustInfraWall from "@/components/trust/TrustInfraWall";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** `/guide/register`：`useSearchParams` 须在 Suspense 内（Next 15） */
function GuideRegisterRouteSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-bg-main" aria-label={t("guideRegister_title")} aria-busy="true">
      <section className="mx-auto max-w-md px-6 py-12 space-y-4">
        <h1 className="text-h4 font-semibold text-ink-900">{t("guideRegister_title")}</h1>
        <div className="rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50/80 px-4 py-6">
          <LoadingText />
        </div>
        <p className="text-meta text-ink-600">
          <Link href="/guides" className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("guides_title")}
          </Link>
          {" · "}
          <Link href="/" className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("guides_navHome")}
          </Link>
        </p>
      </section>
      <div className="mx-auto max-w-md px-6 pb-12">
        <TrustInfraWall />
        <ProductCrossNav
          ariaLabelKey="guide_register_relatedNav_aria"
          showGuides
          className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-600"
          linkClassName={`inline-flex min-h-[44px] items-center justify-center text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          separatorClassName="text-ink-400"
        />
      </div>
    </main>
  );
}

export function GuideRegisterRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<GuideRegisterRouteSuspenseFallback />}>{children}</Suspense>;
}
