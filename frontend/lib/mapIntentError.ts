import { mapOrderWriteError } from "./mapOrderWriteError";
import { requestFailedHttpUserText } from "./requestFailedHttp";

/** 与 `formatCommunityApiMessage` 一致：用于 `mapOrderWriteError` 未命中判定，勿作用户可见主文案。 */
const CHAIN_OFF_LOOKUP_MISS = "zzzz_internal_chain_off_lookup_miss";

/** 与 `formatCommunityApiMessage` 对含空格 `message` 的归一化一致（兼容旧响应与其它路由）。 */
function normalizeChainOffErrorMessage(raw: string): string {
  const c = raw.trim();
  if (!c) return c;
  if (/\s/.test(c)) return c.replace(/\s+/g, "_").toLowerCase();
  return c;
}

/**
 * 将托管意向 / EIP-712 签名链路的典型错误映射为可展示文案（订单确认完成、争议、执行裁决等共用）。
 */
export function mapIntentError(
  e: unknown,
  t: (key: string) => string,
  opts?: { fallbackKey?: string }
): string {
  const code = e instanceof Error ? e.message : "";
  const fb = opts?.fallbackKey ?? "escrow_requestFailed";
  {
    const httpText = requestFailedHttpUserText(code, t);
    if (httpText != null) return httpText;
  }
  if (code === "wallet_required") return t("escrow_intentConnectWallet");
  if (code === "outbox_persist_failed") return t("escrow_intentOutboxFailed");
  if (/User rejected|user rejected|denied|4001/i.test(code)) return t("escrow_intentRejected");
  if (code === "order_db_persist_failed") return t("escrow_orderDbUnavailable");
  if (code === "rate_limit_exceeded") return t("common_apiRateLimitExceeded");
  if (code === "rate_limit_unavailable") return t("common_apiRateLimitUnavailable");
  if (code === "critical_write_rate_limit_exceeded") return t("common_apiCriticalWriteRateLimit");
  if (code === "evidence_rate_limit_exceeded") return t("common_apiEvidenceRateLimit");
  if (code === "review_rate_limit_exceeded") return t("escrow_reviewRateLimited");
  if (
    /allowance|ERC20InsufficientAllowance|insufficient allowance|exceeds allowance|transfer amount exceeds allowance|Please approve|need more allowance/i.test(
      code
    )
  ) {
    return t("escrow_allowanceHint");
  }

  const normalized = normalizeChainOffErrorMessage(code);
  const chainOffErr =
    normalized === code && e instanceof Error ? e : new Error(normalized);
  const chainOff = mapOrderWriteError(chainOffErr, t, { fallbackKey: CHAIN_OFF_LOOKUP_MISS });
  if (chainOff !== t(CHAIN_OFF_LOOKUP_MISS)) return chainOff;

  if (typeof window !== "undefined" && e instanceof Error && code) {
    console.error("mapIntentError unmapped:", code, e);
  }
  return t(fb);
}
