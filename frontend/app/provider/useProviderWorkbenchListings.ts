"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteMarketProviderListingDraft,
  getMeMerchantListings,
  postMarketProviderListingArchive,
} from "@/lib/apiClient/meMerchantListings";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  mapMerchantWorkbenchShowcaseRows,
  type MerchantWorkbenchShowcaseRow,
} from "@/lib/provider/providerWorkbenchListingsModel";

export function useProviderWorkbenchListings(
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
      const body = await getMeMerchantListings();
      setRows(
        mapMerchantWorkbenchShowcaseRows({
          published: body.published ?? [],
          drafts: body.drafts ?? [],
          untitledKey: t("provider_workbench_showcase_untitled"),
        }),
      );
    } catch (e) {
      setRows([]);
      setError(mapApiReadError(e, t, "provider_workbench_listings_load_fail"));
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
        await postMarketProviderListingArchive(listingId);
        await load();
      } catch (e) {
        setError(mapApiReadError(e, t, "provider_workbench_listings_archive_fail"));
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
        await deleteMarketProviderListingDraft(draftId);
        await load();
      } catch (e) {
        setError(mapApiReadError(e, t, "provider_workbench_listings_delete_draft_fail"));
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
