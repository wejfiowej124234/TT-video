"use client";

import { useEffect, useState } from "react";
import { getOrder } from "@/lib/apiClient";
import { apiOrderSliceMatchesRoute } from "@/lib/orderGetEnvelopeGuard";
import type { DisputeDetail } from "./disputeDetailPageTypes";

export function useDisputeDetailPageResolvedOrderEscrow(dispute: DisputeDetail | null) {
  const [orderEscrowAddr, setOrderEscrowAddr] = useState<`0x${string}` | null | undefined>(undefined);
  const [orderEscrowEnvelopeMismatch, setOrderEscrowEnvelopeMismatch] = useState(false);

  useEffect(() => {
    if (!dispute?.order_id || dispute.status !== "resolved") {
      setOrderEscrowAddr(undefined);
      setOrderEscrowEnvelopeMismatch(false);
      return;
    }
    const orderId = dispute.order_id;
    let cancelled = false;
    setOrderEscrowAddr(undefined);
    setOrderEscrowEnvelopeMismatch(false);
    getOrder(orderId)
      .then((raw: unknown) => {
        if (cancelled) return;
        const res = raw as { order?: { escrow_address?: string | null } };
        const o = res?.order ?? raw;
        if (!apiOrderSliceMatchesRoute(o, orderId)) {
          setOrderEscrowEnvelopeMismatch(true);
          setOrderEscrowAddr(null);
          return;
        }
        setOrderEscrowEnvelopeMismatch(false);
        const addr =
          typeof o === "object" && o !== null && "escrow_address" in o
            ? (o as { escrow_address?: string | null }).escrow_address
            : null;
        const s =
          typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/i.test(addr)
            ? (addr as `0x${string}`)
            : null;
        setOrderEscrowAddr(s);
      })
      .catch((err) => {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            console.error("DisputeDetailPage getOrder escrow_address:", err);
          }
          setOrderEscrowEnvelopeMismatch(false);
          setOrderEscrowAddr(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dispute?.order_id, dispute?.status]);

  return { orderEscrowAddr, orderEscrowEnvelopeMismatch };
}
