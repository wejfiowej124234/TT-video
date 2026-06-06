/** ① Experience：链上/协议高级区默认对旅行者隐藏；仅显式开启时展示（本地联调） */
export function isEscrowExperienceDevToolsEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_ESCROW_DEV_TOOLS?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function truncateItineraryPreviewLine(text: string, maxLen = 72): string {
  const t = text.trim();
  if (!t) return "";
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}
