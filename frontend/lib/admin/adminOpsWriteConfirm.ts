import type { AdminL5ConfirmRequest } from "@/lib/admin/adminL5ConfirmTypes";

/** Official account/guide/template publish · live consumer/community impact. */
export function adminConfirmOfficialPublish(onConfirm: () => void | Promise<void>): AdminL5ConfirmRequest {
  return {
    titleKey: "admin_l5_confirm_title_danger",
    descKey: "admin_l5_confirm_desc_official_publish",
    danger: true,
    confirmLabelKey: "admin_official_action_publish",
    onConfirm,
  };
}

/** Early bird stage multiplier change · affects growth points accrual. */
export function adminConfirmEarlyBirdMultiplier(onConfirm: () => void | Promise<void>): AdminL5ConfirmRequest {
  return {
    titleKey: "admin_l5_confirm_title_danger",
    descKey: "admin_l5_confirm_desc_early_bird_multiplier",
    danger: true,
    confirmLabelKey: "admin_growth_early_bird_save_multiplier",
    onConfirm,
  };
}

/** Early bird stage enable/disable. */
export function adminConfirmEarlyBirdToggle(active: boolean, onConfirm: () => void | Promise<void>): AdminL5ConfirmRequest {
  return {
    titleKey: "admin_l5_confirm_title_danger",
    descKey: active
      ? "admin_l5_confirm_desc_early_bird_enable"
      : "admin_l5_confirm_desc_early_bird_disable",
    danger: true,
    confirmLabelKey: active ? "admin_growth_early_bird_enable" : "admin_growth_early_bird_disable",
    onConfirm,
  };
}

/** Catalog / Official publish · live consumer impact. */
export function adminConfirmCatalogPublish(onConfirm: () => void | Promise<void>): AdminL5ConfirmRequest {
  return {
    titleKey: "admin_l5_confirm_title_danger",
    descKey: "admin_l5_confirm_desc_catalog_publish",
    danger: true,
    confirmLabelKey: "admin_content_action_publish",
    onConfirm,
  };
}

/** Cold-start deploy · consumer surfaces. */
export function adminConfirmColdStartDeploy(onConfirm: () => void | Promise<void>): AdminL5ConfirmRequest {
  return {
    titleKey: "admin_l5_confirm_title_danger",
    descKey: "admin_l5_confirm_desc_cold_start_deploy",
    danger: true,
    confirmLabelKey: "admin_official_cold_start_action_deploy",
    onConfirm,
  };
}

/** Cold-start rollback · removes consumer campaign. */
export function adminConfirmColdStartRollback(onConfirm: () => void | Promise<void>): AdminL5ConfirmRequest {
  return {
    titleKey: "admin_l5_confirm_title_danger",
    descKey: "admin_l5_confirm_desc_cold_start_rollback",
    danger: true,
    confirmLabelKey: "admin_official_cold_start_action_rollback",
    onConfirm,
  };
}

/** Growth anti-fraud freeze/unfreeze. */
export function adminConfirmGrowthFraudStatus(
  action: "freeze" | "unfreeze",
  onConfirm: () => void | Promise<void>,
): AdminL5ConfirmRequest {
  return {
    titleKey: "admin_l5_confirm_title_danger",
    descKey:
      action === "freeze"
        ? "admin_l5_confirm_desc_growth_fraud_freeze"
        : "admin_l5_confirm_desc_growth_fraud_unfreeze",
    danger: true,
    confirmLabelKey:
      action === "freeze" ? "admin_growth_anti_fraud_freeze" : "admin_growth_anti_fraud_unfreeze",
    onConfirm,
  };
}

/** Conversion analytics · clear local browser data. */
export function adminConfirmPesAnalyticsClear(onConfirm: () => void | Promise<void>): AdminL5ConfirmRequest {
  return {
    titleKey: "admin_l5_confirm_title_danger",
    descKey: "admin_l5_confirm_desc_pes_analytics_clear",
    danger: true,
    confirmLabelKey: "pes3_dashboard_clear",
    onConfirm,
  };
}

/** POI image batch · publish / review workflow. */
export function adminConfirmPoiImageWorkflow(
  action: "submit-review" | "publish" | "request-publish",
  onConfirm: () => void | Promise<void>,
): AdminL5ConfirmRequest {
  const descKey =
    action === "publish"
      ? "admin_l5_confirm_desc_poi_image_publish"
      : action === "request-publish"
        ? "admin_l5_confirm_desc_poi_image_request_publish"
        : "admin_l5_confirm_desc_poi_image_submit_review";
  return {
    titleKey: "admin_l5_confirm_title_danger",
    descKey,
    danger: action === "publish",
    confirmLabelKey:
      action === "publish"
        ? "admin_content_poi_image_publish"
        : action === "request-publish"
          ? "admin_content_poi_image_request_publish"
          : "admin_content_poi_image_submit_review",
    onConfirm,
  };
}

/** POI image batch · select winning candidate for a POI. */
export function adminConfirmPoiImageSelect(onConfirm: () => void | Promise<void>): AdminL5ConfirmRequest {
  return {
    titleKey: "admin_l5_confirm_title_danger",
    descKey: "admin_l5_confirm_desc_poi_image_select",
    danger: false,
    confirmLabelKey: "admin_content_poi_image_select",
    onConfirm,
  };
}

/** POI image batch · approve or reject a single candidate. */
export function adminConfirmPoiImageReview(
  review_status: "approved" | "rejected",
  onConfirm: () => void | Promise<void>,
): AdminL5ConfirmRequest {
  return {
    titleKey: "admin_l5_confirm_title_danger",
    descKey:
      review_status === "approved"
        ? "admin_l5_confirm_desc_poi_image_approve"
        : "admin_l5_confirm_desc_poi_image_reject",
    danger: review_status === "approved",
    confirmLabelKey:
      review_status === "approved" ? "admin_content_poi_image_approve" : "admin_content_poi_image_reject",
    onConfirm,
  };
}
