"use client";

import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";

function OrdersListHintChevron() {
  return (
    <svg className={TT_ORDERS_LIST_L5.hintChevron} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 列表操作说明 · 默认收起（① · 收起态仅顶部分隔线 + 文案） */
export function OrdersListInteractionHint({ t }: { t: (key: string) => string }) {
  return (
    <details className={TT_ORDERS_LIST_L5.hintBarSlim} data-tt-orders-list-hint="1">
      <summary className={TT_ORDERS_LIST_L5.hintToggle} aria-label={t("orders_list_help_toggle_aria")}>
        <span>{t("orders_list_help_toggle")}</span>
        <OrdersListHintChevron />
      </summary>
      <div className={TT_ORDERS_LIST_L5.hintBody}>
        <p className="sm:hidden">{t("orders_list_swipe_hint")}</p>
        <p className="hidden sm:block">{t("orders_clickCardHint")}</p>
        <p className="hidden sm:block">
          {t("orders_list_keyboard_hint")}
          <span className={TT_ORDERS_LIST_L5.hintSeparator} aria-hidden>
            {" "}
            ·{" "}
          </span>
          {t("orders_list_keyboard_enter_hint")}
        </p>
      </div>
    </details>
  );
}
