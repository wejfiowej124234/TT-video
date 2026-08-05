"use client";

import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  adminUserFacingErrorFromUnknown,
  type AdminFetchErrorKind,
} from "@/lib/adminFetchDisplay";
import {
  getAdminContentPublishQueue,
  postAdminContentPublishQueueItemWorkflow,
  type AdminContentPublishQueueItem,
} from "@/lib/apiClient";

/**
 * R030 — publish-queue write-error isolation (mirror countries R016/R020).
 * Shell loadError only; publish/workflow failures keep the list mounted (AdminAlertError).
 */
export function useAdminContentPublishQueuePage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<AdminContentPublishQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  /** Full-page / shell only — never set from publish workflow. */
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionErrorKind, setActionErrorKind] = useState<AdminFetchErrorKind | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const setActionErr = (kind: AdminFetchErrorKind, message: string) => {
    setActionErrorKind(kind);
    setActionError(message);
  };

  const clearActionErr = () => {
    setActionErrorKind(null);
    setActionError(null);
  };

  const captureActionErr = (e: unknown) => {
    const { kind, message } = adminUserFacingErrorFromUnknown(e, t);
    setActionErr(kind, message);
  };

  /** Soft reload: refresh rows without wiping shell or clearing successful list. */
  const softReload = useCallback(async () => {
    try {
      const res = await getAdminContentPublishQueue();
      setItems(res.items ?? []);
    } catch (e) {
      const { kind, message } = adminUserFacingErrorFromUnknown(e, t);
      setActionErr(kind, message);
    }
  }, [t]);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    clearActionErr();
    try {
      const res = await getAdminContentPublishQueue();
      setItems(res.items ?? []);
    } catch {
      setLoadError("admin_content_publish_queue_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function runPublish(item: AdminContentPublishQueueItem) {
    setBusyId(item.id);
    clearActionErr();
    try {
      await postAdminContentPublishQueueItemWorkflow(item.id, {
        action: "publish",
        version: item.version,
      });
      await softReload();
    } catch (e) {
      captureActionErr(e);
    } finally {
      setBusyId(null);
    }
  }

  return {
    items,
    loading,
    loadError,
    actionError,
    actionErrorKind,
    busyId,
    reload,
    runPublish,
  };
}
