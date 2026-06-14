/**
 * PES Wave 4 · Unified Auth Return Flow
 * 统一 login/register returnUrl + pes_intent — 不改 postAuthReturnPath / API
 */
import { safeInternalReturnPath } from "@/lib/safeInternalReturnPath";

export const PES_AUTH_INTENT_PARAM = "pes_intent" as const;
export const PES_WAVE4_AUTH_FLOW_ID = "pes-wave4-auth-return-flow-v1" as const;

export type PesAuthIntent =
  | "register"
  | "order"
  | "post"
  | "identity"
  | "guide_recruit"
  | "merchant_onboard";

export type PesAuthMode = "login" | "register";

export function buildPesAuthHref(
  mode: PesAuthMode,
  returnPath: string,
  intent: PesAuthIntent,
  fallbackReturn = "/",
): string {
  const safe = safeInternalReturnPath(returnPath, fallbackReturn);
  const base = mode === "login" ? "/auth/login" : "/auth/register";
  const params = new URLSearchParams();
  params.set("returnUrl", safe);
  params.set(PES_AUTH_INTENT_PARAM, intent);
  return `${base}?${params.toString()}`;
}

/** 解析 URL 上的 PES 意图（登录页展示 / 分析用 · 可选） */
export function parsePesAuthIntent(searchParams: URLSearchParams | string): PesAuthIntent | null {
  const sp =
    typeof searchParams === "string" ? new URLSearchParams(searchParams) : searchParams;
  const raw = sp.get(PES_AUTH_INTENT_PARAM)?.trim();
  const allowed: PesAuthIntent[] = [
    "register",
    "order",
    "post",
    "identity",
    "guide_recruit",
    "merchant_onboard",
  ];
  return allowed.includes(raw as PesAuthIntent) ? (raw as PesAuthIntent) : null;
}
