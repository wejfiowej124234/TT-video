"use client";

import { TT_ORDERS_LIST_L5 } from "@/lib/orders/ordersListL5";

export function OrdersListPinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? TT_ORDERS_LIST_L5.metaDestIcon}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M8 1.5a3 3 0 0 0-3 3c0 2.25 3 6.25 3 6.25s3-4 3-6.25a3 3 0 0 0-3-3Z"
        stroke="currentColor"
        strokeWidth="1.35"
        className="text-ref-sun/90"
      />
      <circle cx="8" cy="4.5" r="1.1" fill="currentColor" className="text-ref-sun/90" />
    </svg>
  );
}

export function OrdersListCalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? TT_ORDERS_LIST_L5.metaDateIcon}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" className="text-ref-coral/85" />
      <path d="M2.5 6.5h11" stroke="currentColor" strokeWidth="1.25" className="text-ref-coral/85" />
      <path d="M5.5 2v2M10.5 2v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" className="text-ref-coral/85" />
    </svg>
  );
}

export function OrdersListSearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="5.25" stroke="currentColor" strokeWidth="1.5" className="text-ref-sun/85" />
      <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ref-sun/85" />
    </svg>
  );
}
