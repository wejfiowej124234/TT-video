"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import {
  adminConfirmPoiImageReview,
  adminConfirmPoiImageSelect,
  adminConfirmPoiImageWorkflow,
} from "@/lib/admin/adminOpsWriteConfirm";
import {
  getAdminContentPoiImageBatch,
  getAdminContentPoiImageCandidates,
  patchAdminContentPoiImageCandidate,
  postAdminContentPoiImageSelect,
  postAdminContentPoiImageWorkflow,
  type AdminPoiImageBatchRow,
  type AdminPoiImageCandidateRow,
} from "@/lib/apiClient";

export function useAdminContentPoiImageBatchPage() {
  const params = useParams<{ id: string }>();
  const batchId = params.id;
  const requestConfirm = useAdminL5ConfirmRequest();
  const [batch, setBatch] = useState<AdminPoiImageBatchRow | null>(null);
  const [candidates, setCandidates] = useState<AdminPoiImageCandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const [batchRes, candRes] = await Promise.all([
        getAdminContentPoiImageBatch(batchId),
        getAdminContentPoiImageCandidates(batchId),
      ]);
      setBatch(batchRes.item ?? null);
      setCandidates(candRes.items ?? []);
    } catch {
      setError("admin_content_poi_image_batch_load_failed");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const grouped = useMemo(() => {
    const map = new Map<string, AdminPoiImageCandidateRow[]>();
    for (const c of candidates) {
      const list = map.get(c.poi_id) ?? [];
      list.push(c);
      map.set(c.poi_id, list);
    }
    return Array.from(map.entries()).map(([poiId, rows]) => ({
      poiId,
      poiName: rows[0]?.poi_name_zh ?? poiId,
      rows: rows.sort((a, b) => a.rank - b.rank),
    }));
  }, [candidates]);

  const selectCandidate = useCallback(
    (poiId: string, candidateId: string) => {
      if (!batch) return;
      requestConfirm(
        adminConfirmPoiImageSelect(async () => {
          setActionError(null);
          try {
            await postAdminContentPoiImageSelect(batch.id, {
              version: batch.version,
              poi_id: poiId,
              candidate_id: candidateId,
            });
            await reload();
          } catch {
            setActionError("admin_content_poi_image_action_failed");
          }
        }),
      );
    },
    [batch, reload, requestConfirm],
  );

  const reviewCandidate = useCallback(
    (candidateId: string, review_status: "approved" | "rejected") => {
      if (!batch) return;
      requestConfirm(
        adminConfirmPoiImageReview(review_status, async () => {
          setActionError(null);
          try {
            await patchAdminContentPoiImageCandidate(batch.id, candidateId, { review_status });
            await reload();
          } catch {
            setActionError("admin_content_poi_image_action_failed");
          }
        }),
      );
    },
    [batch, reload, requestConfirm],
  );

  const runWorkflow = useCallback(
    (action: "submit-review" | "publish" | "request-publish") => {
      if (!batch) return;
      requestConfirm(
        adminConfirmPoiImageWorkflow(action, async () => {
          setActionError(null);
          try {
            await postAdminContentPoiImageWorkflow(batch.id, action, { version: batch.version });
            await reload();
          } catch {
            setActionError("admin_content_poi_image_action_failed");
          }
        }),
      );
    },
    [batch, reload, requestConfirm],
  );

  return {
    batch,
    grouped,
    loading,
    error,
    actionError,
    selectCandidate,
    reviewCandidate,
    runWorkflow,
  };
}
