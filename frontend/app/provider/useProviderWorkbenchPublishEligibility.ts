"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchMerchantPublishEligibility,
  type MerchantPublishEligibility,
} from "@/lib/provider/merchantPublishEligibility";

const IDLE: MerchantPublishEligibility = {
  ok: false,
  roleOk: false,
  applicationOk: false,
  entitlementPaidOk: false,
  sessionOk: false,
  userRole: null,
  applicationStatus: null,
};

export function useProviderWorkbenchPublishEligibility(enabled: boolean) {
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState<MerchantPublishEligibility>(IDLE);

  const load = useCallback(async () => {
    if (!enabled) {
      setEligibility(IDLE);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setEligibility(await fetchMerchantPublishEligibility());
    } catch {
      setEligibility(IDLE);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { eligibility, loading, retry: load };
}
