import { isComplianceError } from "@/lib/apiClient";
import { mapOrderWriteError } from "./mapOrderWriteError";

/**
 * 列表/详情 GET 等读路径（及与订单码表重叠的 API 错）：合规类保留原文；其余走 mapOrderWriteError（login / 限流 / 订单态等）。
 */
export function mapApiReadError(err: unknown, t: (key: string) => string, fallbackKey: string): string {
  if (isComplianceError(err)) return err instanceof Error ? err.message : t(fallbackKey);
  return mapOrderWriteError(err, t, { fallbackKey });
}
