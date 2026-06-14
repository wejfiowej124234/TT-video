/**

 * 向导 **身份质押（USDC · GuideIdentityStakingPool）** 入口与门闸 SSOT。

 *

 * **产品顺序（写死）：** `/guide/register` 仅交资料 → Admin 审核 → **`/guide` 工作台 Banner** → `/staking#guide-identity-stake`。

 * 申请期 **不** 质押；审核中 **`GuideIdentityStakingOpsGate`** 拦截 `/staking` 写操作。

 *

 * - **≠** `/me/onboarding` 准入费（B 轨 · 商家/主理人）

 * - **≠** 主理人 TTG 质押（`/me/onboarding` · RegionStewardStakePool）

 * - **≠** `/me/settings/trust`（KYC/信任展示，非质押 CTA）

 * - 叙事 SSOT：`GUIDE-ONBOARDING-STAKING-FLOW.md` · `app/staking/README.md` · `app/guide/README.md`

 */



/** 向导身份池质押操作锚点（`/staking` 页内唯一写操作面） */

export const GUIDE_IDENTITY_STAKE_SECTION_ID = "guide-identity-stake";



/** `/staking` 仅展示向导池（隐藏商家身份池） */

export const GUIDE_STAKING_PAGE_SCOPE = "guide";



import { GUIDE_IDENTITY_MIN_STAKE_REFERENCE } from "./guideIdentityStakeTiers";

/** 81 §4.1 / 平台第一档 = 链上 `MIN_STAKE()` 参考锚（见 `guideIdentityStakeTiers`） */
export { GUIDE_IDENTITY_MIN_STAKE_REFERENCE };



/** 深链：向导工作台 → 向导池质押面板（单一身份面） */

export const GUIDE_IDENTITY_STAKING_HREF = `/staking?scope=${GUIDE_STAKING_PAGE_SCOPE}#${GUIDE_IDENTITY_STAKE_SECTION_ID}`;



export type GuideIdentityStakingTier = "none" | "below_min" | "satisfied";



export function isGuideOnlyStakingScope(scope: string | null | undefined): boolean {

  return scope === GUIDE_STAKING_PAGE_SCOPE;

}



export function parseGuideStakeAmountFromMe(mePayload: unknown): string | null {

  if (mePayload == null || typeof mePayload !== "object") return null;

  const guide = (mePayload as { guide?: { stake_amount?: unknown } | null }).guide;

  if (guide == null || typeof guide !== "object") return null;

  const raw = guide.stake_amount;

  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);

  if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();

  return null;

}



function parseStakeAmountNumber(stakeAmount: string | null): number | null {

  if (stakeAmount == null) return null;

  const n = Number.parseFloat(stakeAmount);

  return Number.isFinite(n) ? n : null;

}



function resolveMinStakeNumber(minStakeAmount?: string | number | null): number {

  if (minStakeAmount != null && String(minStakeAmount).trim() !== "") {

    const n = Number.parseFloat(String(minStakeAmount));

    if (Number.isFinite(n) && n > 0) return n;

  }

  return Number.parseFloat(GUIDE_IDENTITY_MIN_STAKE_REFERENCE);

}



/**

 * ① 本地质押档位（API `stake_amount` vs `MIN_STAKE` 或 81 参考锚 1000）。

 * **②** 须与链上 `stakeOf` 强一致对拍（见 STK-P2-004）。

 */

export function resolveGuideIdentityStakingTier(

  stakeAmount: string | null,

  minStakeAmount?: string | number | null,

): GuideIdentityStakingTier {

  const n = parseStakeAmountNumber(stakeAmount);

  if (n == null || n <= 0) return "none";

  const min = resolveMinStakeNumber(minStakeAmount);

  if (n < min) return "below_min";

  return "satisfied";

}



/** API/DB 有任意正数质押额（**不**代表已满足最低质押） */

export function guideIdentityStakingHasAnyAmount(stakeAmount: string | null): boolean {

  const n = parseStakeAmountNumber(stakeAmount);

  return n != null && n > 0;

}



/** 已满足最低质押（默认 81 参考锚；链上 `MIN_STAKE` 可读时传入对拍） */

export function guideIdentityStakingSatisfied(

  stakeAmount: string | null,

  minStakeAmount?: string | number | null,

): boolean {

  return resolveGuideIdentityStakingTier(stakeAmount, minStakeAmount) === "satisfied";

}



export function guideRegistrationApproved(status: string | null | undefined): boolean {

  const s = status?.trim().toLowerCase();

  return s === "active" || s === "approved";

}



function guideRegistrationBlocksStaking(status: string | null | undefined): boolean {

  const s = status?.trim().toLowerCase();

  return (
    s === "pending" ||
    s === "pending_review" ||
    s === "rejected" ||
    s === "suspended" ||
    s === "exiting" ||
    s === "exited"
  );

}



/**

 * 管理员审核通过后方可执行向导身份质押（申请页仅交资料，不质押）。

 */

export function canPerformGuideIdentityStaking(

  guideRegistrationStatus: string | null | undefined,

): boolean {

  if (guideRegistrationBlocksStaking(guideRegistrationStatus)) return false;

  return guideRegistrationApproved(guideRegistrationStatus);

}



/**

 * **唯一**展示「前往质押」主 CTA 的门闸（`/guide` 工作台顶区 · 完全未质押）。

 */

export function shouldShowGuideIdentityStakingBanner(input: {

  guideWorkspaceUnlocked: boolean;

  guideRegistrationStatus: string | null | undefined;

  stakeAmount: string | null;

  minStakeAmount?: string | number | null;

}): boolean {

  if (!input.guideWorkspaceUnlocked) return false;

  if (resolveGuideIdentityStakingTier(input.stakeAmount, input.minStakeAmount) !== "none") return false;

  return canPerformGuideIdentityStaking(input.guideRegistrationStatus);

}



/**

 * 已质押但 **不足** `MIN_STAKE`：工作台顶区警告 + 引导补足。

 */

export function shouldShowGuideIdentityStakingBelowMinWarning(input: {

  guideWorkspaceUnlocked: boolean;

  guideRegistrationStatus: string | null | undefined;

  stakeAmount: string | null;

  minStakeAmount?: string | number | null;

}): boolean {

  if (!input.guideWorkspaceUnlocked) return false;

  if (resolveGuideIdentityStakingTier(input.stakeAmount, input.minStakeAmount) !== "below_min") return false;

  return canPerformGuideIdentityStaking(input.guideRegistrationStatus);

}



/**

 * 已满足最低质押：展示「管理身份质押」次入口。

 */

export function shouldShowGuideWorkbenchStakingManageLink(input: {

  guideWorkspaceUnlocked: boolean;

  guideRegistrationStatus: string | null | undefined;

  stakeAmount: string | null;

  minStakeAmount?: string | number | null;

}): boolean {

  if (!input.guideWorkspaceUnlocked) return false;

  if (resolveGuideIdentityStakingTier(input.stakeAmount, input.minStakeAmount) !== "satisfied") return false;

  return canPerformGuideIdentityStaking(input.guideRegistrationStatus);

}



/** 不足额时仍须进入 `/staking` 补足（管理链，非「已锁定可接单」态） */

export function shouldShowGuideWorkbenchStakingTopUpLink(input: {

  guideWorkspaceUnlocked: boolean;

  guideRegistrationStatus: string | null | undefined;

  stakeAmount: string | null;

  minStakeAmount?: string | number | null;

}): boolean {

  return shouldShowGuideIdentityStakingBelowMinWarning(input);

}


