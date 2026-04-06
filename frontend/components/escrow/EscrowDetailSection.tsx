"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import LoadingText from "@/components/LoadingText";

/** 动态包未就绪或 Suspense 回退：与 EscrowDetail 内 main 同 escrow_detailAria，便于烟雾命中地标 */
function EscrowDetailRouteLoading() {
  const { t } = useTranslation();
  return (
    <main className="flex min-h-screen items-center justify-center p-8" aria-label={t("escrow_detailAria")}>
      <h1 className="sr-only">{t("escrow_detailAria")}</h1>
      <LoadingText />
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
