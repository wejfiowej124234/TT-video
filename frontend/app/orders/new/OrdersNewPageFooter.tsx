"use client";

import { OrdersProductFooter } from "@/components/orders/OrdersProductFooter";
import { TT_ORDERS_NEW_L5 } from "@/lib/orders/ordersNewL5";
import { TT_ORDERS_PRODUCT_FOOTER } from "@/lib/orders/ordersProductFooterL5";

/** 创建订单 · 精简 L5 页脚（与列表同源 · 非 `LandingFooter`） */
export function OrdersNewPageFooter() {
  return (
    <div className={TT_ORDERS_NEW_L5.footerWrap}>
      <div className={TT_ORDERS_NEW_L5.footerTopFade} aria-hidden />
      <OrdersProductFooter
        ariaLabelKey="orders_new_relatedNav_aria"
        innerClassName={TT_ORDERS_PRODUCT_FOOTER.innerNarrow}
      />
    </div>
  );
}
