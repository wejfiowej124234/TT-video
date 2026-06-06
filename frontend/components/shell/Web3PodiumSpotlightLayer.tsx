/**
 * 全屏 `bg-web3-podium-spotlight` 装饰层（`z-0`、`pointer-events-none`）。
 * Opacity 按路由语义分档，类名为完整字面量以便 Tailwind JIT 收录。
 */
const PRESENCE_CLASS = {
  /** `/market` 等：弱高光（与 `MarketAmbientBackdrop` 历史 0.16 一致） */
  marketSubtle: "fixed inset-0 z-0 bg-web3-podium-spotlight opacity-[0.16] pointer-events-none",
  /** `/community` 壳：与 `TT_MARKETING_DARK_ROUTE_SCENE.community` 一致 */
  communityRoute: "fixed inset-0 z-0 bg-web3-podium-spotlight opacity-[0.28] pointer-events-none",
  /** `/did-rank`：与 `TT_MARKETING_DARK_ROUTE_SCENE.didRank` 一致 */
  didRankRoute: "fixed inset-0 z-0 bg-web3-podium-spotlight opacity-[0.28] pointer-events-none",
} as const;

export type Web3PodiumSpotlightPresence = keyof typeof PRESENCE_CLASS;

export function Web3PodiumSpotlightLayer({ presence }: { presence: Web3PodiumSpotlightPresence }) {
  return <div className={PRESENCE_CLASS[presence]} aria-hidden />;
}
