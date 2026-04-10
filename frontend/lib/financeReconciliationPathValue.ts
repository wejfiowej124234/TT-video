/**
 * Epic E-05：单一路径字段展示；禁止用 0/null 混填掩盖缺失。
 * 仅接受 string / number / boolean；其它类型视为不可用（不 stringify 对象冒充标量）。
 */
export function formatApiPathDisplayValue(value: unknown, dataUnavailableLabel: string): string {
  if (value === undefined || value === null) return dataUnavailableLabel;
  if (typeof value === "string") {
    if (value.trim() === "") return dataUnavailableLabel;
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return dataUnavailableLabel;
    return String(value);
  }
  if (typeof value === "boolean") return String(value);
  return dataUnavailableLabel;
}
