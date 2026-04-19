/**
 * P-004：跨端一致的内容指纹 — 与 `scripts/p004-verify-transparency.mjs` 使用同一算法。
 */

import type { TransparencyBundleV1 } from "@/lib/trust/buildTransparencyBundle";
import { sha256HexUtf8, stableStringify } from "@/lib/trust/stableStringify";

/** 机读标识：指纹 = SHA-256（UTF-8）·`stableStringify(bundle)` */
export const TRANSPARENCY_FINGERPRINT_CODEC_ID =
  "traveltrust_transparency_fingerprint.v1:stable_json_keysort_utf8_sha256";

export async function fingerprintFromTransparencyBundle(bundle: TransparencyBundleV1): Promise<string> {
  return sha256HexUtf8(stableStringify(bundle));
}
