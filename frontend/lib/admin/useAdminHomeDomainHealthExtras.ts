"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ADMIN_AUTH_SESSION_RESET_EVENT } from "@/lib/admin/adminAuthSessionReset";
import { ADMIN_DATA_MUTATED_EVENT } from "@/lib/admin/adminPostWriteCacheInvalidation";
import {
  resolveAdminHomeTreasuryPoolsSnapshot,
  type AdminHomeTreasuryPoolsSnapshot,
} from "@/lib/admin/adminHomeTreasuryPools";
import {
  fetchAdminHomeDomainHealthExtrasBundle,
  invalidateAdminHomeDomainHealthExtrasBundle,
} from "@/lib/admin/fetchAdminHomeDomainHealthExtrasBundle";
import { useAdminHomeSoftRevalidate } from "@/lib/admin/useAdminHomeSoftRevalidate";

export type AdminHomeDomainHealthExtras = {
  contentQueueCount: number | null;
  contentQueueLoading: boolean;
  officialQueueCount: number | null;
  officialQueueLoading: boolean;
  communityReportsCount: number | null;
  communityReportsLoading: boolean;
  treasurySource: "not_deployed" | "chain" | "projection";
  treasuryEventTotal: number | null;
  treasuryLoading: boolean;
  treasurySnapshot: AdminHomeTreasuryPoolsSnapshot;
  growthRegistrations: number | null;
  growthReferrals: number | null;
  growthFrozen: number | null;
  growthLoading: boolean;
  governorAddress: string | null;
  governanceLive: boolean;
  governanceLoading: boolean;
};

const EMPTY_TREASURY = resolveAdminHomeTreasuryPoolsSnapshot();

/**
 * Workbench domain-health extras · one cached Promise.all (30s).
 * Community / content / governance lamps read these snapshots — 0 pending = real green.
 */
export function useAdminHomeDomainHealthExtras(): AdminHomeDomainHealthExtras {
  const [bundleLoading, setBundleLoading] = useState(true);
  const [contentQueueCount, setContentQueueCount] = useState<number | null>(null);
  const [officialQueueCount, setOfficialQueueCount] = useState<number | null>(null);
  const [communityReportsCount, setCommunityReportsCount] = useState<number | null>(null);
  const [treasurySnapshot, setTreasurySnapshot] =
    useState<AdminHomeTreasuryPoolsSnapshot>(EMPTY_TREASURY);
  const [growthRegistrations, setGrowthRegistrations] = useState<number | null>(null);
  const [growthReferrals, setGrowthReferrals] = useState<number | null>(null);
  const [growthFrozen, setGrowthFrozen] = useState<number | null>(null);
  const [governorAddress, setGovernorAddress] = useState<string | null>(null);
  const [governanceLive, setGovernanceLive] = useState(false);
  const loadRef = useRef<() => void>(() => {});

  const load = useCallback((force = false) => {
    let cancelled = false;
    void (async () => {
      if (force) invalidateAdminHomeDomainHealthExtrasBundle();
      setBundleLoading(true);
      try {
        const bundle = await fetchAdminHomeDomainHealthExtrasBundle();
        if (cancelled) return;
        setCommunityReportsCount(bundle.communityReportsCount);
        setContentQueueCount(bundle.contentQueueCount);
        setOfficialQueueCount(bundle.officialQueueCount);
        setGrowthRegistrations(bundle.growthRegistrations);
        setGrowthReferrals(bundle.growthReferrals);
        setGrowthFrozen(bundle.growthFrozen);
        setGovernorAddress(bundle.governorAddress);
        setGovernanceLive(bundle.governanceLive);
        setTreasurySnapshot(bundle.treasurySnapshot);
      } catch {
        if (!cancelled) setTreasurySnapshot(EMPTY_TREASURY);
      } finally {
        if (!cancelled) setBundleLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  loadRef.current = () => {
    load(true);
  };

  // HU-463
  useAdminHomeSoftRevalidate(() => loadRef.current());

  useEffect(() => {
    const cancel = load(false);
    return cancel;
  }, [load]);

  useEffect(() => {
    const onRefresh = () => load(true);
    window.addEventListener(ADMIN_AUTH_SESSION_RESET_EVENT, onRefresh);
    window.addEventListener(ADMIN_DATA_MUTATED_EVENT, onRefresh);
    return () => {
      window.removeEventListener(ADMIN_AUTH_SESSION_RESET_EVENT, onRefresh);
      window.removeEventListener(ADMIN_DATA_MUTATED_EVENT, onRefresh);
    };
  }, [load]);

  return {
    contentQueueCount,
    contentQueueLoading: bundleLoading,
    officialQueueCount,
    officialQueueLoading: bundleLoading,
    communityReportsCount,
    communityReportsLoading: bundleLoading,
    treasurySource: treasurySnapshot.source,
    treasuryEventTotal: treasurySnapshot.facts?.feeRouterEventTotal ?? null,
    treasuryLoading: bundleLoading,
    treasurySnapshot,
    growthRegistrations,
    growthReferrals,
    growthFrozen,
    growthLoading: bundleLoading,
    governorAddress,
    governanceLive,
    governanceLoading: bundleLoading,
  };
}
