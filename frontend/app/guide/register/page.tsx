"use client";

import { GuideRegisterRouteSuspense } from "@/components/guide/GuideRegisterRouteSuspense";
import { GuideRegisterPageMain } from "./GuideRegisterPageMain";

/** 向导申请 · 页身 SSOT 在 `GuideRegisterPageMain`（Auth L5 同族）。 */
export default function GuideRegisterPage() {
  return (
    <GuideRegisterRouteSuspense>
      <GuideRegisterPageMain />
    </GuideRegisterRouteSuspense>
  );
}
