"use client";

import { GuideDetailRouteSuspense } from "@/components/guides/GuideDetailRouteSuspense";
import { GuideDetailPageMain } from "./GuideDetailPageMain";

export default function GuideDetailPage() {
  return (
    <GuideDetailRouteSuspense>
      <GuideDetailPageMain />
    </GuideDetailRouteSuspense>
  );
}
