"use client";

import { useCallback, useEffect, useState } from "react";
import { getMe } from "@/lib/apiClient";
import {
  adminActorLabelKey,
  adminActorRoleFromMe,
  isAdminActorRole,
} from "@/lib/admin/adminActorFromMe";
import { isAdminBusinessSuperAdminShortcut } from "@/lib/admin/adminBusinessSuperAdminShortcut";

export function useAdminShellActor() {
  const [role, setRole] = useState<string | null>(null);
  const [isBusinessSuperAdminShortcut, setIsBusinessSuperAdminShortcut] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    void getMe()
      .then((me) => {
        setRole(adminActorRoleFromMe(me));
        setIsBusinessSuperAdminShortcut(isAdminBusinessSuperAdminShortcut(me));
      })
      .catch(() => {
        setRole(null);
        setIsBusinessSuperAdminShortcut(false);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onAuth = () => load();
    window.addEventListener("traveltrust:auth-change", onAuth);
    return () => window.removeEventListener("traveltrust:auth-change", onAuth);
  }, [load]);

  return {
    role,
    loading,
    isAdmin: isAdminActorRole(role),
    roleLabelKey: adminActorLabelKey(role),
    isBusinessSuperAdminShortcut,
  };
}
