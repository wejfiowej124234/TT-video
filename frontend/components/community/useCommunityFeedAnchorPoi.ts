"use client";

import { useCallback, useEffect, useState } from "react";
import {
  COMMUNITY_FEED_ANCHOR_STORAGE_KEY,
  communityFeedDefaultAnchorPoiId,
  communityFeedParseAnchorPoiId,
  type CommunityFeedAnchorPoiId,
} from "./communityFeedAnchorPoi";
import type { CommunityFeedGeoCoords } from "./communityFeedProximity";

type DocumentWithFeaturePolicy = Document & {
  featurePolicy?: { allowsFeature: (feature: string) => boolean };
};

/** Prefer Permissions-Policy / Feature-Policy before calling getCurrentPosition. */
export async function communityFeedGeolocationAllowed(): Promise<boolean> {
  if (typeof document !== "undefined") {
    const fp = (document as DocumentWithFeaturePolicy).featurePolicy;
    if (fp?.allowsFeature && !fp.allowsFeature("geolocation")) return false;
  }
  if (typeof navigator !== "undefined" && navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });
      if (status.state === "denied") return false;
    } catch {
      /* Permissions API unavailable for geolocation */
    }
  }
  return true;
}

function requestGpsCoords(
  onSuccess: (coords: CommunityFeedGeoCoords) => void,
  onDone: () => void,
): void {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onSuccess(null);
    onDone();
    return;
  }
  void communityFeedGeolocationAllowed().then((allowed) => {
    if (!allowed) {
      onSuccess(null);
      onDone();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSuccess({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        onDone();
      },
      () => {
        onSuccess(null);
        onDone();
      },
      { enableHighAccuracy: false, maximumAge: 120_000, timeout: 8_000 },
    );
  });
}

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
    requestGpsCoords(setGpsCoords, () => setAnchorRevision((r) => r + 1));
  }, [hydrated, anchorPoiId]);

  const setAnchorPoiId = useCallback((id: CommunityFeedAnchorPoiId) => {
    setAnchorPoiIdState(id);
    try {
      localStorage.setItem(COMMUNITY_FEED_ANCHOR_STORAGE_KEY, id);
    } catch {
      /* noop */
    }
    if (id === "gps") {
      requestGpsCoords(setGpsCoords, () => setAnchorRevision((r) => r + 1));
    } else {
      setGpsCoords(null);
      setAnchorRevision((r) => r + 1);
    }
  }, []);

  return { anchorPoiId, setAnchorPoiId, gpsCoords, anchorRevision, anchorHydrated: hydrated };
}
