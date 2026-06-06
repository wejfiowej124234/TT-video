/** 70 / 96-18 Admin onboarding 路径（与 `admin_onboarding::router` 一致）。 */
export const routesAdminOnboarding = {
  entitlements: (params?: { limit?: number; user_id?: string; status?: string; role_target?: string }) => {
    const sp = new URLSearchParams();
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.user_id?.trim()) sp.set("user_id", params.user_id.trim());
    if (params?.status?.trim()) sp.set("status", params.status.trim());
    if (params?.role_target?.trim()) sp.set("role_target", params.role_target.trim());
    const q = sp.toString();
    return `/api/v1/admin/onboarding/entitlements${q ? `?${q}` : ""}`;
  },
  entitlementById: (id: string) =>
    `/api/v1/admin/onboarding/entitlements/${encodeURIComponent(id)}`,
  entitlementRevoke: (id: string) =>
    `/api/v1/admin/onboarding/entitlements/${encodeURIComponent(id)}/revoke`,
  paymentEvents: (params?: { limit?: number; entitlement_id?: string; event_type?: string }) => {
    const sp = new URLSearchParams();
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.entitlement_id?.trim()) sp.set("entitlement_id", params.entitlement_id.trim());
    if (params?.event_type?.trim()) sp.set("event_type", params.event_type.trim());
    const q = sp.toString();
    return `/api/v1/admin/onboarding/payment-events${q ? `?${q}` : ""}`;
  },
  webhookJobs: (params?: { limit?: number; user_id?: string }) => {
    const sp = new URLSearchParams();
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.user_id?.trim()) sp.set("user_id", params.user_id.trim());
    const q = sp.toString();
    return `/api/v1/admin/onboarding/webhook-jobs${q ? `?${q}` : ""}`;
  },
  webhookDlq: (params?: { limit?: number; user_id?: string }) => {
    const sp = new URLSearchParams();
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.user_id?.trim()) sp.set("user_id", params.user_id.trim());
    const q = sp.toString();
    return `/api/v1/admin/onboarding/webhook-dlq${q ? `?${q}` : ""}`;
  },
  complianceAuditEvents: (params?: { limit?: number; user_id?: string }) => {
    const sp = new URLSearchParams();
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.user_id?.trim()) sp.set("user_id", params.user_id.trim());
    const q = sp.toString();
    return `/api/v1/admin/onboarding/compliance-audit-events${q ? `?${q}` : ""}`;
  },
} as const;
