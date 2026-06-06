"use client";

import { shortHexAddr } from "@/lib/feeRouterWiring";
import type { FeeRouteItem } from "./governanceFeeRoutesPageModel";

type GovernanceFeeRoutesEventsTableProps = {
  items: FeeRouteItem[];
  t: (key: string) => string;
};

export function GovernanceFeeRoutesEventsTable({ items, t }: GovernanceFeeRoutesEventsTableProps) {
  return (
    <div className="mt-6 overflow-x-auto rounded-[var(--radius-md)] border border-ink-200">
      <table className="min-w-full border-collapse text-left text-small">
        <thead className="bg-ink-50 text-meta font-medium uppercase tracking-wide text-ink-600">
          <tr>
            <th className="whitespace-nowrap px-3 py-2">{t("governance_fee_routes_col_block")}</th>
            <th className="whitespace-nowrap px-3 py-2">{t("governance_fee_routes_col_tx")}</th>
            <th className="whitespace-nowrap px-3 py-2">{t("governance_fee_routes_col_token")}</th>
            <th className="whitespace-nowrap px-3 py-2">{t("governance_fee_routes_col_amount")}</th>
            <th className="whitespace-nowrap px-3 py-2">{t("governance_fee_routes_col_country")}</th>
            <th className="whitespace-nowrap px-3 py-2">{t("governance_fee_routes_col_stakers")}</th>
            <th className="whitespace-nowrap px-3 py-2">{t("governance_fee_routes_col_reserve")}</th>
            <th className="whitespace-nowrap px-3 py-2">{t("governance_fee_routes_col_ops")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 font-mono text-meta text-ink-800">
          {items.map((row) => (
            <tr key={row.id} className="hover:bg-ink-50">
              <td className="whitespace-nowrap px-3 py-2" title={`#${row.block_number} log ${row.log_index}`}>
                {row.block_number}
                <span className="text-ink-500">:{row.log_index}</span>
              </td>
              <td className="max-w-[8rem] truncate px-3 py-2" title={row.tx_hash}>
                {shortHexAddr(row.tx_hash)}
              </td>
              <td className="max-w-[8rem] truncate px-3 py-2" title={row.token_address}>
                {shortHexAddr(row.token_address)}
              </td>
              <td className="max-w-[7rem] truncate px-3 py-2" title={row.amount_u256_hex}>
                {shortHexAddr(row.amount_u256_hex, 4, 4)}
              </td>
              <td className="max-w-[7rem] truncate px-3 py-2" title={row.to_country_u256_hex}>
                {shortHexAddr(row.to_country_u256_hex, 4, 4)}
              </td>
              <td className="max-w-[7rem] truncate px-3 py-2" title={row.to_stakers_u256_hex}>
                {shortHexAddr(row.to_stakers_u256_hex, 4, 4)}
              </td>
              <td className="max-w-[7rem] truncate px-3 py-2" title={row.to_reserve_u256_hex}>
                {shortHexAddr(row.to_reserve_u256_hex, 4, 4)}
              </td>
              <td className="max-w-[7rem] truncate px-3 py-2" title={row.to_ops_u256_hex}>
                {shortHexAddr(row.to_ops_u256_hex, 4, 4)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
