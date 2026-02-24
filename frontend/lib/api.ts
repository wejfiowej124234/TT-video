/**
 * API 基地址与路由路径常量（与 04 §三、crates/api 一致）
 * 见 docs/合约-API-ABI-前后端对齐.md、docs/04-后端与API.md
 */

const BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")
    : "http://localhost:8080";

export const apiBase = BASE;

/** 健康与元数据 */
export const routes = {
  health: "/health",
  meta: "/meta",

  /** 认证 */
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    verifyEmail: "/auth/verify-email",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },

  /** 个人中心 */
  me: "/api/v1/me",
  meStats: "/api/v1/me/stats",
  mePassword: "/api/v1/me/password",

  /** 导游 */
  guides: "/api/v1/guides",
  guideById: (id: string) => `/api/v1/guides/${id}`,
  guideStake: (id: string) => `/api/v1/guides/${id}/stake`,

  /** 订单 */
  orders: "/api/v1/orders",
  orderById: (id: string) => `/api/v1/orders/${id}`,
  orderAccept: (id: string) => `/api/v1/orders/${id}/accept`,
  orderCancel: (id: string) => `/api/v1/orders/${id}/cancel`,
  orderConfirmCompletion: (id: string) =>
    `/api/v1/orders/${id}/confirm-completion`,
  orderReviews: (id: string) => `/api/v1/orders/${id}/reviews`,
  orderDispute: (id: string) => `/api/v1/orders/${id}/dispute`,
  orderEvidence: (id: string) => `/api/v1/orders/${id}/evidence`,

  /** 争议 */
  disputes: "/api/v1/disputes",
  disputeById: (id: string) => `/api/v1/disputes/${id}`,
  disputeResolve: (id: string) => `/api/v1/disputes/${id}/resolve`,
} as const;

/** 完整 URL（base + path） */
export function apiUrl(path: string): string {
  return `${BASE}${path}`;
}
