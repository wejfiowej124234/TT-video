import { isAllowedProductIso3166 } from "@/lib/productCountries";
import type { CommunityPostType } from "@/lib/communityMockData";

/** i18n 键：与 `ActionGateChecklist` / `zh.ts` / `en.ts` 同步 */
export const ACTION_GATE_KEYS = {
  login: "action_gate_item_login",
  titleMerchant: "action_gate_item_merchant_title",
  priceMerchant: "action_gate_item_merchant_price",
  escrowAck: "action_gate_item_escrow_ack",
  countryNotAllowed: "action_gate_item_country_not_allowed",
  titleAcquisition: "action_gate_item_acq_title",
  countryAcquisition: "action_gate_item_acq_country",
  bountyAcquisition: "action_gate_item_acq_bounty",
  postBody: "action_gate_item_post_body",
  postPhotos: "action_gate_item_post_photos",
  postVideo: "action_gate_item_post_video",
  postVideoObjectStorage: "action_gate_item_post_video_object_storage",
  merchantRole: "action_gate_item_merchant_role",
  merchantApplication: "action_gate_item_merchant_application",
  merchantEntitlementPaid: "action_gate_item_merchant_entitlement_paid",
} as const;

/** TT 社区发布抽屉：与 `PublishDrawer` 禁用逻辑一致 */
export function communityPublishBlockedKeys(params: {
  sessionOk: boolean;
  type: CommunityPostType;
  hasBody: boolean;
  photoCount: number;
  hasVideoPreview: boolean;
  /** `false`：视频管线（S3/R2 就绪）不可用，`PublishDrawer` 与 `GET …/media/capabilities` 同源 */
  videoPipelineOk?: boolean;
}): string[] {
  const keys: string[] = [];
  if (!params.sessionOk) keys.push(ACTION_GATE_KEYS.login);
  if (!params.hasBody) keys.push(ACTION_GATE_KEYS.postBody);
  if (params.type === "photo" && params.photoCount === 0) keys.push(ACTION_GATE_KEYS.postPhotos);
  if (params.type === "video") {
    if (params.videoPipelineOk === false) {
      keys.push(ACTION_GATE_KEYS.postVideoObjectStorage);
    } else if (!params.hasVideoPreview) {
      keys.push(ACTION_GATE_KEYS.postVideo);
    }
  }
  return keys;
}

/** 商家橱窗「发布至目录」与 `useMerchantShowcaseStudioModal` / `MerchantShowcaseStudioModal` 原 publishGate 一致 */
export function merchantCatalogPublishBlockedKeys(
  form: { title: string; priceUsdc: string; agreeEscrowCopy: boolean; countryIso: string },
  sessionOk: boolean,
  merchantGate?: { roleOk: boolean; applicationOk: boolean; entitlementPaidOk?: boolean },
): string[] {
  const keys: string[] = [];
  if (!sessionOk) keys.push(ACTION_GATE_KEYS.login);
  if (merchantGate && !merchantGate.roleOk) keys.push(ACTION_GATE_KEYS.merchantRole);
  if (merchantGate && !merchantGate.applicationOk) keys.push(ACTION_GATE_KEYS.merchantApplication);
  if (merchantGate && merchantGate.entitlementPaidOk === false) {
    keys.push(ACTION_GATE_KEYS.merchantEntitlementPaid);
  }
  const title = form.title.trim();
  if (!title) keys.push(ACTION_GATE_KEYS.titleMerchant);
  const price = Number(form.priceUsdc);
  if (!Number.isFinite(price) || price <= 0 || price > 999999) keys.push(ACTION_GATE_KEYS.priceMerchant);
  if (!form.agreeEscrowCopy) keys.push(ACTION_GATE_KEYS.escrowAck);
  const iso = form.countryIso.trim().toUpperCase();
  if (iso && !isAllowedProductIso3166(iso)) keys.push(ACTION_GATE_KEYS.countryNotAllowed);
  return keys;
}

/** 旅行收购「发布至目录」与 `useAcquisitionCarryStudioModal` / `AcquisitionCarryStudioModal` 原 publishGate 一致 */
export function acquisitionCatalogPublishBlockedKeys(
  form: {
    title: string;
    destinationCountryIso: string;
    bountyMinUsdc: string;
    bountyMaxUsdc: string;
    agreeEscrowCopy: boolean;
  },
  sessionOk: boolean,
): string[] {
  const keys: string[] = [];
  if (!sessionOk) keys.push(ACTION_GATE_KEYS.login);
  if (!form.title.trim()) keys.push(ACTION_GATE_KEYS.titleAcquisition);
  const iso = form.destinationCountryIso.trim().toUpperCase();
  if (iso.length !== 2) keys.push(ACTION_GATE_KEYS.countryAcquisition);
  const minN = Number(form.bountyMinUsdc);
  const maxN = Number(form.bountyMaxUsdc);
  const bountyOk =
    Number.isFinite(minN) &&
    Number.isFinite(maxN) &&
    minN > 0 &&
    maxN > 0 &&
    minN <= 999999 &&
    maxN <= 999999 &&
    minN <= maxN;
  if (!bountyOk) keys.push(ACTION_GATE_KEYS.bountyAcquisition);
  if (!form.agreeEscrowCopy) keys.push(ACTION_GATE_KEYS.escrowAck);
  return keys;
}
