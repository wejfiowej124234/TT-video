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

export type MeAcquisitionListingPublished = {
  id: string;
  title?: string;
  status?: string;
  updated_at?: string;
  cover_url?: string | null;
};

export type MeAcquisitionListingDraft = {
  id: string;
  title?: string;
  saved_at?: string;
  cover_url?: string | null;
};

export type MeAcquisitionListingsPayload = {
  published?: MeAcquisitionListingPublished[];
  drafts?: MeAcquisitionListingDraft[];
};

export async function getMeAcquisitionListings(): Promise<MeAcquisitionListingsPayload> {
  const res = await fetch(apiUrl(routes.meAcquisitionListings), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getMeAcquisitionListings", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data as MeAcquisitionListingsPayload;
}

export async function postMarketAcquisitionListingArchive(listingId: string): Promise<void> {
  const res = await fetch(apiUrl(routes.marketAcquisitionListingArchive(listingId)), {
    method: "POST",
    headers: { ...writeRequestHeaders() },
    body: JSON.stringify({}),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postMarketAcquisitionListingArchive", data as Record<string, unknown>);
  throwUnlessApiOk(data);
}

export async function deleteMarketAcquisitionListingDraft(draftId: string): Promise<void> {
  const res = await fetch(apiUrl(routes.marketAcquisitionListingDraftById(draftId)), {
    method: "DELETE",
    headers: { ...writeRequestHeaders() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("deleteMarketAcquisitionListingDraft", data as Record<string, unknown>);
  throwUnlessApiOk(data);
}
