/**
 * P5-4-1：与 `db::distribution_uuid_to_bytes32_hex_for_claim` 一致 — UUID 128 位置于 `bytes32` **低** 128 位（高 128 位为 0）。
 * 供 `InvestorDistributionClaim` / `RegionDistributionClaim` 的 `distributionId` 对读。
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function uuidHexToClaimBytes32(hex32: string): `0x${string}` {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex32.slice(i * 2, i * 2 + 2), 16);
  }
  let n = 0n;
  for (let i = 0; i < 16; i++) {
    n = (n << 8n) + BigInt(bytes[i]!);
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 16; i++) {
    out[16 + i] = Number((n >> (8n * BigInt(15 - i))) & 0xffn);
  }
  return `0x${Array.from(out, (b) => b.toString(16).padStart(2, "0")).join("")}` as const;
}

/** 接受标准 UUID 或全宽 `0x` + 64 hex（`bytes32`）。 */
export function parseDistributionIdForClaim(input: string): `0x${string}` | null {
  const t = input.trim();
  if (!t) return null;
  if (/^0x[0-9a-fA-F]{64}$/.test(t)) {
    return t.toLowerCase() as `0x${string}`;
  }
  if (!UUID_RE.test(t)) return null;
  const hex = t.replace(/-/g, "");
  if (hex.length !== 32) return null;
  return uuidHexToClaimBytes32(hex);
}
