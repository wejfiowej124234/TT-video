"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { getMeAcquisitionProfile } from "@/lib/apiClient/meAcquisitionProfile";
import { getMeGuideProfile } from "@/lib/apiClient/meGuideProfile";
import { getMeMerchantProfile } from "@/lib/apiClient/meMerchantProfile";
import { getMeStewardProfile } from "@/lib/apiClient/meStewardProfile";
import type { MeIdentitySlotId, MeIdentitySlotState } from "@/lib/meIdentitySlots";
import { formatIdentitySlotBlockedReasonLabels } from "@/lib/me/identitySlotBlockedReasonsModel";

export type MeIdentityHubSurfaceId = "guide" | "provider" | "steward" | "acquisition";

export type MeIdentityHubBlockedReasonMap = Partial<Record<MeIdentityHubSurfaceId, string[]>>;

function slotIdForSurface(surfaceId: MeIdentityHubSurfaceId): MeIdentitySlotId {
  if (surfaceId === "provider") return "merchant";
  if (surfaceId === "steward") return "region_steward";
  return surfaceId;
}

function shouldProbeBlockedReasons(state: MeIdentitySlotState | null | undefined): boolean {
  return state === "active" || state === "restricted" || state === "pending";
}

type HubProfileBlockedProbe = {
  blockedReasons?: string[] | Record<string, boolean> | null;
  applicationStatus?: string | null;
};

async function fetchBlockedReasonsForSurface(
  surfaceId: MeIdentityHubSurfaceId,
): Promise<HubProfileBlockedProbe> {
  try {
    if (surfaceId === "guide") {
      const body = await getMeGuideProfile();
      const profile = body.profile;
      return {
        blockedReasons: profile?.blocked_reasons,
        applicationStatus: profile?.application_status ?? profile?.status ?? null,
      };
    }
    if (surfaceId === "provider") {
      const body = await getMeMerchantProfile();
      return {
        blockedReasons: body.profile?.blocked_reasons,
        applicationStatus: body.profile?.application_status ?? null,
      };
    }
    if (surfaceId === "steward") {
      const body = await getMeStewardProfile();
      return {
        blockedReasons: body.profile?.blocked_reasons,
        applicationStatus: body.profile?.application_status ?? null,
      };
    }
    const body = await getMeAcquisitionProfile();
    return {
      blockedReasons: body.profile?.blocked_reasons,
      applicationStatus: body.profile?.application_status ?? null,
    };
  } catch {
    return {};
  }
}

/** Hub P2-3: parallel profile probes for active/restricted/pending slots only. */
export function useMeIdentityHubBlockedReasons(
  slotsReady: boolean,
  slotById: (id: MeIdentitySlotId) => { state?: MeIdentitySlotState | null } | null,
) {
  const { t } = useTranslation();
  const [map, setMap] = useState<MeIdentityHubBlockedReasonMap>({});
  const [ready, setReady] = useState(false);
  const genRef = useRef(0);

  const run = useCallback(() => {
    const gen = ++genRef.current;
    if (!slotsReady) {
      setMap({});
      setReady(false);
      return;
    }

    const surfaces: MeIdentityHubSurfaceId[] = ["acquisition", "provider", "steward", "guide"];
    const toFetch = surfaces.filter((surfaceId) =>
      shouldProbeBlockedReasons(slotById(slotIdForSurface(surfaceId))?.state ?? null),
    );

    if (toFetch.length === 0) {
      setMap({});
      setReady(true);
      return;
    }

    void Promise.all(
      toFetch.map(async (surfaceId) => {
        const { blockedReasons, applicationStatus } = await fetchBlockedReasonsForSurface(surfaceId);
        const lines = formatIdentitySlotBlockedReasonLabels(blockedReasons, t, undefined, applicationStatus);
        return [surfaceId, lines] as const;
      }),
    ).then((entries) => {
      if (gen !== genRef.current) return;
      const next: MeIdentityHubBlockedReasonMap = {};
      for (const [surfaceId, lines] of entries) {
        if (lines.length > 0) next[surfaceId] = lines;
      }
      setMap(next);
      setReady(true);
    });
  }, [slotsReady, slotById, t]);

  useEffect(() => {
    run();
    const onProfile = () => run();
    window.addEventListener("traveltrust:profile-updated", onProfile);
    return () => window.removeEventListener("traveltrust:profile-updated", onProfile);
  }, [run]);

  return { blockedReasonBySurface: map, blockedReasonsReady: ready };
}
