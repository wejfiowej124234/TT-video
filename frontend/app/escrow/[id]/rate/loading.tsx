"use client";

import { EscrowRatePageSkeleton } from "@/components/escrow/EscrowRateRouteSuspense";
import { useTranslation } from "@/components/LocaleProvider";

/** 与 `EscrowRateRouteSuspense` 骨架同构，供路由段首屏 */
export default function EscrowRateLoading() {
  const { t } = useTranslation();
  return <EscrowRatePageSkeleton t={t} />;
}
