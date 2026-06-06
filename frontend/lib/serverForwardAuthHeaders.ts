import { cookies } from "next/headers";

const USER_ID_COOKIE = "traveltrust_user_id";

/** Next.js RSC：将登录 cookie 转发为 API 联调头（`X-User-Id`），供 SSR 榜行 `is_me` 等。 */
export async function serverForwardAuthHeaders(): Promise<Record<string, string>> {
  const jar = await cookies();
  const raw = jar.get(USER_ID_COOKIE)?.value?.trim();
  if (!raw) return {};
  try {
    return { "X-User-Id": decodeURIComponent(raw) };
  } catch {
    return { "X-User-Id": raw };
  }
}
