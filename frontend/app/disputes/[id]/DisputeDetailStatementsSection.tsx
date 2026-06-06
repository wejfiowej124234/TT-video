"use client";

import Link from "next/link";
import { stashEscrowOrderPrefetchForOrderIdNav } from "@/lib/orderEscrowPrefetch";
import { TT_DISPUTES_L5 } from "@/lib/me/disputesL5";
import type { DisputeDetail } from "./disputeDetailPageTypes";
import type { DisputeDetailPageModel } from "./useDisputeDetailPage";
import { DISPUTE_DETAIL_SECTION_CLASS } from "./disputeDetailChrome";

type Props = Pick<DisputeDetailPageModel, "t"> & { dispute: DisputeDetail };

export function DisputeDetailStatementsSection({ t, dispute }: Props) {
  return (
    <section className={DISPUTE_DETAIL_SECTION_CLASS}>
      <h2 className={TT_DISPUTES_L5.sectionHeading}>{t("dispute_statements")}</h2>
      <p className={TT_DISPUTES_L5.sectionBody}>
        {t("dispute_statementsNote")}
        {dispute.order_id ? (
          <>
            <Link
              href={`/escrow/${encodeURIComponent(dispute.order_id)}`}
              onClick={() => {
                const oid = dispute.order_id;
                if (oid) stashEscrowOrderPrefetchForOrderIdNav(oid, "escrow");
              }}
              className={TT_DISPUTES_L5.listLink}
            >
              #{dispute.order_id.slice(0, 8)}…
            </Link>
            {" · "}
            <Link
              href={`/pay?orderId=${encodeURIComponent(dispute.order_id)}`}
              onClick={() => {
                const oid = dispute.order_id;
                if (oid) stashEscrowOrderPrefetchForOrderIdNav(oid, "pay");
              }}
              className={TT_DISPUTES_L5.listLink}
            >
              {t("orders_payHub")}
            </Link>
          </>
        ) : null}
      </p>
    </section>
  );
}
