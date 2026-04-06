import { isHex, size } from "viem";

import type { EscrowCreateParamsInput } from "@/dapp/hooks/useEscrowFactoryCreate";

import { tryOrderUuidToOrderIdBytes32 } from "./orderIdBytes32";
import { orderAmountToBigInt } from "@/components/escrow/EscrowDetail/utils";
import type { ItineraryBlock, OrderRow } from "@/components/escrow/EscrowDetail/types";

export type BuildEscrowParamsErrorCode =
  | "invalid_order_id"
  | "missing_snapshot"
  | "invalid_snapshot"
  | "missing_order_amount"
  | "missing_traveler"
  | "missing_guide"
  | "missing_token"
  | "missing_arbitrator";

/** 列表/详情 JSON 可能把 `days` 序列化为字符串；仅接受非负整数（number 向下取整）。 */
function orderDaysAsPositiveInt(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.floor(raw);
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!/^\d+$/.test(s)) return undefined;
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function travelWindowToUnix(
  travelDateStr: string | undefined,
  days: number | undefined
): { start: bigint; end: bigint } {
  const nowSec = Math.floor(Date.now() / 1000);
  if (!travelDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(travelDateStr)) {
    return { start: BigInt(nowSec), end: BigInt(nowSec + 7 * 86_400) };
  }
  const start = Math.floor(new Date(`${travelDateStr}T00:00:00.000Z`).getTime() / 1000);
  const d = days != null && days > 0 ? days : 1;
  const end = start + d * 86_400;
  return { start: BigInt(start), end: BigInt(end) };
}

export function buildEscrowCreateParams(input: {
  order: OrderRow;
  itinerary: ItineraryBlock | null;
  snapshotHash: string;
  traveler: `0x${string}`;
  guide: `0x${string}`;
  token: `0x${string}`;
  arbitrator: `0x${string}`;
  chainId: bigint;
  disputeWindowSeconds: number;
}):
  | { ok: true; params: EscrowCreateParamsInput }
  | { ok: false; code: BuildEscrowParamsErrorCode } {
  const orderId = tryOrderUuidToOrderIdBytes32(String(input.order.id ?? ""));
  if (!orderId) return { ok: false, code: "invalid_order_id" };

  const snap = input.snapshotHash.trim();
  if (!snap) return { ok: false, code: "missing_snapshot" };
  if (!isHex(snap) || size(snap) !== 32) return { ok: false, code: "invalid_snapshot" };
  const snapshotHash = snap as `0x${string}`;

  const totalAmount = orderAmountToBigInt(input.order.amount);
  if (totalAmount === undefined) return { ok: false, code: "missing_order_amount" };

  const ab = input.itinerary?.amount_breakdown;
  const totalBudget =
    ab?.total_budget != null && ab.total_budget > 0
      ? ab.total_budget
      : parseFloat(String(input.order.amount ?? "0").replace(/,/g, ""));
  const platformFee = ab?.platform_fee ?? 0;
  const platformFeeBps =
    totalBudget > 0
      ? Math.min(10_000, Math.max(0, Math.round((platformFee / totalBudget) * 10_000)))
      : 0;

  const travel = (input.order as Record<string, unknown>).travel_date;
  const days = orderDaysAsPositiveInt((input.order as Record<string, unknown>).days);
  const { start, end } = travelWindowToUnix(
    typeof travel === "string" ? travel : undefined,
    days
  );

  if (!input.traveler) return { ok: false, code: "missing_traveler" };
  if (!input.guide) return { ok: false, code: "missing_guide" };
  if (!input.token) return { ok: false, code: "missing_token" };
  if (!input.arbitrator) return { ok: false, code: "missing_arbitrator" };

  return {
    ok: true,
    params: {
      chainId: input.chainId,
      orderId,
      snapshotHash,
      schemaVersion: 1,
      traveler: input.traveler,
      guide: input.guide,
      token: input.token,
      totalAmount,
      platformFeeBps,
      serviceStart: start,
      serviceEnd: end,
      disputeWindowSeconds: input.disputeWindowSeconds,
      arbitrator: input.arbitrator,
    },
  };
}
