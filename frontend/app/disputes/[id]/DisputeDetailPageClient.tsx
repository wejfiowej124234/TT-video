"use client";

import { DisputeDetailRouteSuspense } from "@/components/disputes/DisputeDetailRouteSuspense";
import { DisputeDetailPageInner } from "./DisputeDetailPageInner";

/** 争议详情路由入口（L5 模块化视图 · `useDisputeDetailPage`） */
export default function DisputeDetailPageClient() {
  return (
    <DisputeDetailRouteSuspense>
      <DisputeDetailPageInner />
    </DisputeDetailRouteSuspense>
  );
}
