"use client";

import { useEffect, useState } from "react";
import { getMe } from "@/lib/apiClient";

export type EscrowDetailMeSnapshot = {
  user?: { id?: string; default_wallet_address?: string | null };
  guide?: { wallet_address?: string | null };
} | null;

/** 托管详情页「当前用户 + 向导钱包」快照（与订单详情并行拉取） */
export function useEscrowDetailMeSnapshot(): EscrowDetailMeSnapshot {
  const [meData, setMeData] = useState<EscrowDetailMeSnapshot>(null);

  useEffect(() => {
    getMe()
      .then((res) =>
        setMeData(
          res as {
            user?: { id?: string; default_wallet_address?: string | null };
            guide?: { wallet_address?: string | null };
          },
        ),
      )
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("useEscrowDetailMeSnapshot getMe:", err);
        }
        setMeData(null);
      });
  }, []);

  return meData;
}
