/**
 * Batch-12 HU-462 · admin_home_* zh/en 键对称（死键清理 / 缺键补齐）。
 */

export const TT_ADMIN_HOME_I18N_KEY_SYMMETRY_MARK = "tt_admin_home_i18n_key_symmetry_hu462";

/** Keys that must exist on both zh and en after HU-462. */
export const ADMIN_HOME_I18N_SYMMETRY_REQUIRED_KEYS = [
  "admin_home_system_overview_honesty_dev_metrics",
  "admin_home_domain_health_cta_community",
] as const;

/** Dead keys removed from en (unused in TSX). */
export const ADMIN_HOME_I18N_DEAD_KEYS_REMOVED = [
  "admin_home_metric_chain_empty",
  "admin_home_metric_chain_loading",
] as const;
