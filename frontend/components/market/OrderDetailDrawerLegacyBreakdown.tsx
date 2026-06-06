"use client";

import {
  GUIDE_LEVEL_KEYS,
  formatAmount,
  type OrderDetailItem,
} from "./orderDetailDrawerModel";
import { marketDetailDrawerMetaList } from "@/components/market/marketDetailDrawerClasses";

/** discover 卡片仅有 legacy `breakdown`、尚无 `daily_itinerary` 时的行内拆分表 */
export function OrderDetailDrawerLegacyBreakdown({
  displayOrder,
  t,
  dash,
  orderCurrency,
}: {
  displayOrder: OrderDetailItem;
  t: (key: string) => string;
  dash: string;
  orderCurrency: string;
}) {
  const b = displayOrder.breakdown;
  if (!b) return null;
  return (
    <ul className={`${marketDetailDrawerMetaList} mt-2 text-slate-300`} role="list">
      {b.hotel != null && (
        <li>
          {t("escrow_hotel")}
          {formatAmount(b.hotel, dash)} {orderCurrency}
        </li>
      )}
      {(b.food != null || b.catering != null) && (
        <li>
          {t("escrow_catering")}
          {formatAmount(b.food ?? b.catering, dash)} {orderCurrency}
        </li>
      )}
      {b.tickets != null && (
        <li>
          {t("escrow_tickets")}
          {formatAmount(b.tickets, dash)} {orderCurrency}
        </li>
      )}
      {b.guideFee != null && (
        <li>
          {displayOrder.guideLevel && GUIDE_LEVEL_KEYS[displayOrder.guideLevel] && (
            <>{t(GUIDE_LEVEL_KEYS[displayOrder.guideLevel])} · </>
          )}
          {t("escrow_guideFee")}
          {formatAmount(b.guideFee, dash)} {orderCurrency}
        </li>
      )}
      {(b.carFee != null || b.vehicle != null) && (
        <li>
          {t("escrow_vehicle")}
          {formatAmount(b.carFee ?? b.vehicle, dash)} {orderCurrency}
        </li>
      )}
      {(b.platform_fee != null || b.misc != null) && (
        <li>
          {t("escrow_platformFee")}
          {formatAmount(b.platform_fee ?? b.misc, dash)} {orderCurrency}
        </li>
      )}
      {b.total_budget != null && (
        <li className="font-semibold text-slate-100 pt-1.5 border-t border-white/15 mt-1">
          {t("escrow_totalBudget")}
          {formatAmount(b.total_budget, dash)} {orderCurrency}
        </li>
      )}
    </ul>
  );
}
