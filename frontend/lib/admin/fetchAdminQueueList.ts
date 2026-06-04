import {
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
  type AdminFetchErrorKind,
} from "@/lib/adminFetchDisplay";
import { apiUrl } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

export async function fetchAdminQueueList<T extends { items?: unknown[] }>(
  context: string,
  listUrl: string,
): Promise<{ items: T["items"]; errorKind: AdminFetchErrorKind | null }> {
  const headers: Record<string, string> = { "x-request-id": `${context}-${Date.now()}` };
  try {
    Object.assign(headers, getAuthHeaders());
  } catch {
    return { items: [], errorKind: "login_required" };
  }

  try {
    const { res, body } = await adminFetchJson<T>(context, apiUrl(listUrl), { headers });
    if (!res.ok) {
      throw new Error((body as { error?: string })?.error || `request_failed_${res.status}`);
    }
    const items = Array.isArray(body.items) ? body.items : [];
    return { items, errorKind: null };
  } catch (e) {
    logAdminFetch(context, e);
    return { items: [], errorKind: adminFetchErrorKind(e) };
  }
}
