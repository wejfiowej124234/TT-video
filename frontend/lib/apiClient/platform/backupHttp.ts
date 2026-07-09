import { apiUrl } from "../../api";
import { routes } from "@/lib/api/routes";
import { parseResponse, requestId, writeRequestHeaders, logApiJsonStatusNotOk } from "../core";

export type AdminPlatformBackupRunbook = {
  id: string;
  path: string;
};

export type AdminPlatformBackupStatusRes = {
  status?: string;
  error?: string;
  baseline?: Record<string, unknown>;
  baseline_file_found?: boolean;
  baseline_path_hint?: string;
  runbooks?: AdminPlatformBackupRunbook[];
  note?: string;
};

async function adminPlatformFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      ...writeRequestHeaders(),
      "x-request-id": requestId(),
      ...(init?.headers ?? {}),
    },
  });
  const data = (await parseResponse(res)) as T;
  logApiJsonStatusNotOk("adminPlatform", data as Record<string, unknown>);
  return data;
}

export async function getAdminPlatformBackupStatus(): Promise<AdminPlatformBackupStatusRes> {
  return adminPlatformFetch<AdminPlatformBackupStatusRes>(routes.adminPlatformBackupStatus);
}
