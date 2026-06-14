"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrders, type OrderListItem } from "@/lib/apiClient/orders";
import { mapApiReadError } from "@/lib/mapApiReadError";

const TRIP_ORDERS_LIMIT = 10;

export type PublishHubTripOrderRow = {
  id: string;
  title: string;
  statusLabel: string;
  href: string;
  coverUrl?: string | null;
};

function mapTripOrderRow(order: OrderListItem): PublishHubTripOrderRow | null {
  const id = typeof order.id === "string" ? order.id.trim() : "";
  if (!id) return null;
  const dest =
    (typeof order.destination === "string" && order.destination.trim()) ||
    (typeof order.city === "string" && order.city.trim()) ||
    (typeof order.country === "string" && order.country.trim()) ||
    id;
  const status =
    (typeof order.display_status === "string" && order.display_status.trim()) ||
    (typeof order.status === "string" && order.status.trim()) ||
    (typeof order.state === "string" && order.state.trim()) ||
    "—";
  return {
    id,
    title: dest,
    statusLabel: status,
    href: `/escrow/${encodeURIComponent(id)}`,
    coverUrl: typeof order.image === "string" && order.image.trim() ? order.image.trim() : null,
  };
}

export function usePublishHubTripOrders(enabled: boolean, t: (key: string) => string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PublishHubTripOrderRow[]>([]);

  const load = useCallback(async () => {
    if (!enabled) {
      setRows([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await getOrders({
        business_line: "trip",
        hat: "traveler",
        limit: TRIP_ORDERS_LIMIT,
      });
      const mapped = (body.items ?? [])
        .map((item) => mapTripOrderRow(item as OrderListItem))
        .filter((row): row is PublishHubTripOrderRow => row != null);
      setRows(mapped);
    } catch (e) {
      setRows([]);
      setError(mapApiReadError(e, t, "publish_hub_trip_orders_load_fail"));
    } finally {
      setLoading(false);
    }
  }, [enabled, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return { rows, loading, error, retry: load, count: rows.length };
}
