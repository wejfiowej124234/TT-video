"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminReferralCodes,
  patchAdminReferralCode,
  postAdminReferralCode,
  type AdminReferralCodeRow,
} from "@/lib/apiClient";
import { mapAdminGrowthLoadError } from "@/lib/admin/mapAdminGrowthLoadError";

const CODE_TYPES = ["kol", "guide", "merchant", "region_operator", "user"] as const;

export function useAdminReferralCodesPage() {
  const [items, setItems] = useState<AdminReferralCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listFailed, setListFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ownerUserId, setOwnerUserId] = useState("");
  const [codeType, setCodeType] = useState<(typeof CODE_TYPES)[number]>("kol");
  const [customCode, setCustomCode] = useState("");
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminReferralCodes();
      setItems(res.items ?? []);
      setListFailed(false);
    } catch (e) {
      setItems([]);
      setListFailed(true);
      setError(mapAdminGrowthLoadError(e, "admin_growth_referral_codes_load_failed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function createReferralCode() {
    const owner = ownerUserId.trim();
    if (!owner || listFailed) return;
    setBusy(true);
    setError(null);
    try {
      await postAdminReferralCode({
        owner_user_id: owner,
        code_type: codeType,
        code: customCode.trim() || undefined,
        label: label.trim() || undefined,
        max_uses: maxUses.trim() ? Number(maxUses) : undefined,
      });
      setCustomCode("");
      setLabel("");
      setMaxUses("");
      await reload();
    } catch (e) {
      setError(mapAdminGrowthLoadError(e, "admin_growth_referral_codes_create_failed"));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(row: AdminReferralCodeRow) {
    if (listFailed) return;
    setBusy(true);
    setError(null);
    try {
      await patchAdminReferralCode(row.id, { is_active: !row.is_active });
      await reload();
    } catch (e) {
      setError(mapAdminGrowthLoadError(e, "admin_growth_referral_codes_patch_failed"));
    } finally {
      setBusy(false);
    }
  }

  return {
    items,
    loading,
    error,
    listFailed,
    writesDisabled: listFailed || loading,
    busy,
    ownerUserId,
    setOwnerUserId,
    codeType,
    setCodeType,
    customCode,
    setCustomCode,
    label,
    setLabel,
    maxUses,
    setMaxUses,
    createReferralCode,
    toggleActive,
    reload,
    codeTypes: CODE_TYPES,
  };
}
