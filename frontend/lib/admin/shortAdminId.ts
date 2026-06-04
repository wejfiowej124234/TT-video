/** 列表行内缩短 UUID / 长 ID 展示（完整值放 title）。 */
export function shortAdminId(id: string | undefined, head = 8): string {
  const s = id?.trim() ?? "";
  if (!s) return "";
  if (s.length <= head + 2) return s;
  return `${s.slice(0, head)}…`;
}
