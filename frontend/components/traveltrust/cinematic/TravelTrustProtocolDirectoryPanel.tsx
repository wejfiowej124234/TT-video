"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import {
  OFFICIAL_MAINNET_PROTOCOL_DIRECTORY_ROWS,
  etherscanAddressUrl,
  officialProtocolDirectoryGroupLabelKey,
  shortenEvmAddress,
} from "@/lib/traveltrustOfficialMainnetProtocolDirectory";
import { TT_ANNOUNCEMENTS_PAGE_L5 } from "@/lib/traveltrust/l5";

/** Official www 「协议总清单」 — read-only mainnet registry (≠ Production GO). */
export function TravelTrustProtocolDirectoryPanel() {
  const { t } = useTranslation();

  return (
    <section
      className="mt-4 sm:mt-5"
      aria-labelledby="traveltrust-protocol-directory-title"
      data-tt-traveltrust-protocol-directory="1"
    >
      <div className={`${TT_ANNOUNCEMENTS_PAGE_L5.listPlateClass} px-4 py-5 sm:px-5 sm:py-6`}>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ref-sun/75">
          {t("traveltrust_protocol_directory_kicker")}
        </p>
        <h2
          id="traveltrust-protocol-directory-title"
          className="mt-1 text-h5 font-bold text-white sm:text-h4"
        >
          {t("traveltrust_protocol_directory_title")}
        </h2>
        <p className="mt-2 text-meta leading-relaxed text-slate-400/92">
          {t("traveltrust_protocol_directory_disclaimer")}
        </p>

        <div className="mt-5 overflow-x-auto" role="region" aria-label={t("traveltrust_protocol_directory_table_caption")}>
          <table className="w-full min-w-[320px] border-collapse text-left">
            <caption className="sr-only">{t("traveltrust_protocol_directory_table_caption")}</caption>
            <thead>
              <tr className="border-b border-white/10 text-meta text-slate-400">
                <th scope="col" className="pb-2 pr-3 font-medium">
                  {t("traveltrust_protocol_directory_col_order")}
                </th>
                <th scope="col" className="pb-2 pr-3 font-medium">
                  {t("traveltrust_protocol_directory_col_contract")}
                </th>
                <th scope="col" className="pb-2 font-medium">
                  {t("traveltrust_protocol_directory_col_group")}
                </th>
              </tr>
            </thead>
            <tbody>
              {OFFICIAL_MAINNET_PROTOCOL_DIRECTORY_ROWS.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/[0.06] align-top last:border-b-0"
                  data-tt-traveltrust-protocol-directory-row={row.id}
                >
                  <td className="py-4 pr-3 text-meta tabular-nums text-slate-400">{row.order}</td>
                  <td className="py-4 pr-3">
                    <p className="text-small font-semibold text-white">{t(row.titleKey)}</p>
                    <p className="mt-1 max-w-xl text-meta leading-relaxed text-slate-400/90">
                      {t(row.descriptionKey)}
                    </p>
                  </td>
                  <td className="py-4">
                    <Link
                      href={etherscanAddressUrl(row.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full flex-col gap-1 rounded-lg border border-[#f9d779]/35 bg-[rgba(249,215,121,0.08)] px-3 py-2 text-left transition hover:border-[#f9d779]/55 hover:bg-[rgba(249,215,121,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50"
                      data-tt-traveltrust-protocol-directory-link={row.id}
                    >
                      <span className="text-[11px] font-semibold text-[#f9d779]">
                        {t(officialProtocolDirectoryGroupLabelKey(row.group))}
                      </span>
                      <span className="font-mono text-[12px] text-[#f9d779]/95">
                        {shortenEvmAddress(row.address)}
                      </span>
                      <span className="sr-only">{row.address}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
