"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  payHubBreadcrumbCurrentClass,
  payHubBreadcrumbLinkClass,
  payHubBreadcrumbListClass,
  payHubBreadcrumbNavClass,
} from "@/lib/pay/payHubL5";

/** 支付 Hub 顶栏：我的订单 → 支付（列表深链衔接） */
export function PayPageOrdersBreadcrumb() {
  const { t } = useTranslation();
  return (
    <nav
      className={payHubBreadcrumbNavClass}
      aria-label={t("pay_ordersBreadcrumb_aria")}
      data-tt-pay-orders-breadcrumb="1"
    >
      <ol className={payHubBreadcrumbListClass}>
        <li>
          <Link
            href="/orders"
            className={`${touchTargetLink44Classes} inline-flex items-center ${payHubBreadcrumbLinkClass}`}
          >
            {t("nav_orders")}
          </Link>
        </li>
        <li className="text-slate-500 select-none" aria-hidden>
          /
        </li>
        <li className={payHubBreadcrumbCurrentClass} aria-current="page">
          {t("pay_breadcrumb_current")}
        </li>
      </ol>
    </nav>
  );
}
