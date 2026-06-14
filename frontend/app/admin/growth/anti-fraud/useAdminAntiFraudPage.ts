"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminGrowthFraudRules,
  getAdminGrowthFraudScanRuns,
  getAdminGrowthFraudSignals,
  getAdminGrowthFraudUsers,
  patchAdminGrowthFraudUser,
  type GrowthFraudScanRunRow,
  type GrowthFraudRuleRow,
  type GrowthFraudSignalRow,
  type GrowthFraudUserRow,
} from "@/lib/apiClient";

const FRAUD_STATUSES = ["normal", "points_frozen", "airdrop_ineligible", "banned"] as const;

export function useAdminAntiFraudPage() {
  const [rules, setRules] = useState<GrowthFraudRuleRow[]>([]);
  const [signals, setSignals] = useState<GrowthFraudSignalRow[]>([]);
  const [scanRuns, setScanRuns] = useState<GrowthFraudScanRunRow[]>([]);
  const [users, setUsers] = useState<GrowthFraudUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rulesRes, signalsRes, scanRunsRes, usersRes] = await Promise.all([
        getAdminGrowthFraudRules(),
        getAdminGrowthFraudSignals({ limit: 50 }),
        getAdminGrowthFraudScanRuns({ limit: 50 }),
        getAdminGrowthFraudUsers({
          fraud_status: statusFilter.trim() || undefined,
          limit: 50,
        }),
      ]);
      setRules(rulesRes.items ?? []);
      setSignals(signalsRes.items ?? []);
      setScanRuns(scanRunsRes.items ?? []);
      setUsers(usersRes.items ?? []);
    } catch {
      setError("admin_growth_anti_fraud_load_failed");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setUserStatus = useCallback(
    async (userId: string, growth_fraud_status: string, disableReferralCodes = false) => {
      setBusyUserId(userId);
      setError(null);
      try {
        await patchAdminGrowthFraudUser(userId, {
          growth_fraud_status,
          disable_referral_codes: disableReferralCodes,
        });
        await reload();
      } catch {
        setError("admin_growth_anti_fraud_patch_failed");
      } finally {
        setBusyUserId(null);
      }
    },
    [reload],
  );

  return {
    rules,
    signals,
    scanRuns,
    users,
    loading,
    error,
    busyUserId,
    statusFilter,
    setStatusFilter,
    reload,
    setUserStatus,
    fraudStatuses: FRAUD_STATUSES,
  };
}
