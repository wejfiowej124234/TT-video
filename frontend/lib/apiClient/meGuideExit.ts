import { apiUrl } from "../api";
import { routes } from "@/lib/api/routes";
import type { GuideExitStatusPayload } from "@/lib/guide/guideExitRequest";
import {
  apiFetch,
  getAuthHeaders,
  logApiJsonStatusNotOk,
  parseResponse,
  requestId,
  throwUnlessApiOk,
} from "./core";

const fetch = apiFetch;

export type MeGuideExitStatusResponse = {
  status?: string;
  exit?: GuideExitStatusPayload;
};

/** 本地 API 进程未含本路由时（空 body 404）— 须重启 traveltrust-api */
export class GuideExitEndpointUnavailableError extends Error {
  constructor() {
    super("guide_exit_endpoint_unavailable");
    this.name = "GuideExitEndpointUnavailableError";
  }
}

async function parseMeGuideExitResponse(res: Response): Promise<MeGuideExitStatusResponse> {
  const text = await res.text();
  if (res.status === 404 && text.trim() === "") {
    throw new GuideExitEndpointUnavailableError();
  }
  if (!res.ok) {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = text.trim() ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      throw new Error(`请求失败 ${res.status}`);
    }
    if (res.status === 404 && parsed.error === "guide_profile_not_found") {
      throw new Error("guide_profile_not_found");
    }
    throw new Error(
      typeof parsed.message === "string"
        ? parsed.message
        : typeof parsed.error === "string"
          ? String(parsed.error)
          : `请求失败 ${res.status}`,
    );
  }
  const data = text.trim() ? (JSON.parse(text) as unknown) : {};
  logApiJsonStatusNotOk("getMeGuideExitStatus", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data as MeGuideExitStatusResponse;
}

export async function getMeGuideExitStatus(): Promise<MeGuideExitStatusResponse> {
  const res = await fetch(apiUrl(routes.meGuideExitStatus), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  return parseMeGuideExitResponse(res);
}

export async function postMeGuideExitRequest(body?: {
  reason?: string;
}): Promise<MeGuideExitStatusResponse> {
  const res = await fetch(apiUrl(routes.meGuideExitRequest), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId(),
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body ?? {}),
  });
  return parseMeGuideExitResponse(res);
}
