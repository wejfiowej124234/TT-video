export type EntitlementRes = {
  status?: string;
  entitlement?: Record<string, unknown>;
  error?: string;
};

export function adminOnboardingEntitlementDetailFmt(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export type AdminOnboardingEntitlementDetailRowDef = {
  key: string;
  labelKey: string;
  display?: string;
};

/** Prefer known scalar fields; skip missing keys; objects → short JSON display. */
const ENTITLEMENT_DETAIL_FIELD_KEYS: { key: string; labelKey: string }[] = [
  { key: "id", labelKey: "admin_onb_ent_field_id" },
  { key: "user_id", labelKey: "admin_onb_ent_field_user_id" },
  { key: "status", labelKey: "admin_onb_ent_field_status" },
  { key: "product", labelKey: "admin_onb_ent_field_product" },
  { key: "product_code", labelKey: "admin_onb_ent_field_product_code" },
  { key: "role", labelKey: "admin_onb_ent_field_role" },
  { key: "role_key", labelKey: "admin_onb_ent_field_role_key" },
  { key: "amount", labelKey: "admin_onb_ent_field_amount" },
  { key: "currency", labelKey: "admin_onb_ent_field_currency" },
  { key: "created_at", labelKey: "admin_onb_ent_field_created_at" },
  { key: "updated_at", labelKey: "admin_onb_ent_field_updated_at" },
  { key: "expires_at", labelKey: "admin_onb_ent_field_expires_at" },
  { key: "revoked_at", labelKey: "admin_onb_ent_field_revoked_at" },
  { key: "payment_intent_id", labelKey: "admin_onb_ent_field_payment_intent_id" },
  { key: "jurisdiction", labelKey: "admin_onb_ent_field_jurisdiction" },
];

export function buildAdminOnboardingEntitlementDetailRowDefs(
  ent: Record<string, unknown>,
): AdminOnboardingEntitlementDetailRowDef[] {
  const rows: AdminOnboardingEntitlementDetailRowDef[] = [];

  for (const { key, labelKey } of ENTITLEMENT_DETAIL_FIELD_KEYS) {
    if (!(key in ent) || ent[key] === undefined || ent[key] === null) continue;
    const raw = ent[key];
    if (typeof raw === "object") {
      rows.push({ key, labelKey, display: adminOnboardingEntitlementDetailFmt(raw) });
    } else {
      rows.push({ key, labelKey });
    }
  }

  for (const [key, raw] of Object.entries(ent)) {
    if (!key.startsWith("stripe_")) continue;
    if (raw === undefined || raw === null) continue;
    /** Stripe_* use the field name as label (no per-key locale flood). */
    const labelKey = "admin_onb_ent_field_stripe_passthrough";
    if (typeof raw === "object") {
      rows.push({
        key,
        labelKey,
        display: adminOnboardingEntitlementDetailFmt(raw),
      });
    } else {
      rows.push({ key, labelKey, display: adminOnboardingEntitlementDetailFmt(raw) });
    }
  }

  return rows;
}
