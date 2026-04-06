/**
 * B-067 / TT-ESCROW-PROTOCOL-PAUSE-META-GATE-ONCHAIN-001：`GET /meta` 根级 `pause.enabled`
 * 与 `state.pause_mode`（`PAUSE_MODE=1`）一致；与 `PAUSE_META_TOP_KEYS` / 737 对读。
 * meta 缺失或未加载时不视为暂停（写路径仍可由 503 `api_paused` 兜底）。
 */
export function readProtocolPauseFromMeta(meta: Record<string, unknown> | null): boolean {
  if (!meta) return false;
  const pause = meta.pause;
  if (!pause || typeof pause !== "object") return false;
  const enabled = (pause as Record<string, unknown>).enabled;
  return enabled === true;
}
