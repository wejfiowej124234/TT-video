import { apiUrl } from "@/lib/api";
import { routes } from "@/lib/api/routes";
import {
  apiFetch,
  getAuthHeaders,
  logApiJsonStatusNotOk,
  parseResponse,
  requestId,
  throwUnlessApiOk,
  writeRequestHeaders,
} from "./core";

const fetch = apiFetch;

export type MeMerchantListingPublished = {
  id: string;
  title?: string;
  status?: string;
  updated_at?: string;
  cover_url?: string | null;
};

export type MeMerchantListingDraft = {
  id: string;
  title?: string;
  saved_at?: string;
  cover_url?: string | null;
};

export type MeMerchantListingsPayload = {
  published?: MeMerchantListingPublished[];
  drafts?: MeMerchantListingDraft[];
};

export async function getMeMerchantListings(): Promise<MeMerchantListingsPayload> {
  const res = await fetch(apiUrl(routes.meMerchantListings), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getMeMerchantListings", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data as MeMerchantListingsPayload;
}

export async function postMarketProviderListingArchive(listingId: string): Promise<void> {
  const res = await fetch(apiUrl(routes.marketProviderListingArchive(listingId)), {
    method: "POST",
    headers: { ...writeRequestHeaders() },
    body: JSON.stringify({}),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postMarketProviderListingArchive", data as Record<string, unknown>);
  throwUnlessApiOk(data);
}

export async function deleteMarketProviderListingDraft(draftId: string): Promise<void> {
  const res = await fetch(apiUrl(routes.marketProviderListingDraftById(draftId)), {
    method: "DELETE",
    headers: { ...writeRequestHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("deleteMarketProviderListingDraft", data as Record<string, unknown>);
  throwUnlessApiOk(data);
}
