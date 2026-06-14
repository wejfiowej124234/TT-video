"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteMarketAcquisitionListingDraft,
  getMeAcquisitionListings,
  postMarketAcquisitionListingArchive,
} from "@/lib/apiClient/meAcquisitionListings";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  mapMerchantWorkbenchShowcaseRows,
  type MerchantWorkbenchShowcaseRow,
} from "@/lib/provider/providerWorkbenchListingsModel";

function isAcquisitionListingsDegradedError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  return (
    e.message === "not_implemented" ||
    e.message === "request_failed_404" ||
    e.message === "user_not_found"
  );
}
export function usePublishHubAcquisitionListings(
  enabled: boolean,
  t: (key: string) => string,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<MerchantWorkbenchShowcaseRow[]>([]);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setRows([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await getMeAcquisitionListings();
      setRows(
        mapMerchantWorkbenchShowcaseRows({
          published: body.published ?? [],
          drafts: body.drafts ?? [],
          untitledKey: t("publish_hub_acquisition_untitled"),
        }),
      );
    } catch (e) {
      setRows([]);
      if (isAcquisitionListingsDegradedError(e)) {
        setError(null);
      } else {
        setError(mapApiReadError(e, t, "publish_hub_acquisition_listings_load_fail"));
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const archivePublished = useCallback(
    async (listingId: string) => {
      setMutatingId(listingId);
      setError(null);
      try {
        await postMarketAcquisitionListingArchive(listingId);
        await load();
      } catch (e) {
        setError(mapApiReadError(e, t, "publish_hub_acquisition_listings_archive_fail"));
      } finally {
        setMutatingId(null);
      }
    },
    [load, t],
  );

  const deleteDraft = useCallback(
    async (draftId: string) => {
      setMutatingId(draftId);
      setError(null);
      try {
        await deleteMarketAcquisitionListingDraft(draftId);
        await load();
      } catch (e) {
        setError(mapApiReadError(e, t, "publish_hub_acquisition_listings_delete_draft_fail"));
      } finally {
        setMutatingId(null);
      }
    },
    [load, t],
  );

  return {
    rows,
    loading,
    error,
    mutatingId,
    retry: load,
    archivePublished,
    deleteDraft,
  };
}
