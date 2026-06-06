"use client";

import { Suspense } from "react";
import MeSettingsLoading from "./loading";
import { MeSettingsPageInner } from "./MeSettingsPageInner";

/** 小红书式设置 Hub（① · L5 暖金暗壳 · 居中 max-w-3xl） */
export default function MeSettingsPage() {
  return (
    <Suspense fallback={<MeSettingsLoading />}>
      <MeSettingsPageInner />
    </Suspense>
  );
}
