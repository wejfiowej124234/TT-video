import { pad, type Hex } from "viem";

/**
 * 将 API 订单 UUID 编码为 EscrowFactory 使用的 `bytes32 orderId`：
 * 高 16 字节为 0，低 16 字节为 UUID（与索引器 `parse_order_id_and_escrow_from_topics` 一致）。
 */
export function tryOrderUuidToOrderIdBytes32(uuid: string): `0x${string}` | null {
  const clean = uuid.replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(clean)) return null;
  return pad(`0x${clean}` as Hex, { size: 32 });
}
