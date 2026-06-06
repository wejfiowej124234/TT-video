"use client";

import type { ReactNode } from "react";
import { TT_STEWARD_REGISTER_L5 } from "@/lib/steward/stewardRegisterL5";

/** Step 2 钱包区 L5 壳（与主体字段分层 · 同族 guide wallet flow） */
export function StewardRegisterWalletSection({ children }: { children: ReactNode }) {
  return (
    <div className={TT_STEWARD_REGISTER_L5.walletStepShell} data-tt-steward-register-wallet-step="1">
      {children}
    </div>
  );
}
