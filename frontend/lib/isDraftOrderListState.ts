/**
 * B-044：`/orders` 列表项是否为草稿（或 API 等价态），用于专用「继续编辑」与卡面区分。
 */
export function isDraftOrderListState(state: string): boolean {
  const s = (state ?? "").trim().toLowerCase();
  return s === "draft" || s === "open";
}
