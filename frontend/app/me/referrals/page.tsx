"use client";

import { Suspense } from "react";

import { MeReferralsPageMain } from "./MeReferralsPageMain";

/** G-S4 · 用户推荐中心（102 §4.3 · 非五主路由） */
export default function MeReferralsPage() {
  return (
    <Suspense fallback={null}>
      <MeReferralsPageMain />
    </Suspense>
  );
}
