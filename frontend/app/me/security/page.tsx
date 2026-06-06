"use client";

import { Suspense } from "react";
import { MeSecurityPageMain } from "./MeSecurityPageMain";

/** 账号安全中心（会话 / 安全通知 / 钱包验证）· L5 设置族子页 */
export default function MeSecurityPage() {
  return (
    <Suspense fallback={null}>
      <MeSecurityPageMain />
    </Suspense>
  );
}
