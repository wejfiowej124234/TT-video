import { apiUrl, routes } from "./api";

/**
 * 浏览器可复制的 **`GET /health`** 完整 URL（与 `next.config.js` rewrites、`apiUrl` 同源）。
 * 供排障、客服对时戳或与监控探针对齐；**不含**会话令牌。
 */
export function publicApiHealthCheckUrl(): string {
  return apiUrl(routes.health);
}
