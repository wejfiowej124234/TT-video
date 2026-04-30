import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function apiBase(): string {
  const b = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://127.0.0.1:8080";
  return b.replace(/\/$/, "");
}

/** 仅转发注册/登录等写操作所需头；勿透传 Host/连接类 hop-by-hop。 */
const PASS_REQ_HEADERS = new Set([
  "accept",
  "accept-language",
  "content-type",
  "x-request-id",
  "authorization",
  "idempotency-key",
  "x-idempotency-key",
  "cookie",
]);

const DROP_RES_HEADERS = new Set(["content-encoding", "transfer-encoding", "connection"]);

/**
 * 历史：浏览器 POST 曾由 Next Route Handler（`app/auth/.../route.ts`）转发；与同路径 `page.tsx` 并存会导致 **GET 405**。
 * 现由 `lib/api.ts` **`apiUrl`** 将 loopback 浏览器下的 **`/auth/*`** 映射为 **`/api/auth-proxy/*`** + `next.config.js` rewrites。
 * 本模块保留供少数服务端场景复用转发逻辑。
 */
export async function proxyAuthPostToBackend(req: NextRequest, backendPath: string): Promise<Response> {
  const path = backendPath.startsWith("/") ? backendPath : `/${backendPath}`;
  const target = `${apiBase()}${path}`;
  const h = new Headers();
  for (const [k, v] of req.headers.entries()) {
    if (PASS_REQ_HEADERS.has(k.toLowerCase())) h.set(k, v);
  }
  const bodyBuf = await req.arrayBuffer();
  const res = await fetch(target, {
    method: "POST",
    headers: h,
    body: bodyBuf.byteLength ? bodyBuf : undefined,
    redirect: "manual",
  });
  const outHeaders = new Headers();
  res.headers.forEach((value, key) => {
    if (DROP_RES_HEADERS.has(key.toLowerCase())) return;
    if (key.toLowerCase() === "set-cookie") outHeaders.append(key, value);
    else outHeaders.set(key, value);
  });
  return new NextResponse(res.body, { status: res.status, statusText: res.statusText, headers: outHeaders });
}
