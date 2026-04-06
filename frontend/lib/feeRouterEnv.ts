import { getAddress, isAddress } from "viem";

/**
 * FeeRouter 部署地址（83/84、14 §1.1、07 §五 5.2A）。
 * 须与 Escrow 创建参数 `platformFeeRecipient`、后端 `FEE_ROUTER_ADDRESS`、`GET /meta` 中
 * `chain.contracts.fee_router_address` 一致；未配置或非法时返回 null。
 */
export function getFeeRouterAddress(): `0x${string}` | null {
  if (typeof process === "undefined") return null;
  const raw = process.env.NEXT_PUBLIC_FEE_ROUTER_ADDRESS?.trim();
  if (!raw) return null;
  if (!isAddress(raw)) return null;
  return getAddress(raw);
}
