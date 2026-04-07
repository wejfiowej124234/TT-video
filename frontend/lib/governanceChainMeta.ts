/** 从 `GET /meta` 解析链上治理展示用字段（与 `health_meta` `chain` 对象一致；无则 null）。 */

export function governorAddressFromMeta(m: Record<string, unknown>): string | null {
  const ch = m.chain;
  if (!ch || typeof ch !== "object") return null;
  const contracts = (ch as Record<string, unknown>).contracts;
  if (!contracts || typeof contracts !== "object") return null;
  const g = (contracts as Record<string, unknown>).governor_address;
  return typeof g === "string" && g.trim() ? g.trim() : null;
}

export function chainIdFromMeta(m: Record<string, unknown>): number | null {
  const ch = m.chain;
  if (!ch || typeof ch !== "object") return null;
  const id = (ch as Record<string, unknown>).chain_id;
  return typeof id === "number" && Number.isFinite(id) ? id : null;
}
