"use client";

import dynamic from "next/dynamic";
import { Suspense, useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";
import EscrowCancelPolicySection from "@/components/escrow/EscrowDetail/EscrowCancelPolicySection";

/** 动态包未就绪或 Suspense 回退：与 EscrowDetail 内 main 同 escrow_detailAria，便于烟雾命中地标 */
function EscrowDetailRouteLoading() {
  const { t } = useTranslation();
  const cancelPolicyHeadingId = useId();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8" aria-label={t("escrow_detailAria")}>
      <h1 className="sr-only">{t("escrow_detailAria")}</h1>
      <LoadingText />
      <div className="w-full max-w-2xl space-y-4">
        <div className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md p-4 space-y-2 shadow-scifi-panel">
          <h3 className="text-body-l font-semibold text-cyan-200">{t("escrow_itineraryBudget")}</h3>
          <p className="text-meta text-slate-300 leading-relaxed" role="status">
            {t("escrow_itineraryLockHint")}
          </p>
        </div>
        <EscrowCancelPolicySection headingId={cancelPolicyHeadingId} />
      </div>
    </main>
  );
}

const EscrowDetail = dynamic(
  () => import("@/components/escrow/EscrowDetail").then((m) => m.default),
  {
    ssr: false,
    loading: () => <EscrowDetailRouteLoading />,
  },
);

/** `/escrow/[id]`：Next 15 要求 `dynamic(..., { ssr: false })` 在 Client 边界内；与 `EscrowRateRouteSuspense` 同属订单主链入口（07 §5.1） */
export function EscrowDetailSection({ escrowId }: { escrowId: string }) {
  return (
    <Suspense fallback={<EscrowDetailRouteLoading />}>
      <EscrowDetail escrowId={escrowId} />
    </Suspense>
  );
}
