"use client";

export function EscrowDetailItineraryBudgetZoneLockedPanel({ panelClass, t }: { panelClass: string; t: (key: string) => string }) {
  return (
    <div className={`${panelClass} p-4 space-y-2`}>
      <h3 className="text-body-l font-semibold text-cyan-200">{t("escrow_itineraryBudget")}</h3>
      <p className="text-meta text-slate-300 leading-relaxed" role="status">
        {t("escrow_itineraryLockHint")}
      </p>
    </div>
  );
}
