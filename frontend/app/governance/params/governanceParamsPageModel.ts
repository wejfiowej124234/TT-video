import { PROTOCOL_REF_CHECKSUM_DISPLAY_KEYS } from "@/lib/governanceParams84Readonly";

export const CHECKSUM_I18N_KEY: Record<(typeof PROTOCOL_REF_CHECKSUM_DISPLAY_KEYS)[number], string> = {
  phase1_open_fee_points_sum: "governance_params_checksum_key_phase1_open_fee_points_sum",
  national_pool_cap_fee_points_sum: "governance_params_checksum_key_national_pool_cap_fee_points_sum",
  country_bucket_percent: "governance_params_checksum_key_country_bucket_percent",
  phase1_open_over_country_bucket: "governance_params_checksum_key_phase1_open_over_country_bucket",
};
