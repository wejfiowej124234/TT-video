/**
 * 确定性 JSON 串（键排序），用于浏览器端内容指纹；与 `JSON.stringify` 默认顺序不同。
 */

export function stableStringify(value: unknown): string {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "string") return JSON.stringify(value);
  if (t === "number" || t === "boolean") return JSON.stringify(value);
  if (t === "bigint") return JSON.stringify((value as bigint).toString());
  if (t === "undefined") return "null";
  if (Array.isArray(value)) {
    return `[${value.map((x) => stableStringify(x)).join(",")}]`;
  }
  if (t === "object") {
    const o = value as Record<string, unknown>;
    const keys = Object.keys(o).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(String(value));
}

export async function sha256HexUtf8(text: string): Promise<string> {
  if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.subtle) {
    throw new Error("crypto_subtle_unavailable");
  }
  const enc = new TextEncoder();
  const buf = await globalThis.crypto.subtle.digest("SHA-256", enc.encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
