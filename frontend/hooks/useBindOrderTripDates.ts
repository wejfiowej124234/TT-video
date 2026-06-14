import { useEffect, useState } from "react";
import { getOrder } from "@/lib/apiClient";
import { resolveOrderTripDatesFromGetOrderPayload } from "@/lib/guideBookingDates";

export type BindOrderTripDates = { start: string; end: string };

/** 从固定订单 id 加载出行区间（Escrow 绑定向导 · 向导详情 itinerary-first） */
export function useBindOrderTripDates(orderId: string) {
  const [tripDates, setTripDates] = useState<BindOrderTripDates | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = orderId.trim();
    if (!id) {
      setTripDates(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void getOrder(id)
      .then((data) => {
        if (cancelled) return;
        setTripDates(resolveOrderTripDatesFromGetOrderPayload(data));
      })
      .catch(() => {
        if (!cancelled) setTripDates(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return { tripDates, loading };
}
