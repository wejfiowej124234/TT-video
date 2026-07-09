"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchTraveltrustCmsAnnouncements,
  mergeTraveltrustAnnouncementsByLane,
  mergeTraveltrustPulseAnnouncements,
  type TravelTrustAnnouncementDisplay,
} from "@/lib/traveltrustCmsAnnouncements";
import type { TravelTrustAnnouncementLane } from "@/lib/traveltrustAnnouncementCatalog";
import {
  listTraveltrustAnnouncementsByLane,
  listTraveltrustPulseProductAnnouncements,
} from "@/lib/traveltrustNetworkAnnouncements";

export type TraveltrustAnnouncementsSource = "cms" | "static" | "hybrid";

export function useTraveltrustCmsAnnouncements(lane?: TravelTrustAnnouncementLane | "all") {
  const [cmsItems, setCmsItems] = useState<TravelTrustAnnouncementDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const fetched = await fetchTraveltrustCmsAnnouncements({
      lane: lane === "all" ? undefined : lane,
    });
    setCmsItems(fetched);
    setLoading(false);
  }, [lane]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { cmsItems, loading, reload };
}

export function useTraveltrustPulseAnnouncements() {
  const staticPulse = useMemo(() => listTraveltrustPulseProductAnnouncements(), []);
  const [items, setItems] = useState<TravelTrustAnnouncementDisplay[]>(staticPulse);
  const [source, setSource] = useState<TraveltrustAnnouncementsSource>("static");

  useEffect(() => {
    let cancelled = false;
    void fetchTraveltrustCmsAnnouncements({ pulse: true }).then((cms) => {
      if (cancelled) return;
      if (cms.length > 0) {
        setItems(mergeTraveltrustPulseAnnouncements(staticPulse, cms));
        setSource("cms");
      } else {
        setItems(staticPulse);
        setSource("static");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [staticPulse]);

  return { items, source };
}

export function useTraveltrustAnnouncementsPageData() {
  const { cmsItems, loading, reload } = useTraveltrustCmsAnnouncements("all");

  const productItems = mergeTraveltrustAnnouncementsByLane(
    listTraveltrustAnnouncementsByLane("product"),
    cmsItems,
    "product",
  );
  const governanceItems = mergeTraveltrustAnnouncementsByLane(
    listTraveltrustAnnouncementsByLane("governance"),
    cmsItems,
    "governance",
  );
  const protocolItems = mergeTraveltrustAnnouncementsByLane(
    listTraveltrustAnnouncementsByLane("protocol_status"),
    cmsItems,
    "protocol_status",
  );

  const cmsProductActive = cmsItems.some((i) => i.lane === "product");
  const cmsAnyLane = cmsItems.length > 0;
  const resolvedSource: TraveltrustAnnouncementsSource =
    !cmsAnyLane ? "static" : cmsProductActive ? "cms" : "hybrid";

  const allItems = [...productItems, ...governanceItems, ...protocolItems];

  return {
    loading,
    source: resolvedSource,
    reload,
    productItems,
    governanceItems,
    protocolItems,
    allItems,
  };
}

export type AnnouncementLaneFilter = "all" | TravelTrustAnnouncementLane;

export function filterAnnouncementsByChip(
  items: TravelTrustAnnouncementDisplay[],
  chip: AnnouncementLaneFilter,
): TravelTrustAnnouncementDisplay[] {
  if (chip === "all") return items;
  return items.filter((i) => i.lane === chip);
}
