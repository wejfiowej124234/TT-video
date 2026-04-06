/**
 * 270 / 04 §3.4：`POST /api/v1/media/signed-urls` 的 evidence object_id 拼装与校验。
 * 约定：`evidence|<order_uuid>|<content_hash_hex>`（hash 小写、仅十六进制）。
 */

const ORDER_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeContentHashHex(raw: string): string | null {
  let s = raw.trim();
  if (s.startsWith("0x") || s.startsWith("0X")) s = s.slice(2);
  const h = s.toLowerCase();
  if (!h || h.length > 128) return null;
  if (!/^[0-9a-f]+$/.test(h)) return null;
  return h;
}

/** 若 orderId / hash 不合法则返回 null（不发起签名请求）。 */
export function evidenceSignedUrlObjectId(orderId: string, contentHash: string): string | null {
  const oid = orderId.trim();
  if (!ORDER_UUID_RE.test(oid)) return null;
  const h = normalizeContentHashHex(contentHash);
  if (!h) return null;
  return `evidence|${oid}|${h}`;
}
