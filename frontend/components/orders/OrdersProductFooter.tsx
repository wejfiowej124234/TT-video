"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  ORDERS_PRODUCT_FOOTER_DATA_ATTR,
  TT_ORDERS_PRODUCT_FOOTER,
} from "@/lib/orders/ordersProductFooterL5";

export type OrdersProductFooterProps = {
  /** i18n key for `<nav>` landmark */
  ariaLabelKey: string;
  /** 列表 `max-w-5xl` · 创建页 `max-w-md` */
  innerClassName?: string;
};

/** `/orders` · `/orders/new` 产品页精简页脚（① · 非 `LandingFooter` 多栏营销页脚） */
export function OrdersProductFooter({
  ariaLabelKey,
  innerClassName = TT_ORDERS_PRODUCT_FOOTER.innerWide,
}: OrdersProductFooterProps) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer
      className={TT_ORDERS_PRODUCT_FOOTER.shell}
      role="contentinfo"
      data-tt-orders-product-footer={ORDERS_PRODUCT_FOOTER_DATA_ATTR}
    >
      <div className={innerClassName}>
        <ProductCrossNav
          ariaLabelKey={ariaLabelKey}
          showGuides
          hideFeeRouterLinks
          className={TT_ORDERS_PRODUCT_FOOTER.crossNav}
          linkClassName={TT_ORDERS_PRODUCT_FOOTER.crossNavLink}
          separatorClassName={TT_ORDERS_PRODUCT_FOOTER.crossNavSeparator}
        />
        <div className={TT_ORDERS_PRODUCT_FOOTER.metaBlock}>
          <p className={TT_ORDERS_PRODUCT_FOOTER.copyright}>
            {t("footer_copyright").replace("{{year}}", String(year))}
          </p>
          <p className={TT_ORDERS_PRODUCT_FOOTER.tagline}>{t("footer_tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
