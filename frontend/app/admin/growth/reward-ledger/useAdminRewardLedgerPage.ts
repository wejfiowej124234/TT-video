"use client";



import { useCallback, useEffect, useState } from "react";



import {

  getAdminRewardLedger,

  getAdminRewardLedgerReconcile,

  postAdminRewardLedgerReconcileFix,

  patchAdminRewardLedgerFraud,

  type AdminGrowthLedgerRow,

  type GrowthReconcileRow,

} from "@/lib/apiClient";



export function useAdminRewardLedgerPage() {

  const [items, setItems] = useState<AdminGrowthLedgerRow[]>([]);

  const [driftItems, setDriftItems] = useState<GrowthReconcileRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [userIdFilter, setUserIdFilter] = useState("");

  const [sourceFilter, setSourceFilter] = useState("");

  const [fraudFilter, setFraudFilter] = useState("");

  const [busy, setBusy] = useState(false);



  const reload = useCallback(async () => {

    setLoading(true);

    setError(null);

    try {

      const [ledger, reconcile] = await Promise.all([

        getAdminRewardLedger({

          user_id: userIdFilter.trim() || undefined,

          source: sourceFilter.trim() || undefined,

          fraud_status: fraudFilter.trim() || undefined,

          limit: 100,

        }),

        getAdminRewardLedgerReconcile({ limit: 20 }),

      ]);

      setItems(ledger.items ?? []);

      setDriftItems(reconcile.items ?? []);

    } catch {

      setError("admin_growth_reward_ledger_load_failed");

    } finally {

      setLoading(false);

    }

  }, [userIdFilter, sourceFilter, fraudFilter]);



  useEffect(() => {

    void reload();

  }, [reload]);



  const fixDrift = useCallback(

    async (userId: string) => {

      setBusy(true);

      setError(null);

      try {

        await postAdminRewardLedgerReconcileFix(userId);

        await reload();

      } catch {

        setError("admin_growth_reward_ledger_fix_failed");

      } finally {

        setBusy(false);

      }

    },

    [reload],

  );



  const markSuspect = useCallback(

    async (ledgerId: string) => {

      setBusy(true);

      setError(null);

      try {

        await patchAdminRewardLedgerFraud(ledgerId, "suspect");

        await reload();

      } catch {

        setError("admin_growth_reward_ledger_mark_failed");

      } finally {

        setBusy(false);

      }

    },

    [reload],

  );



  return {

    items,

    driftItems,

    loading,

    error,

    busy,

    userIdFilter,

    setUserIdFilter,

    sourceFilter,

    setSourceFilter,

    fraudFilter,

    setFraudFilter,

    reload,

    fixDrift,

    markSuspect,

  };

}


