import { getExpectedChainId } from "@/lib/chainEnv";

/**
 * B-102：`GET /api/v1/orders?orders_chain_id=` 与 `NEXT_PUBLIC_CHAIN_ID` / `GET /meta` `chain.chain_id` 对齐。
 * 未配置或 ≤0 时不传，走后端默认业务链范围。
 */
export function resolveOrdersListOrdersChainId(): number | undefined {
  const id = getExpectedChainId();
  return id > 0 ? id : undefined;
}
