import type { OnboardingQuoteRole } from "@/lib/apiClient";
import { userFromGetMePayload } from "@/lib/meTrust";

export type OnboardingQuoteView = {
  role: OnboardingQuoteRole;
  sku: string;
  currency: string;
  amountMinor: number;
  amountLabel: string;
  feeScheduleVersion: string;
  expiresAt: string | null;
  implementationStatus: string | null;
  isStub: boolean;
};

export type OnboardingFlowPhase = "login" | "quote" | "pay" | "pay_pending" | "confirm" | "done";

export type OnboardingEntitlementView = {
  id: string;
  roleTarget: string;
  sku: string;
  status: string;
  paidAt: string | null;
  expiresAt: string | null;
};

export type OnboardingEntitlementsView = {
  items: OnboardingEntitlementView[];
  implementationStatus: string | null;
  hasActivePaid: boolean;
};

export type OnboardingPaymentIntentView = {
  entitlementId: string | null;
  idempotencyKey: string | null;
  implementationStatus: string | null;
  detail: string | null;
  hasCheckout: boolean;
  hasClientSecret: boolean;
};

export type OnboardingRoleConfirmView = {
  role: string | null;
  userRole: string | null;
  implementationStatus: string | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** SSR/CSR 同源：B 轨默认 USDC（2 位 minor）；遗留 USD 仍可读。 */
export function formatOnboardingAmountMinor(amountMinor: number, currency: string): string {
  const c = currency.toUpperCase();
  if (c === "USDC") {
    const n = amountMinor / 100;
    return `${n.toFixed(2)} USDC`;
  }
  if (c === "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountMinor / 100);
  }
  return `${amountMinor} ${c}`;
}

export function parseOnboardingQuoteView(raw: unknown, fallbackRole: OnboardingQuoteRole): OnboardingQuoteView | null {
  const o = asRecord(raw);
  if (!o || o.status !== "ok") return null;
  const roleRaw = str(o.role) ?? fallbackRole;
  const role: OnboardingQuoteRole = roleRaw === "region_steward" ? "region_steward" : "provider";
  const currency = str(o.currency) ?? "USDC";
  const amountMinor = num(o.amount_minor) ?? 0;
  const meta = asRecord(o.meta);
  const impl = str(meta?.implementation_status);
  return {
    role,
    sku: str(o.sku) ?? "—",
    currency,
    amountMinor,
    amountLabel: formatOnboardingAmountMinor(amountMinor, currency),
    feeScheduleVersion: str(o.fee_schedule_version) ?? "—",
    expiresAt: str(o.expires_at),
    implementationStatus: impl,
    isStub: impl?.includes("stub") ?? amountMinor === 0,
  };
}

export function parseOnboardingEntitlementsView(raw: unknown): OnboardingEntitlementsView | null {
  const o = asRecord(raw);
  if (!o || o.status !== "ok") return null;
  const arr = Array.isArray(o.entitlements) ? o.entitlements : [];
  const items: OnboardingEntitlementView[] = arr
    .map((row) => {
      const e = asRecord(row);
      if (!e) return null;
      const id = str(e.id);
      if (!id) return null;
      return {
        id,
        roleTarget: str(e.role_target) ?? "—",
        sku: str(e.sku) ?? "—",
        status: str(e.status) ?? "unknown",
        paidAt: str(e.paid_at),
        expiresAt: str(e.expires_at),
      };
    })
    .filter((x): x is OnboardingEntitlementView => x != null);
  const meta = asRecord(o.meta);
  const hasActivePaid = items.some((i) => i.status === "paid" || i.status === "active");
  return {
    items,
    implementationStatus: str(meta?.implementation_status),
    hasActivePaid,
  };
}

/** 当前报价角色是否已有有效准入资格（避免另一轨已付导致步进/阶段误判） */
export function onboardingEntitlementPaidForRole(
  entitlements: OnboardingEntitlementsView | null | undefined,
  role: OnboardingQuoteRole,
): boolean {
  if (!entitlements) return false;
  const target = role === "region_steward" ? "region_steward" : "provider";
  return entitlements.items.some(
    (i) =>
      i.roleTarget === target && (i.status === "paid" || i.status === "active"),
  );
}

export function parseOnboardingPaymentIntentView(raw: unknown): OnboardingPaymentIntentView | null {
  const o = asRecord(raw);
  if (!o || o.status !== "ok") return null;
  const meta = asRecord(o.meta);
  const psp = asRecord(o.psp);
  const checkout = str(psp?.checkout_url);
  const cs = str(psp?.client_secret);
  return {
    entitlementId: str(o.entitlement_id),
    idempotencyKey: str(o.idempotency_key),
    implementationStatus: str(meta?.implementation_status),
    detail: str(meta?.detail),
    hasCheckout: checkout != null,
    hasClientSecret: cs != null,
  };
}

export function parseOnboardingRoleConfirmView(raw: unknown): OnboardingRoleConfirmView | null {
  const o = asRecord(raw);
  if (!o || o.status !== "ok") return null;
  const meta = asRecord(o.meta);
  return {
    role: str(o.role),
    userRole: str(o.user_role),
    implementationStatus: str(meta?.implementation_status),
  };
}

export function onboardingProgressStepCount(role: OnboardingQuoteRole): number {
  return role === "region_steward" ? 3 : 5;
}

export function onboardingProgressStepKey(role: OnboardingQuoteRole, step: number): string {
  if (role === "region_steward") {
    return `stewardProgress_step${step}` as const;
  }
  return `providerProgress_step${step}` as const;
}

export function onboardingQuotePackageKey(role: OnboardingQuoteRole): string {
  return role === "region_steward" ? "me_onboarding_packageSteward" : "me_onboarding_packageProvider";
}

export function onboardingRoleTargetLabel(roleTarget: string, t: (key: string) => string): string {
  if (roleTarget === "region_steward") return t("me_onboarding_roleSteward");
  if (roleTarget === "provider") return t("me_onboarding_roleProvider");
  return roleTarget;
}

export function onboardingEntitlementStatusLabel(status: string, t: (key: string) => string): string {
  const s = status.toLowerCase();
  if (s === "paid" || s === "active") return t("me_onboarding_entitlementStatusPaid");
  if (s === "pending") return t("me_onboarding_entitlementStatusPending");
  return status;
}

export function onboardingEntitlementStatusVariant(status: string): "paid" | "pending" | "neutral" {
  const s = status.toLowerCase();
  if (s === "paid" || s === "active") return "paid";
  if (s === "pending") return "pending";
  return "neutral";
}

export function deriveOnboardingFlowPhase(input: {
  loggedIn: boolean;
  quoteReady: boolean;
  hasActivePaid: boolean;
  hasPaymentDraft: boolean;
  roleConfirmed: boolean;
}): OnboardingFlowPhase {
  if (!input.loggedIn) return "login";
  if (!input.quoteReady) return "quote";
  if (input.roleConfirmed) return "done";
  if (input.hasActivePaid) return "confirm";
  if (input.hasPaymentDraft) return "pay_pending";
  return "pay";
}

/** Console 进度条当前步（与 flowPhase / 角色步数对齐） */
export function deriveOnboardingConsoleProgressStep(
  phase: OnboardingFlowPhase,
  role: OnboardingQuoteRole,
): number {
  const total = onboardingProgressStepCount(role);
  const feeStep = role === "region_steward" ? 3 : 3;
  switch (phase) {
    case "login":
      return 1;
    case "quote":
      return Math.min(2, total);
    case "pay":
    case "pay_pending":
      return Math.min(feeStep, total);
    case "confirm":
      return role === "region_steward" ? Math.min(feeStep, total) : Math.min(feeStep + 1, total);
    case "done":
      return total;
    default:
      return 1;
  }
}

export function deriveOnboardingConsoleProgressAllComplete(phase: OnboardingFlowPhase): boolean {
  return phase === "done";
}

/** 未登录合法来源已出报价：进度高亮「准入费步」而非「登录步」（与 guestQuotePreview 文案一致） */
export function deriveOnboardingGuestPreviewProgressStep(role: OnboardingQuoteRole): number {
  const total = onboardingProgressStepCount(role);
  const feeStep = role === "region_steward" ? 3 : 3;
  return Math.min(feeStep, total);
}

/** 刷新后从 `GET /me` 恢复身份确认态（避免仅依赖 POST 响应内存）。 */
export function onboardingRoleConfirmedForQuote(
  mePayload: unknown,
  quoteRole: OnboardingQuoteRole,
): boolean {
  const user = userFromGetMePayload(mePayload);
  if (!user?.role) return false;
  const roleLc = user.role.trim().toLowerCase();
  if (quoteRole === "provider") return roleLc === "provider";
  if (quoteRole === "region_steward") return roleLc === "region_steward";
  return false;
}

export function onboardingRoleConfirmViewFromMe(
  mePayload: unknown,
  quoteRole: OnboardingQuoteRole,
): OnboardingRoleConfirmView | null {
  if (!onboardingRoleConfirmedForQuote(mePayload, quoteRole)) return null;
  const user = userFromGetMePayload(mePayload);
  const role = user?.role?.trim().toLowerCase() ?? null;
  if (!role) return null;
  return {
    role: quoteRole,
    userRole: role,
    implementationStatus: null,
  };
}
