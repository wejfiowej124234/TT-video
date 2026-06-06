"use client";

import Link from "next/link";
import { marketCyanInlineLinkFocusClasses, marketCyanPillControlFocusClasses } from "@/lib/travelLinkFocus";
import type { OrderRow } from "./types";

export function EscrowDetailItineraryBudgetZoneToolbar({
  order,
  state,
  isDraft,
  canPatchItinerary,
  savingItinerary,
  onSaveItinerary,
  deleteOrderPending,
  deleteOrderError,
  patchItineraryError,
  patchItinerarySuccess,
  onDeleteOrder,
  t,
}: {
  order: OrderRow;
  state: string;
  isDraft: boolean;
  canPatchItinerary: boolean;
  savingItinerary: boolean;
  onSaveItinerary: () => void | Promise<void>;
  deleteOrderPending: boolean;
  deleteOrderError: string | null;
  patchItineraryError: string | null;
  patchItinerarySuccess: boolean;
  onDeleteOrder: () => void | Promise<void>;
  t: (key: string) => string;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-body-l font-semibold text-cyan-200">{t("escrow_itineraryBudget")}</h3>
          {canPatchItinerary && (
            <p className="text-meta text-slate-300 mt-0.5" role="status">
              {t("escrow_saveItineraryHint")}
            </p>
          )}
          <p className="text-meta text-slate-300 mt-0.5" role="status">
            {t("escrow_itineraryLockHint")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canPatchItinerary && (
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                void onSaveItinerary();
              }}
            >
              <button
                type="submit"
                disabled={savingItinerary}
                className={`px-4 py-2 text-small font-medium rounded-[var(--radius-md)] bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${marketCyanPillControlFocusClasses}`}
                aria-busy={savingItinerary ? true : undefined}
                aria-label={t("escrow_saveItinerary")}
              >
                {savingItinerary ? t("common_loading") : t("escrow_saveItinerary")}
              </button>
            </form>
          )}
          {isDraft && (
            <Link
              href={`/itinerary/new?fromOrder=${encodeURIComponent(String(order.id))}`}
              className={`text-small font-medium text-cyan-300 hover:text-cyan-100 hover:underline transition-colors ${marketCyanInlineLinkFocusClasses}`}
              aria-label={t("escrow_editItineraryLink")}
            >
              {t("escrow_editItineraryLink")}
            </Link>
          )}
          {(isDraft || state === "created" || state === "accepted") && (
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                void onDeleteOrder();
              }}
            >
              <button
                type="submit"
                disabled={deleteOrderPending}
                className="text-small font-medium text-danger/90 hover:text-danger hover:underline transition-colors disabled:opacity-50 rounded-[var(--radius-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
                aria-label={t("escrow_deleteOrder")}
                aria-busy={deleteOrderPending ? true : undefined}
              >
                {deleteOrderPending ? t("common_submitting") : t("escrow_deleteOrder")}
              </button>
            </form>
          )}
        </div>
      </div>
      {deleteOrderError && (
        <p className="text-small text-danger" role="alert">
          {deleteOrderError}
        </p>
      )}
      {patchItineraryError && (
        <p className="text-small text-danger" role="alert">
          {patchItineraryError}
        </p>
      )}
      {patchItinerarySuccess && (
        <p className="text-small text-success" role="status">
          {t("escrow_saveItinerarySuccess")}
        </p>
      )}
    </>
  );
}
