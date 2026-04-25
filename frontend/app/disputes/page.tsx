"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { getDisputes, getMeFull } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { meRoleFromGetMe } from "@/lib/meRole";
import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import TrustInfraWall from "@/components/trust/TrustInfraWall";
import LoadingText from "@/components/LoadingText";
import { useTranslation } from "@/components/LocaleProvider";
import { stashEscrowOrderPrefetchForOrderIdNav } from "@/lib/orderEscrowPrefetch";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
import type { LocaleTranslateFn } from "@/lib/i18n";

type DisputeItem = { id?: string; order_id?: string; status?: string; created_at?: string; resolved_at?: string };

function disputeListStatusPresentation(
  status: string | undefined,
  t: LocaleTranslateFn
): { label: string; className: string } {
  const raw = typeof status === "string" ? status.trim() : "";
  const norm = raw.toLowerCase();
  if (norm === "resolved") {
    return { label: t("disputes_statusResolved"), className: "bg-success/15 text-success" };
  }
  if (norm === "open") {
    return { label: t("disputes_statusOpen"), className: "bg-travel-500/10 text-travel-700" };
  }
  if (norm === "pending") {
    return { label: t("disputes_statusPending"), className: "bg-warning/15 text-warning" };
  }
  const display =
    raw === ""
      ? t("ui_em_dash")
      : raw.length > 40
        ? `${raw.slice(0, 37)}…`
        : raw;
  return {
    label: t("disputes_statusUnknown", { status: display }),
    className: "bg-ink-200/60 text-ink-700",
  };
}

/** 争议列表（28 定稿：Console 区 Design Tokens + 状态色 success/warning + 可信基建墙） */
export default function DisputesPage() {
  const { t } = useTranslation();
  const [list, setList] = useState<DisputeItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isArbitrator, setIsArbitrator] = useState(false);

  useEffect(() => {
    getMeFull()
      .then((me) => setIsArbitrator(meRoleFromGetMe(me) === "arbitrator"))
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("DisputesPage getMeFull:", err);
        }
        setIsArbitrator(false);
      });
  }, []);

  const loadDisputes = useCallback(() => {
    setError(null);
    setLoading(true);
    getDisputes()
      .then((v) => (Array.isArray(v) ? v : []) as DisputeItem[])
      .then(setList)
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("DisputesPage:", err);
        }
        setError(mapApiReadError(err, t, "disputes_requestFailed"));
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  if (loading) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center gap-6 bg-bg-main p-8"
        aria-label={t("disputes_listTitle")}
      >
        <LoadingText />
        <ProductCrossNav
          ariaLabelKey="disputes_relatedNav_aria"
          showGuides
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500"
        />
      </main>
    );
  }
  if (error) {
    return (
      <main className="min-h-screen space-y-4 bg-bg-main p-8 max-w-2xl mx-auto" aria-label={t("disputes_listTitle")}>
        <h1 className="sr-only">{t("disputes_listTitle")}</h1>
        <ApiErrorAlert message={error} />
        <form
          className="inline"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            loadDisputes();
          }}
        >
          <button
            type="submit"
            aria-label={t("common_retry")}
            className={`rounded-full border border-travel-500/50 bg-travel-500/10 px-4 py-2 text-meta font-medium text-travel-700 hover:text-travel-800 hover:bg-travel-500/20 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${travelFocusRingOffset2Classes}`}
          >
            {t("common_retry")}
          </button>
        </form>
        <p>
          <Link
            href="/"
            className={`${touchTargetLink44Classes} text-travel-500 underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
          >
            {t("disputes_navHome")}
          </Link>
        </p>
        <ProductCrossNav ariaLabelKey="disputes_relatedNav_aria" showGuides />
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-bg-main" aria-label={t("disputes_listTitle")}>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-h3 font-semibold text-ink-900 mb-2">{t("disputes_listTitle")}</h1>
        <p className="text-body text-ink-600 mb-6">{t("disputes_listDesc")}</p>
        {isArbitrator && (
          <div
            className="mb-6 rounded-[var(--radius-sm)] border border-travel-200 bg-travel-500/5 p-4 shadow-soft"
            role="region"
            aria-label={t("disputes_arbitratorBannerTitle")}
          >
            <p className="text-body font-semibold text-ink-900">{t("disputes_arbitratorBannerTitle")}</p>
            <p className="text-small text-ink-700 mt-1">{t("disputes_arbitratorBannerDesc")}</p>
          </div>
        )}
        <ul className="space-y-3">
          {list.length === 0 && (
            <li className="list-none py-10 text-center space-y-4">
              <p className="text-body text-ink-500">{t("disputes_empty")}</p>
              <ProductCrossNav
                ariaLabelKey="disputes_relatedNav_aria"
                showGuides
                className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500"
              />
            </li>
          )}
          {list.map((d) => {
            const statusPill = disputeListStatusPresentation(d.status, t);
            return (
            <li key={d.id ?? d.order_id ?? ""} className="rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console p-4 shadow-soft">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-medium text-ink-900">{t("disputes_idShort")}{d.id?.slice(0, 8) ?? t("ui_em_dash")}</span>
                  <span className="text-ink-500 text-small ml-2">{t("disputes_orderShort")} {d.order_id?.slice(0, 8) ?? t("ui_em_dash")}…</span>
                </div>
                <span className={`text-small px-2 py-0.5 rounded-[var(--radius-sm)] ${statusPill.className}`}>
                  {statusPill.label}
                </span>
              </div>
              <p className="text-meta text-ink-500 mt-1">{t("disputes_created")}{d.created_at ?? t("ui_em_dash")}{d.resolved_at ? ` · ${t("disputes_resolved")}${d.resolved_at}` : ""}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                {d.id ? (
                  <Link
                    href={`/disputes/${encodeURIComponent(d.id)}`}
                    className={`${touchTargetLink44Classes} text-small text-travel-500 font-medium hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
                  >
                    {t("disputes_viewDetail")}
                  </Link>
                ) : null}
                {d.order_id ? (
                  <>
                    <Link
                      href={`/escrow/${encodeURIComponent(d.order_id)}`}
                      onClick={() =>
                        d.order_id && stashEscrowOrderPrefetchForOrderIdNav(d.order_id, "escrow")
                      }
                      className={`${touchTargetLink44Classes} text-small text-travel-500 font-medium hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
                    >
                      {t("orders_viewDetail")}
                    </Link>
                    <Link
                      href={`/pay?orderId=${encodeURIComponent(d.order_id)}`}
                      onClick={() => d.order_id && stashEscrowOrderPrefetchForOrderIdNav(d.order_id, "pay")}
                      className={`${touchTargetLink44Classes} text-small text-travel-500 font-medium hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
                    >
                      {t("orders_payHub")}
                    </Link>
                  </>
                ) : null}
              </div>
            </li>
            );
          })}
        </ul>
        <footer className="mt-12 pt-8 border-t border-ink-200">
          <TrustInfraWall />
          <ProductCrossNav ariaLabelKey="disputes_relatedNav_aria" showGuides className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500" />
        </footer>
      </section>
    </main>
  );
}
