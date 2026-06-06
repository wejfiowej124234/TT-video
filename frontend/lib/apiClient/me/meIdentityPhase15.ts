/**
 * ①.5 Identity · Wallet · role_applications（04 §3.4 · identity-unified-model §6）
 */

import { apiUrl, routes } from "../../api";
import {
  getAuthHeaders,
  logApiJsonStatusNotOk,
  parseResponse,
  requestId,
  throwUnlessApiOk,
} from "../core";
import {
  parseMeRoleApplicationsResponse,
  type MeRoleApplicationRow,
} from "../../me/roleApplications";

export type MeWalletRow = {
  id: string;
  address: string;
  label: string | null;
  is_primary: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

function parseMeWalletsResponse(raw: unknown): MeWalletRow[] {
  if (raw == null || typeof raw !== "object") return [];
  const wallets = (raw as { wallets?: unknown }).wallets;
  if (!Array.isArray(wallets)) return [];
  const out: MeWalletRow[] = [];
  for (const row of wallets) {
    if (row == null || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const address = typeof o.address === "string" ? o.address.trim() : "";
    if (!id || !address) continue;
    out.push({
      id,
      address,
      label: typeof o.label === "string" ? o.label : null,
      is_primary: o.is_primary === true,
      verified_at: typeof o.verified_at === "string" ? o.verified_at : null,
      created_at: typeof o.created_at === "string" ? o.created_at : "",
      updated_at: typeof o.updated_at === "string" ? o.updated_at : "",
    });
  }
  return out;
}

export async function getMeWallets(): Promise<MeWalletRow[]> {
  const auth = getAuthHeaders();
  const res = await fetch(apiUrl(routes.meWallets), {
    headers: { "x-request-id": requestId(), ...auth },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getMeWallets", data);
  throwUnlessApiOk(data);
  return parseMeWalletsResponse(data);
}

export async function getMeRoleApplications(): Promise<MeRoleApplicationRow[]> {
  const auth = getAuthHeaders();
  const res = await fetch(apiUrl(routes.meRoleApplications), {
    headers: { "x-request-id": requestId(), ...auth },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getMeRoleApplications", data);
  throwUnlessApiOk(data);
  return parseMeRoleApplicationsResponse(data);
}
