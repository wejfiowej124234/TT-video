/**
 * 31 §2.4：钱包 / DID 简写展示（身份即钱包），不改动链上数据。
 */
export function formatWalletOrDidShort(raw: string | null | undefined): string | null {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return null;
  if (/^0x[a-fA-F0-9]{10,}$/i.test(s)) {
    const hex = s.slice(2);
    if (hex.length <= 8) return s;
    return `0x${hex.slice(0, 4)}…${hex.slice(-4)}`;
  }
  if (s.length <= 14) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}
