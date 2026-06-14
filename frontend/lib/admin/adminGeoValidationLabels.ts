/** Operator-readable labels for geo-validation status tokens. */
export function adminGeoDriftLabel(driftDetected: boolean): string {
  return driftDetected ? "admin_content_geo_drift_hold" : "admin_content_geo_drift_go";
}

export function adminGeoParityStatusLabel(status: string): string {
  const key = `admin_content_geo_parity_${status.toLowerCase()}` as const;
  return key;
}

export function adminGrowthFraudStatusLabel(status: string): string {
  const normalized = status.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
  return `admin_growth_fraud_status_${normalized}`;
}
