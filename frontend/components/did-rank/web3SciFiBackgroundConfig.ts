/**
 * DID 排行榜 · Web3 科幻背景动效（参照 https://aptoslabs.com/ ）
 * 深色渐变底、流体噪声/能量云、微粒漂浮、鼠标视差、移动端自动降级（少粒子/关 Bloom）。
 * 颜色与 globals.css --bg-scifi-canvas 及 ref-cyan（Tropical jade）一致。
 */
export const SCIFI_BG_HEX = "#050816";
export const SCIFI_GLOW_HEX = "#23ced9";

/**
 * 可调参数表：
 * | 参数               | 类型    | 默认值  | 说明 |
 * |--------------------|---------|---------|------|
 * | particleCount      | number  | 2800    | 粒子数量（桌面）；移动端约 700 |
 * | noiseSpeed         | number  | 0.6     | 流体噪声速度 (0.1–2) |
 * | glowIntensity      | number  | 0.85    | Bloom 发光强度 (0–2)，0 关闭 |
 * | opacity            | number  | 0.7     | 能量云/粒子整体透明度 (0–1) |
 * | parallaxStrength   | number  | 0.015   | 鼠标视差漂移量 (0–0.03) |
 * | fpsTarget          | number  | 60      | 目标帧率，0 不限制 |
 * | enableBloom        | boolean | true    | 是否启用 Bloom（移动端自动 false） |
 * | enableParticles    | boolean | true    | 是否启用粒子 |
 * | enableNoise        | boolean | true    | 是否启用流体噪声层 |
 */
export interface Web3SciFiBackgroundConfig {
  /** 粒子数量（桌面端）；移动端会自动降级为约 1/4 */
  particleCount: number;
  /** 流体噪声动画速度 (0.1–2)，越大流动越快 */
  noiseSpeed: number;
  /** Bloom 发光强度 (0–2)，0 表示关闭；移动端建议 0 */
  glowIntensity: number;
  /** 能量云/粒子整体透明度 (0–1) */
  opacity: number;
  /** 视差强度：鼠标移动时背景漂移量 (0–0.03) */
  parallaxStrength: number;
  /** 目标帧率（用于节流或降画质），0 表示不限制 */
  fpsTarget: number;
  /** 是否启用 Bloom；移动端自动关闭 */
  enableBloom: boolean;
  /** 是否启用粒子；可单独关闭 */
  enableParticles: boolean;
  /** 是否启用流体噪声层 */
  enableNoise: boolean;
}

export const DEFAULT_WEB3_SCIFI_BACKGROUND_CONFIG: Web3SciFiBackgroundConfig = {
  particleCount: 2800,
  noiseSpeed: 0.6,
  glowIntensity: 0.85,
  opacity: 0.58,
  parallaxStrength: 0.015,
  fpsTarget: 60,
  enableBloom: true,
  enableParticles: true,
  enableNoise: true,
};

/** 移动端/低性能预设：少粒子、关 Bloom */
export const MOBILE_WEB3_SCIFI_BACKGROUND_CONFIG: Partial<Web3SciFiBackgroundConfig> = {
  particleCount: 700,
  noiseSpeed: 0.4,
  glowIntensity: 0,
  enableBloom: false,
  opacity: 0.5,
  parallaxStrength: 0.008,
  fpsTarget: 30,
};
