import type { MeIdentitySlotState } from "@/lib/meIdentitySlots";



/** 槽位是否已有经营触达（含审核中 / 受限）；**不**用于 Settings 工作台捷径（见 *WorkspaceUnlocked）。 */

export function meIdentityOperatorSlotVisible(

  state: MeIdentitySlotState | null | undefined,

): boolean {

  return state === "active" || state === "pending" || state === "restricted";

}



/** 工作台经营能力已开通：`users.role` 对齐 **或** 槽位 `active`（multi-demo 商家 approved + role guide）。 */

export function meMerchantWorkspaceUnlocked(opts: {

  userRole?: string | null;

  merchantSlotState?: MeIdentitySlotState | null;

}): boolean {

  const role = (opts.userRole ?? "").trim().toLowerCase();

  if (role === "provider") return true;

  return opts.merchantSlotState === "active";

}



export function meGuideWorkspaceUnlocked(opts: {

  userRole?: string | null;

  guideSlotState?: MeIdentitySlotState | null;

}): boolean {

  const role = (opts.userRole ?? "").trim().toLowerCase();

  if (role === "guide") return true;

  return opts.guideSlotState === "active";

}



export function meStewardWorkspaceUnlocked(opts: {

  userRole?: string | null;

  stewardSlotState?: MeIdentitySlotState | null;

}): boolean {

  const role = (opts.userRole ?? "").trim().toLowerCase();

  if (role === "region_steward") return true;

  return opts.stewardSlotState === "active";

}



/** 收购子站：槽位已触达（active / 审核中）才在设置 Hub 展示捷径；入口 Hub 仍对全员开放。 */

export function meAcquisitionWorkspaceUnlocked(opts: {

  acquisitionSlotState?: MeIdentitySlotState | null;

}): boolean {

  const s = opts.acquisitionSlotState;

  return s === "active" || s === "pending";

}



export function meSettingsShowGuideHub(opts: {

  userRole?: string | null;

  guideSlotState?: MeIdentitySlotState | null;

}): boolean {

  return meGuideWorkspaceUnlocked(opts);

}



export function meSettingsShowMerchantHub(opts: {

  userRole?: string | null;

  merchantSlotState?: MeIdentitySlotState | null;

}): boolean {

  return meMerchantWorkspaceUnlocked(opts);

}



export function meSettingsShowStewardHub(opts: {

  userRole?: string | null;

  stewardSlotState?: MeIdentitySlotState | null;

}): boolean {

  return meStewardWorkspaceUnlocked(opts);

}



export function meSettingsShowAcquisitionHub(opts: {

  acquisitionSlotState?: MeIdentitySlotState | null;

}): boolean {

  return meAcquisitionWorkspaceUnlocked(opts);

}

