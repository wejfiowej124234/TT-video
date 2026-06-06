"use client";

import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import {
  balanceLineShortLabel,
  governanceCountryPoolRootChainSsot,
  governancePoolIsChainReadRow,
  governanceTreasuryErc20PoolRootChainSsot,
  governanceTreasuryPoolRootChainSsot,
  looksLikeEvmAddress,
  type PoolRes,
} from "./governanceHubPageModel";

type Props = {
  pool: PoolRes | null;
  poolHttpError: string | null;
};

export function GovernanceHubPoolSection({ pool, poolHttpError }: Props) {
  const { t } = useTranslation();

  const poolCurrencyTrim =
    pool != null && typeof pool.currency === "string" ? pool.currency.trim() : "";
  const poolHasBalance = pool?.pool_balance != null;
  const showPoolChainSsotBadge =
    governancePoolIsChainReadRow(pool) && pool.is_chain_ssot === true;
  const showCountryPoolRootSsot = governanceCountryPoolRootChainSsot(pool);
  const showTreasuryPoolRootSsot = governanceTreasuryPoolRootChainSsot(pool);
  const showTreasuryErc20PoolRootSsot = governanceTreasuryErc20PoolRootChainSsot(pool);

  return (
    <div>
      <h2 className="text-h4 font-medium text-ink-800">{t("governance_pool_label")}</h2>
      {poolHttpError ? (
        <div className="mt-1">
          <ApiErrorAlert message={poolHttpError} />
        </div>
      ) : (
        <div className="mt-2 space-y-4">
          {Array.isArray(pool?.balance_lines_v1) && pool.balance_lines_v1.length > 0 ? (
            <div className="space-y-2 rounded-[var(--radius-sm)] border border-ink-200/80 bg-ink-50/60 p-3 dark:border-ink-700/60 dark:bg-ink-900/20">
              <p className="text-meta font-medium text-ink-700 dark:text-ink-200">
                Track-labeled balances (P0)
              </p>
              <p className="text-meta text-ink-500">
                No “total balance” is shown here; each line is explicit about its track and source.
              </p>
              <div className="grid gap-2">
                {pool.balance_lines_v1.map((line, i) => (
                  <div
                    key={`${line.track_type}-${line.source}-${i}`}
                    className="rounded-[var(--radius-sm)] border border-ink-200/70 bg-white/60 px-3 py-2 dark:border-ink-700/60 dark:bg-ink-950/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-small font-medium text-ink-800 dark:text-ink-100">
                        {balanceLineShortLabel(line)}
                      </p>
                      {typeof line.currency === "string" && line.currency.trim() ? (
                        <p className="text-meta text-ink-500 dark:text-ink-400">
                          {line.currency.trim()}
                        </p>
                      ) : null}
                    </div>
                    <p className="mt-1 break-all font-mono text-small text-ink-800 dark:text-ink-100">
                      {line.balance == null ? "—" : String(line.balance)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {governancePoolIsChainReadRow(pool) ? (
            <div className="space-y-3">
              {showPoolChainSsotBadge ? (
                <p className="inline-flex rounded-[var(--radius-sm)] border border-ref-sun/30 bg-ref-sun/10 px-2 py-1 text-small font-medium text-ink-800 dark:border-ref-sun/35 dark:bg-ref-sun/10 dark:text-ink-100">
                  {t("governance_chain_read_ssot_badge")}
                </p>
              ) : null}
              <div>
                <p className="text-meta text-ink-600">{t("governance_chain_read_raw_balance_caption")}</p>
                <p className="mt-1 break-all font-mono text-small text-ink-800">
                  {pool.pool_balance != null ? String(pool.pool_balance) : "—"}
                </p>
              </div>
              {poolCurrencyTrim ? (
                <div>
                  <p className="text-meta text-ink-600">
                    {looksLikeEvmAddress(poolCurrencyTrim)
                      ? t("governance_chain_read_token_contract_caption")
                      : t("governance_chain_read_currency_field_caption")}
                  </p>
                  <p
                    className={
                      looksLikeEvmAddress(poolCurrencyTrim)
                        ? "mt-1 break-all font-mono text-small text-ink-800"
                        : "mt-1 text-body text-ink-700"
                    }
                  >
                    {poolCurrencyTrim}
                  </p>
                </div>
              ) : null}
              {pool.updated_at == null ? (
                <p className="text-meta text-ink-500">{t("governance_chain_read_no_table_updated_at")}</p>
              ) : null}
            </div>
          ) : poolHasBalance && poolCurrencyTrim ? (
            <p className="text-body text-ink-700">
              {pool?.pool_balance} {poolCurrencyTrim}
            </p>
          ) : poolHasBalance && !poolCurrencyTrim ? (
            <p className="text-body text-ink-700">
              {t("governance_pool_balance_currency_unspecified", {
                amount: String(pool?.pool_balance),
              })}
            </p>
          ) : pool?.data_source === "database" || pool?.data_source === "database_empty" ? (
            <p className="text-body text-ink-500">{t("governance_pool_db_empty")}</p>
          ) : (
            <p className="text-body text-ink-500">{t("governance_pool_placeholder")}</p>
          )}

          {showCountryPoolRootSsot ? (
            <div
              className="space-y-3 border-t border-ink-200/80 pt-4 dark:border-ink-700/80"
              aria-label={t("governance_country_pool_root_section_label")}
            >
              <p className="text-meta font-medium text-ink-700 dark:text-ink-300">
                {t("governance_country_pool_root_section_label")}
              </p>
              <p className="inline-flex rounded-[var(--radius-sm)] border border-ref-sun/30 bg-ref-sun/10 px-2 py-1 text-small font-medium text-ink-800 dark:border-ref-sun/35 dark:bg-ref-sun/10 dark:text-ink-100">
                {t("governance_chain_read_ssot_badge")}
              </p>
              <div>
                <p className="text-meta text-ink-600">{t("governance_country_pool_root_raw_value_caption")}</p>
                <p className="mt-1 break-all font-mono text-small text-ink-800">{pool.country_pool}</p>
              </div>
              {poolCurrencyTrim && looksLikeEvmAddress(poolCurrencyTrim) ? (
                <div>
                  <p className="text-meta text-ink-600">{t("governance_country_pool_root_token_address_caption")}</p>
                  <p className="mt-1 break-all font-mono text-small text-ink-800">{poolCurrencyTrim}</p>
                </div>
              ) : null}
              <p className="text-meta text-ink-500">{t("governance_country_pool_root_observation_hint")}</p>
            </div>
          ) : null}

          {showTreasuryPoolRootSsot ? (
            <div
              className="space-y-3 border-t border-ink-200/80 pt-4 dark:border-ink-700/80"
              aria-label={t("governance_treasury_native_root_section_label")}
            >
              <p className="text-meta font-medium text-ink-700 dark:text-ink-300">
                {t("governance_treasury_native_root_section_label")}
              </p>
              <p className="inline-flex rounded-[var(--radius-sm)] border border-ref-sun/30 bg-ref-sun/10 px-2 py-1 text-small font-medium text-ink-800 dark:border-ref-sun/35 dark:bg-ref-sun/10 dark:text-ink-100">
                {t("governance_chain_read_ssot_badge")}
              </p>
              <div>
                <p className="text-meta text-ink-600">{t("governance_treasury_native_root_raw_wei_caption")}</p>
                <p className="mt-1 break-all font-mono text-small text-ink-800">{pool.treasury_pool}</p>
              </div>
              <p className="text-meta text-ink-500">{t("governance_treasury_native_root_observation_hint")}</p>
            </div>
          ) : null}

          {showTreasuryErc20PoolRootSsot ? (
            <div
              className="space-y-3 border-t border-ink-200/80 pt-4 dark:border-ink-700/80"
              aria-label={t("governance_treasury_erc20_root_section_label")}
            >
              <p className="text-meta font-medium text-ink-700 dark:text-ink-300">
                {t("governance_treasury_erc20_root_section_label")}
              </p>
              <p className="inline-flex rounded-[var(--radius-sm)] border border-ref-sun/30 bg-ref-sun/10 px-2 py-1 text-small font-medium text-ink-800 dark:border-ref-sun/35 dark:bg-ref-sun/10 dark:text-ink-100">
                {t("governance_chain_read_ssot_badge")}
              </p>
              <div>
                <p className="text-meta text-ink-600">{t("governance_treasury_erc20_root_raw_value_caption")}</p>
                <p className="mt-1 break-all font-mono text-small text-ink-800">{pool.treasury_erc20_pool}</p>
              </div>
              {poolCurrencyTrim && looksLikeEvmAddress(poolCurrencyTrim) ? (
                <div>
                  <p className="text-meta text-ink-600">{t("governance_treasury_erc20_root_token_address_caption")}</p>
                  <p className="mt-1 break-all font-mono text-small text-ink-800">{poolCurrencyTrim}</p>
                </div>
              ) : null}
              <p className="text-meta text-ink-500">{t("governance_treasury_erc20_root_observation_hint")}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
