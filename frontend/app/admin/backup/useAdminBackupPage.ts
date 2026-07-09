"use client";

import { useCallback, useEffect, useState } from "react";

import { getAdminPlatformBackupStatus, type AdminPlatformBackupStatusRes } from "@/lib/apiClient/platform/backupHttp";

export function useAdminBackupPage() {
  const [body, setBody] = useState<AdminPlatformBackupStatusRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminPlatformBackupStatus();
      if (res.status === "ok") {
        setBody(res);
      } else {
        setError(res.error ?? "admin_backup_load_failed");
      }
    } catch {
      setError("admin_backup_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { body, loading, error, reload };
}
