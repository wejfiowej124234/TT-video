"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  escrowProtocolBreadcrumbCurrentClass,
  escrowProtocolBreadcrumbLinkClass,
  escrowProtocolBreadcrumbListClass,
  escrowProtocolBreadcrumbNavClass,
} from "@/lib/escrowProtocolUi";

/** 协议壳顶栏：我的订单 → 订单详情（列表深链衔接） */
export default function EscrowDetailOrdersBreadcrumb() {
  const { t } = useTranslation();
  return (
    <nav
      className={escrowProtocolBreadcrumbNavClass}
      aria-label={t("escrow_ordersBreadcrumb_aria")}
      data-tt-escrow-orders-breadcrumb="1"
    >
      <ol className={escrowProtocolBreadcrumbListClass}>
        <li>
          <Link
            href="/orders"
            className={`${touchTargetLink44Classes} inline-flex items-center ${escrowProtocolBreadcrumbLinkClass}`}
          >
            {t("nav_orders")}
          </Link>
        </li>
        <li className="text-slate-500 select-none" aria-hidden>
          /
        </li>
        <li className={escrowProtocolBreadcrumbCurrentClass} aria-current="page">
          {t("escrow_breadcrumb_current")}
        </li>
      </ol>
    </nav>
  );
}
