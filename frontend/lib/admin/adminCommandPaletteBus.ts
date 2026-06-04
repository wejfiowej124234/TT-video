/** ① · 全局命令面板打开（Shell 按钮与 ⌘K 同源）。 */
export const ADMIN_COMMAND_PALETTE_OPEN_EVENT = "tt-admin-open-command-palette";

export function requestAdminCommandPaletteOpen(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADMIN_COMMAND_PALETTE_OPEN_EVENT));
}
