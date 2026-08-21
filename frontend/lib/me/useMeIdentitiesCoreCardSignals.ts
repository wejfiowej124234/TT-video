"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMe,
  getMeProviderApplication,
  getMeStewardApplication,
  getMeRoleApplications,
  getOnboardingEntitlementsMe,
  canProbeAccountSession,
} from "@/lib/apiClient";
import { getProviderRegistrationServerDraft } from "@/lib/provider/providerRegisterServerDraft";
import type { MeIdentitySlotId, MeIdentitySlotState } from "@/lib/meIdentitySlots";
import {
  parseMeIdentitiesCoreCardSignals,
  type MeIdentitiesCoreCardSignals,
  type MeIdentitiesCoreSurface,
} from "@/lib/me/meIdentitiesCoreCardModel";

export type MeIdentitiesCoreCardBundle = {
  provider: MeIdentitiesCoreCardSignals;
  steward: MeIdentitiesCoreCardSignals;
};

const EMPTY_SIGNALS = (surface: MeIdentitiesCoreSurface): MeIdentitiesCoreCardSignals => ({
  surface,
  loggedIn: false,
  userRole: null,
  slotState: null,
  applicationStatus: null,
  hasRegistrationDraft: false,
  hasActivePaidEntitlement: false,
  hasPendingEntitlement: false,
});

function slotStateForSurface(
  surface: MeIdentitiesCoreSurface,
  slotById: (id: MeIdentitySlotId) => { state: MeIdentitySlotState } | null,
): MeIdentitySlotState | null {
  const id = surface === "provider" ? "merchant" : "region_steward";
  const row = slotById(id);
  if (!row || row.state === "inactive") return null;
  return row.state;
}

export function useMeIdentitiesCoreCardSignals(
  slotById: (id: MeIdentitySlotId) => { state: MeIdentitySlotState } | null,
  slotsReady: boolean,
) {
  const [bundle, setBundle] = useState<MeIdentitiesCoreCardBundle | null>(null);
  const [ready, setReady] = useState(false);
  const genRef = useRef(0);

  const run = useCallback(() => {
    const gen = ++genRef.current;
    if (typeof window === "undefined") return;

    const loggedIn = canProbeAccountSession();

    if (!loggedIn) {
      if (gen !== genRef.current) return;
      setBundle({
        provider: { ...EMPTY_SIGNALS("provider"), slotState: slotsReady ? slotStateForSurface("provider", slotById) : null },
        steward: { ...EMPTY_SIGNALS("steward"), slotState: slotsReady ? slotStateForSurface("steward", slotById) : null },
      });
      setReady(true);
      return;
    }

    void Promise.allSettled([
      getMe(),
      getMeProviderApplication(),
      getMeStewardApplication(),
      getMeRoleApplications(),
      getOnboardingEntitlementsMe(),
      getProviderRegistrationServerDraft(),
    ]).then((results) => {
      if (gen !== genRef.current) return;
      const mePayload = results[0].status === "fulfilled" ? results[0].value : null;
      const providerApp = results[1].status === "fulfilled" ? results[1].value : null;
      const stewardApp = results[2].status === "fulfilled" ? results[2].value : null;
      const roleApplications = results[3].status === "fulfilled" ? results[3].value : null;
      const entitlements = results[4].status === "fulfilled" ? results[4].value : null;
      const providerDraft =
        results[5].status === "fulfilled" ? results[5].value.draft : null;

      setBundle({
        provider: parseMeIdentitiesCoreCardSignals({
          surface: "provider",
          loggedIn: true,
          mePayload,
          slotState: slotsReady ? slotStateForSurface("provider", slotById) : null,
          providerApplicationRaw: providerApp,
          stewardApplicationRaw: null,
          entitlementsRaw: entitlements,
          providerRegistrationDraft: providerDraft,
          roleApplications,
        }),
        steward: parseMeIdentitiesCoreCardSignals({
          surface: "steward",
          loggedIn: true,
          mePayload,
          slotState: slotsReady ? slotStateForSurface("steward", slotById) : null,
          providerApplicationRaw: null,
          stewardApplicationRaw: stewardApp,
          entitlementsRaw: entitlements,
          providerRegistrationDraft: null,
          roleApplications,
        }),
      });
      setReady(true);
    });
  }, [slotById, slotsReady]);

  useEffect(() => {
    if (!slotsReady) return;
    run();
    const onProfile = () => run();
    window.addEventListener("traveltrust:profile-updated", onProfile);
    return () => window.removeEventListener("traveltrust:profile-updated", onProfile);
  }, [run, slotsReady]);

  return { bundle, ready: ready && slotsReady };
}
