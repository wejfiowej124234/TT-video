import { apiUrl } from "@/lib/api";
import { routes } from "@/lib/api/routes";
import { apiFetch, getAuthHeaders, logApiJsonStatusNotOk, parseResponse, requestId, throwUnlessApiOk } from "./core";

const fetch = apiFetch;

export type MeMerchantListingsSummary = {
  published_count?: number;
  draft_count?: number;
};

export async function getMeMerchantListingsSummary(): Promise<{
  summary?: MeMerchantListingsSummary | null;
}> {
  const res = await fetch(apiUrl(routes.meMerchantListingsSummary), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getMeMerchantListingsSummary", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data as { summary?: MeMerchantListingsSummary | null };
}
