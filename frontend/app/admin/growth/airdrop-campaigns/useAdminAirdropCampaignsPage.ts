"use client";

import { useCallback, useEffect, useState } from "react";

import {
  downloadAirdropExportCsv,
  getAdminAirdropCampaigns,
  getAdminAirdropExport,
  getAdminAirdropReconcile,
  postAdminAirdropCalculate,
  postAdminAirdropCampaign,
  postAdminAirdropRecalculate,
  postAdminAirdropSnapshot,
  type AirdropCampaignRow,
  type AirdropReconcileSummary,
} from "@/lib/apiClient";

export function useAdminAirdropCampaignsPage() {
  const [campaigns, setCampaigns] = useState<AirdropCampaignRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [reconcile, setReconcile] = useState<AirdropReconcileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exportInProgress, setExportInProgress] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPool, setNewPool] = useState("10000000");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminAirdropCampaigns();
      setCampaigns(res.items ?? []);
    } catch {
      setError("admin_growth_airdrop_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReconcile = useCallback(async (id: string) => {
    if (!id) {
      setReconcile(null);
      return;
    }
    try {
      const res = await getAdminAirdropReconcile(id);
      setReconcile(res.summary ?? null);
    } catch {
      setReconcile(null);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    void loadReconcile(selectedId);
  }, [selectedId, loadReconcile, campaigns]);

  const createCampaign = useCallback(async () => {
    const pool = Number(newPool);
    if (!newName.trim() || !Number.isFinite(pool) || pool <= 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await postAdminAirdropCampaign({ name: newName.trim(), gov_pool_amount: pool });
      if (res.item?.id) setSelectedId(res.item.id);
      setNewName("");
      await reload();
    } catch {
      setError("admin_growth_airdrop_create_failed");
    } finally {
      setBusy(false);
    }
  }, [newName, newPool, reload]);

  const runAction = useCallback(
    async (action: "snapshot" | "calculate" | "recalculate" | "export") => {
      if (!selectedId) return;
      setBusy(true);
      setError(null);
      try {
        if (action === "snapshot") await postAdminAirdropSnapshot(selectedId);
        else if (action === "calculate") await postAdminAirdropCalculate(selectedId);
        else if (action === "recalculate") await postAdminAirdropRecalculate(selectedId);
        else if (action === "export") {
          setExportInProgress(true);
          try {
            const res = await getAdminAirdropExport(selectedId);
            downloadAirdropExportCsv(selectedId, res.items ?? []);
          } finally {
            setExportInProgress(false);
          }
        }
        await reload();
        await loadReconcile(selectedId);
      } catch {
        setError(`admin_growth_airdrop_${action}_failed`);
      } finally {
        setBusy(false);
      }
    },
    [selectedId, reload, loadReconcile],
  );

  const selected = campaigns.find((c) => c.id === selectedId) ?? null;

  return {
    campaigns,
    selected,
    selectedId,
    setSelectedId,
    reconcile,
    loading,
    error,
    busy,
    exportInProgress,
    newName,
    setNewName,
    newPool,
    setNewPool,
    reload,
    createCampaign,
    runAction,
  };
}
