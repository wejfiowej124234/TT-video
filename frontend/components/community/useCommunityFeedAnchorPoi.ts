"use client";

import { useCallback, useEffect, useState } from "react";
import {
  COMMUNITY_FEED_ANCHOR_STORAGE_KEY,
  communityFeedDefaultAnchorPoiId,
  communityFeedParseAnchorPoiId,
  type CommunityFeedAnchorPoiId,
} from "./communityFeedAnchorPoi";
import type { CommunityFeedGeoCoords } from "./communityFeedProximity";

/** ① localStorage + GPS · 附近锚点（美团式「丽枫酒店」下拉） */
export function useCommunityFeedAnchorPoi() {
  const [anchorPoiId, setAnchorPoiIdState] = useState<CommunityFeedAnchorPoiId>(
    communityFeedDefaultAnchorPoiId(),
  );
  const [gpsCoords, setGpsCoords] = useState<CommunityFeedGeoCoords>(null);
  const [anchorRevision, setAnchorRevision] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMMUNITY_FEED_ANCHOR_STORAGE_KEY);
      if (stored) setAnchorPoiIdState(communityFeedParseAnchorPoiId(stored));
    } catch {
      /* noop · private mode */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || anchorPoiId !== "gps") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAnchorRevision((r) => r + 1);
      },
      () => setGpsCoords(null),
      { enableHighAccuracy: false, maximumAge: 120_000, timeout: 8_000 },
    );
  }, [hydrated, anchorPoiId]);

  const setAnchorPoiId = useCallback((id: CommunityFeedAnchorPoiId) => {
    setAnchorPoiIdState(id);
    try {
      localStorage.setItem(COMMUNITY_FEED_ANCHOR_STORAGE_KEY, id);
    } catch {
      /* noop */
    }
    if (id === "gps" && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setAnchorRevision((r) => r + 1);
        },
        () => {
          setGpsCoords(null);
          setAnchorRevision((r) => r + 1);
        },
        { enableHighAccuracy: false, maximumAge: 120_000, timeout: 8_000 },
      );
    } else {
      setGpsCoords(null);
      setAnchorRevision((r) => r + 1);
    }
  }, []);

  return { anchorPoiId, setAnchorPoiId, gpsCoords, anchorRevision, anchorHydrated: hydrated };
};
