"use client";

import { DisputesL5PageShell } from "@/components/disputes/DisputesL5PageShell";
import { TT_DISPUTES_L5 } from "@/lib/me/disputesL5";
import { useTranslation } from "@/components/LocaleProvider";

/** 争议详情 L5 骨架（与 `DISPUTE_DETAIL_SECTION_CLASS` 同族） */
export default function DisputeDetailLoading() {
  const { t } = useTranslation();
  const section = TT_DISPUTES_L5.detailSection;

  return (
    <DisputesL5PageShell t={t} ariaLabel={t("dispute_detailTitle")} variant="detail">
      <div className="space-y-6" role="status" aria-busy="true">
        <div className="flex items-center justify-between gap-4" aria-hidden>
          <div className="h-11 min-h-[44px] w-56 max-w-[70%] animate-pulse rounded-md bg-ref-sun/15" />
          <div className="h-11 min-h-[44px] w-20 shrink-0 animate-pulse rounded-md bg-warning/20" />
        </div>
        {[1, 2, 3].map((i) => (
          <section key={i} className={section} aria-hidden>
            <div className="mb-3 h-5 w-32 animate-pulse rounded-md bg-ref-sun/12" />
            <div className="h-4 w-full animate-pulse rounded-md bg-slate-700/50" />
          </section>
        ))}
      </div>
    </DisputesL5PageShell>
  );
}
