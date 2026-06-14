import { PROTOCOL_REF_CHECKSUM_DISPLAY_KEYS } from "@/lib/governanceParams84Readonly";

export const CHECKSUM_I18N_KEY: Record<(typeof PROTOCOL_REF_CHECKSUM_DISPLAY_KEYS)[number], string> = {
  phase1_open_fee_points_sum: "governance_params_checksum_key_phase1_open_fee_points_sum",
  national_pool_cap_fee_points_sum: "governance_params_checksum_key_national_pool_cap_fee_points_sum",
  country_bucket_percent: "governance_params_checksum_key_country_bucket_percent",
  phase1_open_over_country_bucket: "governance_params_checksum_key_phase1_open_over_country_bucket",
};

/** C-GOV-011 · L5 壳与客态文案键（contract / i18n 对拍）。全量键见 closure sprint model。 */
export { GOVERNANCE_PARAMS_L5_LOCALE_KEYS as GOVERNANCE_PARAMS_PAGE_L5_LOCALE_KEYS } from "@/lib/governance/governanceParamsPageL5ClosureSprintModel";
