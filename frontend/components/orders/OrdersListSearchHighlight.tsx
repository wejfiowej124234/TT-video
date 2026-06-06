"use client";

import { Fragment, useMemo } from "react";
import { splitTextByOrdersListSearchQuery } from "@/lib/orders/ordersListClientSearch";
import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";

export function OrdersListSearchHighlight({ text, query }: { text: string; query: string }) {
  const parts = useMemo(() => splitTextByOrdersListSearchQuery(text, query), [text, query]);
  const hasMatch = parts.some((part) => part.match);
  if (!hasMatch) return <>{text}</>;

  return (
    <>
      {parts.map((part, i) =>
        part.match ? (
          <mark key={i} className={TT_ORDERS_LIST_L5.searchHighlightMark}>
            {part.text}
          </mark>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}
