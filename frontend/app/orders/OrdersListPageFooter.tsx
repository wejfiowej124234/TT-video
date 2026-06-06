"use client";

import { OrdersProductFooter } from "@/components/orders/OrdersProductFooter";
import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";
import { TT_ORDERS_PRODUCT_FOOTER } from "@/lib/orders/ordersProductFooterL5";

/** 我的订单 · 精简 L5 页脚（cross-nav + 版权 · 非首页多栏 `LandingFooter`） */
export function OrdersListPageFooter() {
  return (
    <div className={TT_ORDERS_LIST_L5.footerWrap}>
      <div className={TT_ORDERS_LIST_L5.footerTopFade} aria-hidden />
      <OrdersProductFooter
        ariaLabelKey="orders_list_relatedNav_aria"
        innerClassName={TT_ORDERS_PRODUCT_FOOTER.innerWide}
      />
    </div>
  );
}
