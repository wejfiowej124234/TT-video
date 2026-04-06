/** 金额输入：仅保留数字与一个小数点，小数点后最多 2 位 */
export function sanitizeDecimalInput(value: string): string {
  let s = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const dotIndex = s.indexOf(".");
  if (dotIndex >= 0) {
    const before = s.slice(0, dotIndex);
    const after = s.slice(dotIndex + 1).replace(/\D/g, "").slice(0, 2);
    s = after.length ? `${before}.${after}` : before || "0";
  }
  if (s.startsWith("0") && s.length > 1 && s[1] !== ".") s = s.replace(/^0+/, "") || "0";
  return s;
}
