"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getOrders, type OrderListItem } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  buildGuideWorkbenchInboxSnapshot,
  type GuideWorkbenchInboxSnapshot,
} from "@/lib/guide/guideWorkbenchInboxModel";

const GUIDE_INBOX_ORDERS_LIMIT = 50;

export function useGuideWorkbenchInbox(
  enabled: boolean,
  guideRowId: string | null | undefined,
  t: (key: string) => string,
) {
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [inbox, setInbox] = useState<GuideWorkbenchInboxSnapshot>({
    pendingAcceptCount: 0,
    todayPendingCount: 0,
    nextOrder: null,
  });
  const [nextOrderItem, setNextOrderItem] = useState<OrderListItem | null>(null);
  const fetchGen = useRef(0);

  const loadInbox = useCallback(
    (opts?: { silent?: boolean }) => {
      if (!enabled) return;
      const silent = opts?.silent === true;
      const gen = ++fetchGen.current;
      if (!silent) {
        setOrdersLoading(true);
        setOrdersError(null);
      }
      getOrders({ limit: GUIDE_INBOX_ORDERS_LIMIT, business_line: "trip", hat: "guide" })
        .then((res) => {
          if (gen !== fetchGen.current) return;
          const items = (res.items ?? []) as OrderListItem[];
          const snapshot = buildGuideWorkbenchInboxSnapshot(items, guideRowId);
          setInbox(snapshot);
          const nextId = snapshot.nextOrder?.id;
          setNextOrderItem(
            nextId ? items.find((row) => String(row.id) === nextId) ?? null : null,
          );
          setOrdersError(null);
        })
        .catch((err) => {
          if (gen !== fetchGen.current) return;
          if (typeof window !== "undefined") {
            console.error("useGuideWorkbenchInbox getOrders:", err);
          }
          if (!silent) {
            setOrdersError(mapApiReadError(err, t, "guide_workbench_inbox_load_fail"));
          }
        })
        .finally(() => {
          if (gen !== fetchGen.current) return;
          if (!silent) setOrdersLoading(false);
        });
    },
    [enabled, guideRowId, t],
  );

  useEffect(() => {
    if (!enabled) {
      setInbox({ pendingAcceptCount: 0, todayPendingCount: 0, nextOrder: null });
      setNextOrderItem(null);
      setOrdersError(null);
      setOrdersLoading(false);
      return;
    }
    loadInbox();
  }, [enabled, loadInbox]);

  return {
    inbox,
    nextOrderItem,
    ordersLoading,
    ordersError,
    loadInbox,
    retryInbox: () => loadInbox(),
  };
}
