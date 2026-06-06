"use client";

import { EscrowRateRouteSuspense } from "@/components/escrow/EscrowRateRouteSuspense";

import { EscrowRatePageInner } from "./EscrowRatePageInner";

/** 53-S8：行程评分页 — 组合在 `EscrowRatePageInner` / `useEscrowRatePage` */
export default function EscrowRatePage() {
  return (
    <EscrowRateRouteSuspense>
      <EscrowRatePageInner />
    </EscrowRateRouteSuspense>
  );
}
