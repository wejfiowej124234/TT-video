"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAdminReferralCodes,
  patchAdminReferralCode,
  postAdminReferralCode,
  type AdminReferralCodeRow,
} from "@/lib/apiClient";

const CODE_TYPES = ["kol", "guide", "merchant", "region_operator", "user"] as const;

export function useAdminReferralCodesPage() {
  const [items, setItems] = useState<AdminReferralCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    } catch {
      setError("admin_growth_referral_codes_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const owner = ownerUserId.trim();
    if (!owner) return;
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
    } catch {
      setError("admin_growth_referral_codes_create_failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(row: AdminReferralCodeRow) {
    setBusy(true);
    setError(null);
    try {
      await patchAdminReferralCode(row.id, { is_active: !row.is_active });
      await reload();
    } catch {
      setError("admin_growth_referral_codes_patch_failed");
    } finally {
      setBusy(false);
    }
  }

  return {
    items,
    loading,
    error,
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
    handleCreate,
    toggleActive,
    reload,
    codeTypes: CODE_TYPES,
  };
}
