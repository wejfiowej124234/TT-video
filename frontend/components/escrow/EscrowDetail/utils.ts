/** 将订单金额转为链上最小单位（USDC 6 位小数）。去除千分位逗号，与 buildEscrowCreateParams 分母逻辑一致；假定小数点为 `.`（非欧式 1.234,56）。 */
export function orderAmountToBigInt(amountStr: string | undefined): bigint | undefined {
  if (amountStr == null || amountStr === "") return undefined;
  const normalized = String(amountStr).trim().replace(/,/g, "");
  const n = parseFloat(normalized);
  if (Number.isNaN(n) || n < 0) return undefined;
  return BigInt(Math.round(n * 1e6));
}

/** 比较钱包地址（忽略大小写，0x 前缀） */
export function sameWallet(
  a: string | undefined | null,
  b: string | undefined | null
): boolean {
  if (!a || !b) return false;
  const n = (s: string) => s.trim().toLowerCase().replace(/^0x/, "");
  return n(a) === n(b);
}
