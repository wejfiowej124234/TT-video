"use client";

import { PayRouteSuspense } from "@/components/pay/PayRouteSuspense";

import { PayPageInner } from "./PayPageInner";

/** 07 Phase 4 / 5.1：支付与托管入口；组合在 `PayPageInner` / `usePayPage` */
export default function PayPage() {
  return (
    <PayRouteSuspense>
      <PayPageInner />
    </PayRouteSuspense>
  );
}
