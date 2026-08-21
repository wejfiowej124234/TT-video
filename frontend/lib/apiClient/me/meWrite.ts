import { apiUrl, routes } from "../../api";
import { requestId, parseResponse, getAuthHeaders, writeRequestHeaders, logApiJsonStatusNotOk, throwUnlessApiOk } from "../core";

export async function getMeStats(): Promise<{ status: string; stats?: Record<string, unknown> }> {
  const res = await fetch(apiUrl(routes.meStats), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const parsed = await parseResponse(res);
  logApiJsonStatusNotOk("getMeStats", parsed);
  throwUnlessApiOk(parsed);
  return parsed as { status: string; stats?: Record<string, unknown> };
}

export async function putMe(body: {
  nickname?: string;
  avatar_url?: string;
  default_wallet_address?: string;
  /** 空字符串表示清空简介（与后端 `PUT /me` 一致） */
  bio?: string;
  /** ① 设置偏好（通知 / 社区可见性）；与 `meSettingsPreferencesApi` 对拍 */
  settings_preferences?: {
    notification: { emailDigest: boolean; push: boolean };
    communityVisibility: string;
    updatedAt: string;
  };
}): Promise<unknown> {
  const res = await fetch(apiUrl(routes.me), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("putMe", data);
  throwUnlessApiOk(data);
  return data;
}

export async function putMePassword(body: { old_password?: string; new_password?: string }): Promise<unknown> {
  const res = await fetch(apiUrl(routes.mePassword), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("putMePassword", data);
  throwUnlessApiOk(data);
  return data;
}

/** F-007 / 04：`POST …/me/profile-avatar`，body **`{ content_base64 }`**（`data:image/jpeg|png|webp;base64,…`）；**对象存储已配** 时后端返回 **`profile_avatar_use_presign_when_object_storage_configured`**。 */
export async function postMeProfileAvatar(body: { content_base64: string }): Promise<unknown> {
  const res = await fetch(apiUrl(routes.meProfileAvatar), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postMeProfileAvatar", data);
  throwUnlessApiOk(data);
  return data;
}

export type MeProfileAvatarPresignResponse = {
  status?: string;
  upload_url: string;
  avatar_url: string;
  headers?: Record<string, string>;
  expires_in_seconds?: number;
};

/** F-007 · `POST …/me/profile-avatar/presign`（对象存储已配时） */
export async function postMeProfileAvatarPresign(body: {
  content_type: string;
  content_length: number;
}): Promise<MeProfileAvatarPresignResponse> {
  const res = await fetch(apiUrl(routes.meProfileAvatarPresign), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postMeProfileAvatarPresign", data);
  throwUnlessApiOk(data);
  const row = data as MeProfileAvatarPresignResponse;
  if (!row?.upload_url || !row?.avatar_url) {
    throw new Error("profile_avatar_presign_incomplete");
  }
  return row;
}

/** F-007 · `POST …/me/profile-avatar/commit` */
export async function postMeProfileAvatarCommit(body: { avatar_url: string }): Promise<unknown> {
  const res = await fetch(apiUrl(routes.meProfileAvatarCommit), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postMeProfileAvatarCommit", data);
  throwUnlessApiOk(data);
  return data;
}
