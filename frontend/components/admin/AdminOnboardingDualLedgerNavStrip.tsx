"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";
import { adminFilterChipClass, adminPageNavLinkClass } from "@/lib/adminUi";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const LEDGER_ROUTES = {
  payment: "/admin/onboarding/payment-events",
  webhook: "/admin/onboarding/webhook-jobs",
} as const;

/** ONB-04 · payment-events ↔ webhook-jobs 双台账快捷导航（① · ② 真 webhook 另闸）。 */
export function AdminOnboardingDualLedgerNavStrip() {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <nav
      className="mt-4 flex flex-wrap gap-2"
      aria-label={t("admin_onboarding_dual_ledger_nav_aria")}
      data-tt-admin-onboarding-dual-ledger-nav="1"
    >
      <Link
        href={LEDGER_ROUTES.payment}
        aria-current={pathname === LEDGER_ROUTES.payment ? "page" : undefined}
        className={`inline-flex min-h-[36px] items-center rounded-[var(--radius-sm)] border px-3 py-1 text-small font-medium ${adminFilterChipClass(pathname === LEDGER_ROUTES.payment)} ${adminPageNavLinkClass()} ${travelFocusRingOffset2Classes}`}
        data-tt-admin-onboarding-dual-ledger-payment="1"
      >
        {t("admin_onboarding_dual_ledger_payment")}
      </Link>
      <Link
        href={LEDGER_ROUTES.webhook}
        aria-current={pathname === LEDGER_ROUTES.webhook ? "page" : undefined}
        className={`inline-flex min-h-[36px] items-center rounded-[var(--radius-sm)] border px-3 py-1 text-small font-medium ${adminFilterChipClass(pathname === LEDGER_ROUTES.webhook)} ${adminPageNavLinkClass()} ${travelFocusRingOffset2Classes}`}
        data-tt-admin-onboarding-dual-ledger-webhook="1"
      >
        {t("admin_onboarding_dual_ledger_webhook")}
      </Link>
      <Link
        href="/admin/onboarding#admin-onboarding-hub-ledger"
        className={`inline-flex min-h-[36px] items-center px-2 text-small font-medium ${adminPageNavLinkClass()} ${travelFocusRingOffset2Classes}`}
        data-tt-admin-onboarding-dual-ledger-hub="1"
      >
        {t("admin_onboarding_hub_title")}
      </Link>
      <Link
        href="/admin/inbox"
        className={`inline-flex min-h-[36px] items-center px-2 text-small font-medium ${adminPageNavLinkClass()} ${travelFocusRingOffset2Classes}`}
        data-tt-admin-onboarding-dual-ledger-inbox="1"
      >
        {t("admin_unified_inbox_nav_short")}
      </Link>
    </nav>
  );
}
