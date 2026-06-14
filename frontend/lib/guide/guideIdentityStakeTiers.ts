/**
 * 向导身份质押 · 平台定档 SSOT（① 本地 · 81 附录 A 锚 1000U+）
 * 链上 `MIN_STAKE` 仍为准入下限；产品展示与选择档位为 1000 / 5000 / 10000 USDC。
 */

export const GUIDE_IDENTITY_STAKE_TIER_USDC = [1000, 5000, 10000] as const;

export type GuideIdentityStakeTierUsdc = (typeof GUIDE_IDENTITY_STAKE_TIER_USDC)[number];

export type GuideIdentityStakeTierId = "tier_basic" | "tier_standard" | "tier_premium";

export const GUIDE_IDENTITY_STAKE_TIER_IDS: GuideIdentityStakeTierId[] = [
  "tier_basic",
  "tier_standard",
  "tier_premium",
];

/** 与 `GUIDE_IDENTITY_MIN_STAKE_REFERENCE` 同源：第一档 = 最低准入 */
export const GUIDE_IDENTITY_MIN_STAKE_REFERENCE = String(GUIDE_IDENTITY_STAKE_TIER_USDC[0]);

const TIER_BY_USDC: Record<GuideIdentityStakeTierUsdc, GuideIdentityStakeTierId> = {
  1000: "tier_basic",
  5000: "tier_standard",
  10000: "tier_premium",
};

const USDC_BY_TIER: Record<GuideIdentityStakeTierId, GuideIdentityStakeTierUsdc> = {
  tier_basic: 1000,
  tier_standard: 5000,
  tier_premium: 10000,
};

export function guideIdentityStakeTierUsdc(tierId: GuideIdentityStakeTierId): GuideIdentityStakeTierUsdc {
  return USDC_BY_TIER[tierId];
}

export function guideIdentityStakeTierI18nKey(tierId: GuideIdentityStakeTierId): string {
  return `guide_identity_stake_tier_${tierId}`;
}

export function parseGuideStakeUsdcNumber(amount: string | null | undefined): number | null {
  if (amount == null || String(amount).trim() === "") return null;
  const n = Number.parseFloat(String(amount).trim());
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** 根据已锁定总额解析所处平台档位（未达 1000 返回 null） */
export function resolveGuideIdentityStakeTierFromAmount(
  amount: string | null | undefined,
): GuideIdentityStakeTierId | null {
  const n = parseGuideStakeUsdcNumber(amount);
  if (n == null || n < GUIDE_IDENTITY_STAKE_TIER_USDC[0]) return null;
  if (n >= 10000) return "tier_premium";
  if (n >= 5000) return "tier_standard";
  return "tier_basic";
}

/** 达到目标档位所需链上追加额（USDC 数；已满足则 0） */
export function computeGuideStakeDeltaToTierUsdc(
  currentAmount: string | null | undefined,
  targetTier: GuideIdentityStakeTierUsdc,
): number {
  const current = parseGuideStakeUsdcNumber(currentAmount) ?? 0;
  return Math.max(0, targetTier - current);
}

export function formatGuideStakeDeltaUsdc(delta: number): string {
  if (!Number.isFinite(delta) || delta <= 0) return "0";
  return Number.isInteger(delta) ? String(delta) : delta.toFixed(2).replace(/\.?0+$/, "");
}

export function isGuideIdentityStakeTierUsdc(value: number): value is GuideIdentityStakeTierUsdc {
  return (GUIDE_IDENTITY_STAKE_TIER_USDC as readonly number[]).includes(value);
}

export function tierIdFromUsdc(usdc: GuideIdentityStakeTierUsdc): GuideIdentityStakeTierId {
  return TIER_BY_USDC[usdc];
}

/** 游客信任展示：是否达到最低档且可展示 */
export function shouldShowGuideIdentityStakeTrust(
  amount: string | null | undefined,
): boolean {
  const n = parseGuideStakeUsdcNumber(amount);
  return n != null && n >= GUIDE_IDENTITY_STAKE_TIER_USDC[0];
}
