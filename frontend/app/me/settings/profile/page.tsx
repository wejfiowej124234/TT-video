"use client";

import { Suspense } from "react";
import MeSettingsLoading from "../loading";
import { MeSettingsProfilePageInner } from "./MeSettingsProfilePageInner";

/** 个人资料（L5）· 头像/昵称/简介/社交统计 · 原社区资料 Hub */
export default function MeSettingsProfilePage() {
  return (
    <Suspense fallback={<MeSettingsLoading />}>
      <MeSettingsProfilePageInner />
    </Suspense>
  );
}
