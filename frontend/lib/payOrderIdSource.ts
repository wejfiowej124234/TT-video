/**
 * `/pay` 订单 ID 单源规则（B-032 / TT）：
 * - 查询串 `orderId` 若为合法 UUID，**优先**作为拉单与跳转托管的唯一来源；
 * - 否则以输入框 trimmed 值为准；
 * - 输入框在合法 UUID 时应通过 `router.replace` 写回 query，避免 URL 与输入长期双源不一致。
 */
export const PAY_ORDER_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function effectivePayHubOrderId(fromQueryRaw: string, inputTrimmed: string): string {
  const q = fromQueryRaw.trim();
  if (PAY_ORDER_ID_UUID_RE.test(q)) return q;
  return inputTrimmed.trim();
}

/**
 * `/pay` 因 `login_required` 跳转登录时的 `returnUrl`（B-033）：
 * 在 `pathname` 与当前 query 基础上，若 `effectiveOrderId` 为合法 UUID 则 **set `orderId`**，
 * 保证与 B-032 的「有效订单 ID」一致，避免仅输入框已有 UUID、地址栏尚未 `replace` 时丢参。
 */
export function buildPayHubLoginReturnPath(
  pathname: string | null | undefined,
  currentSearchString: string,
  effectiveOrderId: string
): string {
  const base = pathname && pathname !== "/" ? pathname : "/pay";
  const params = new URLSearchParams(currentSearchString);
  if (PAY_ORDER_ID_UUID_RE.test(effectiveOrderId)) {
    params.set("orderId", effectiveOrderId);
  }
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}
