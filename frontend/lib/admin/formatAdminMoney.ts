/** Admin 列表/详情金额展示 · 2 位小数（① 同表一致）。 */
export function formatAdminMoney(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "";
  const n = typeof amount === "number" ? amount : Number.parseFloat(String(amount).trim());
  if (!Number.isFinite(n)) return String(amount);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
