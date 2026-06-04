"use client";

import { useCallback, useEffect, useState } from "react";
import { getMe } from "@/lib/apiClient";
import { adminActorLabelKey, adminActorRoleFromMe, isAdminActorRole } from "@/lib/admin/adminActorFromMe";

export function useAdminShellActor() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    void getMe()
      .then((me) => setRole(adminActorRoleFromMe(me)))
      .catch(() => setRole(null))
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
  };
}
