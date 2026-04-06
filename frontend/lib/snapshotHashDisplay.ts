import { isHex, size } from "viem";

const ZERO_BYTES32 = /^0x0{64}$/i;

/**
 * 是否可在托管控制台展示为「已绑定的 snapshot 哈希」。
 * 与 `buildEscrowCreateParams` 一致（32 字节 hex）；排除全零占位，避免误读为真实绑定（B-031）。
 */
export function isDisplayableSnapshotHash(raw: string | null | undefined): raw is string {
  if (typeof raw !== "string") return false;
  const s = raw.trim();
  if (!s) return false;
  if (ZERO_BYTES32.test(s)) return false;
  return isHex(s) && size(s) === 32;
}
