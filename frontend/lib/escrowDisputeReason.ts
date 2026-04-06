/**
 * Escrow.openDispute(bytes32 reasonHash)：链上仅存 commitment，摘要由前端 keccak256(UTF-8 bytes) 与链下证据对齐（01 §6 证据、14 ABI）。
 */
import { keccak256, stringToBytes } from "viem";

export type EscrowDisputeReasonResult =
  | { ok: true; hash: `0x${string}` }
  | { ok: false; error: "empty" | "too_short" };

const MIN_LEN = 4;

export function escrowDisputeSummaryToReasonHash(summary: string): EscrowDisputeReasonResult {
  const s = summary.trim();
  if (!s) return { ok: false, error: "empty" };
  if (s.length < MIN_LEN) return { ok: false, error: "too_short" };
  return { ok: true, hash: keccak256(stringToBytes(s)) };
}
