"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { meSettingsDisputesHrefSuffix } from "@/lib/me/meSettingsExtensionContext";
import { getDisputes, getMeFull } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { meRoleFromGetMe } from "@/lib/meRole";
import { disputeListStatusPresentation } from "@/lib/disputeListStatusPresentation";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import LoadingText from "@/components/LoadingText";
import { DisputesL5FooterLinks } from "@/components/disputes/DisputesL5FooterLinks";
import { DisputesL5PageShell } from "@/components/disputes/DisputesL5PageShell";
import { MeSettingsSubpageHeader } from "@/components/me/MeSettingsSubpageHeader";
import { useTranslation } from "@/components/LocaleProvider";
import { formatUserFacingDateTime } from "@/lib/formatUserFacingDateTime";
import { stashEscrowOrderPrefetchForOrderIdNav } from "@/lib/orderEscrowPrefetch";
import { TT_DISPUTES_L5 } from "@/lib/me/disputesL5";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

type DisputeItem = { id?: string; order_id?: string; status?: string; created_at?: string; resolved_at?: string };

/** 争议列表 · 设置族 L5 延伸（①） */
export function DisputesListPageMain() {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const disputesFromSettings = meSettingsDisputesHrefSuffix(searchParams.get("from"));
  const [list, setList] = useState<DisputeItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isArbitrator, setIsArbitrator] = useState(false);

  useEffect(() => {
    getMeFull()
      .then((me) => setIsArbitrator(meRoleFromGetMe(me) === "arbitrator"))
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("DisputesListPageMain getMeFull:", err);
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
          console.error("DisputesListPageMain:", err);
        }
        setError(mapApiReadError(err, t, "disputes_requestFailed"));
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  return (
    <DisputesL5PageShell t={t} ariaLabel={t("disputes_listTitle")} variant="list">
      <MeSettingsSubpageHeader
        t={t}
        eyebrowKey="me_settings_section_travel"
        titleKey="disputes_listTitle"
        subtitleKey="disputes_listDesc"
      />

      {loading ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4" aria-busy="true">
          <LoadingText />
        </div>
      ) : null}

      {!loading && error ? (
        <div className="space-y-4" role="alert">
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
              className={`${TT_ME_SETTINGS_L5.logoutBtn} min-h-[44px] border-ref-sun/35 bg-ref-sun/10 text-ref-sun hover:bg-ref-sun/15`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          {isArbitrator ? (
            <div className={TT_DISPUTES_L5.arbitratorBanner} role="region" aria-label={t("disputes_arbitratorBannerTitle")}>
              <p className="font-semibold text-slate-100">{t("disputes_arbitratorBannerTitle")}</p>
              <p className="mt-1">{t("disputes_arbitratorBannerDesc")}</p>
            </div>
          ) : null}
          <ul className="space-y-3" role="list">
            {list.length === 0 ? (
              <li className="list-none py-10 text-center" data-tt-disputes-empty="1">
                <p className={TT_DISPUTES_L5.listMeta}>{t("disputes_empty")}</p>
              </li>
            ) : null}
            {list.map((d) => {
              const statusPill = disputeListStatusPresentation(d.status, t);
              return (
                <li key={d.id ?? d.order_id ?? ""} className={`list-none ${TT_DISPUTES_L5.listCard}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className={TT_DISPUTES_L5.listTitle}>
                        {t("disputes_idShort")}
                        {d.id?.slice(0, 8) ?? t("ui_em_dash")}
                      </span>
                      <span className={`${TT_DISPUTES_L5.listMeta} ml-2`}>
                        {t("disputes_orderShort")} {d.order_id?.slice(0, 8) ?? t("ui_em_dash")}…
                      </span>
                    </div>
                    <span className={`text-small px-2 py-0.5 rounded-md ${statusPill.className}`}>{statusPill.label}</span>
                  </div>
                  <p className={`${TT_DISPUTES_L5.listMeta} mt-1`}>
                    {t("disputes_created")}
                    <time dateTime={d.created_at ?? undefined}>
                      {formatUserFacingDateTime(d.created_at, locale, t("ui_em_dash"))}
                    </time>
                    {d.resolved_at ? (
                      <>
                        {" · "}
                        {t("disputes_resolved")}
                        <time dateTime={d.resolved_at}>
                          {formatUserFacingDateTime(d.resolved_at, locale, t("ui_em_dash"))}
                        </time>
                      </>
                    ) : null}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {d.id ? (
                      <Link
                        href={`/disputes/${encodeURIComponent(d.id)}${disputesFromSettings}`}
                        className={TT_DISPUTES_L5.listLink}
                      >
                        {t("disputes_viewDetail")}
                      </Link>
                    ) : null}
                    {d.order_id ? (
                      <>
                        <Link
                          href={`/escrow/${encodeURIComponent(d.order_id)}`}
                          onClick={() => d.order_id && stashEscrowOrderPrefetchForOrderIdNav(d.order_id, "escrow")}
                          className={TT_DISPUTES_L5.listLink}
                        >
                          {t("orders_viewDetail")}
                        </Link>
                        <Link
                          href={`/pay?orderId=${encodeURIComponent(d.order_id)}`}
                          onClick={() => d.order_id && stashEscrowOrderPrefetchForOrderIdNav(d.order_id, "pay")}
                          className={TT_DISPUTES_L5.listLink}
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
        </>
      ) : null}

      <DisputesL5FooterLinks t={t} />
    </DisputesL5PageShell>
  );
}
