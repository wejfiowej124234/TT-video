"use client";

import { useTranslation } from "@/components/LocaleProvider";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import {
  governanceHubSectionTokens,
  type GovernanceHubSectionVariant,
} from "@/lib/governance/governanceHubSectionTokens";
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
  variant?: GovernanceHubSectionVariant;
  showTitle?: boolean;
};

export function GovernanceHubPoolSection({
  pool,
  poolHttpError,
  variant = "hub",
  showTitle = true,
}: Props) {
  const { t } = useTranslation();
  const tok = governanceHubSectionTokens(variant);

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
      {showTitle ? <h2 className={tok.title}>{t("governance_pool_label")}</h2> : null}
      {poolHttpError ? (
        <div className="mt-1">
          <ApiErrorAlert message={poolHttpError} />
        </div>
      ) : (
        <div className={`${showTitle ? "mt-2" : ""} space-y-4`}>
          {Array.isArray(pool?.balance_lines_v1) && pool.balance_lines_v1.length > 0 ? (
            <div className={tok.panel}>
              <p className={`text-meta font-medium ${variant === "workspaceL5" ? "text-slate-300" : "text-ink-700 dark:text-ink-200"}`}>
                Track-labeled balances (P0)
              </p>
              <p className={tok.metaMuted}>
                No “total balance” is shown here; each line is explicit about its track and source.
              </p>
              <div className="grid gap-2">
                {pool.balance_lines_v1.map((line, i) => (
                  <div key={`${line.track_type}-${line.source}-${i}`} className={tok.innerPanel}>
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-small font-medium ${variant === "workspaceL5" ? "text-slate-100" : "text-ink-800 dark:text-ink-100"}`}>
                        {balanceLineShortLabel(line)}
                      </p>
                      {typeof line.currency === "string" && line.currency.trim() ? (
                        <p className={tok.metaMuted}>{line.currency.trim()}</p>
                      ) : null}
                    </div>
                    <p className={`mt-1 ${tok.mono}`}>
                      {line.balance == null ? "—" : String(line.balance)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {governancePoolIsChainReadRow(pool) ? (
            <div className="space-y-3">
              {showPoolChainSsotBadge ? <p className={tok.badge}>{t("governance_chain_read_ssot_badge")}</p> : null}
              <div>
                <p className={tok.meta}>{t("governance_chain_read_raw_balance_caption")}</p>
                <p className={tok.mono}>
                  {pool.pool_balance != null ? String(pool.pool_balance) : "—"}
                </p>
              </div>
              {poolCurrencyTrim ? (
                <div>
                  <p className={tok.meta}>
                    {looksLikeEvmAddress(poolCurrencyTrim)
                      ? t("governance_chain_read_token_contract_caption")
                      : t("governance_chain_read_currency_field_caption")}
                  </p>
                  <p className={looksLikeEvmAddress(poolCurrencyTrim) ? tok.mono : tok.body}>
                    {poolCurrencyTrim}
                  </p>
                </div>
              ) : null}
              {pool.updated_at == null ? (
                <p className={tok.metaMuted}>{t("governance_chain_read_no_table_updated_at")}</p>
              ) : null}
            </div>
          ) : poolHasBalance && poolCurrencyTrim ? (
            <p className={variant === "workspaceL5" ? tok.monoStrong : tok.body}>
              {pool?.pool_balance} {poolCurrencyTrim}
            </p>
          ) : poolHasBalance && !poolCurrencyTrim ? (
            <p className={tok.body}>
              {t("governance_pool_balance_currency_unspecified", {
                amount: String(pool?.pool_balance),
              })}
            </p>
          ) : pool?.data_source === "database" || pool?.data_source === "database_empty" ? (
            <p className={tok.metaMuted}>{t("governance_pool_db_empty")}</p>
          ) : (
            <p className={tok.metaMuted}>{t("governance_pool_placeholder")}</p>
          )}

          {showCountryPoolRootSsot ? (
            <div className={tok.divider} aria-label={t("governance_country_pool_root_section_label")}>
              <p className={`text-meta font-medium ${variant === "workspaceL5" ? "text-slate-300" : "text-ink-700 dark:text-ink-300"}`}>
                {t("governance_country_pool_root_section_label")}
              </p>
              <p className={tok.badge}>{t("governance_chain_read_ssot_badge")}</p>
              <div>
                <p className={tok.meta}>{t("governance_country_pool_root_raw_value_caption")}</p>
                <p className={tok.mono}>{pool.country_pool}</p>
              </div>
              {poolCurrencyTrim && looksLikeEvmAddress(poolCurrencyTrim) ? (
                <div>
                  <p className={tok.meta}>{t("governance_country_pool_root_token_address_caption")}</p>
                  <p className={tok.mono}>{poolCurrencyTrim}</p>
                </div>
              ) : null}
              <p className={tok.metaMuted}>{t("governance_country_pool_root_observation_hint")}</p>
            </div>
          ) : null}

          {showTreasuryPoolRootSsot ? (
            <div className={tok.divider} aria-label={t("governance_treasury_native_root_section_label")}>
              <p className={`text-meta font-medium ${variant === "workspaceL5" ? "text-slate-300" : "text-ink-700 dark:text-ink-300"}`}>
                {t("governance_treasury_native_root_section_label")}
              </p>
              <p className={tok.badge}>{t("governance_chain_read_ssot_badge")}</p>
              <div>
                <p className={tok.meta}>{t("governance_treasury_native_root_raw_wei_caption")}</p>
                <p className={tok.mono}>{pool.treasury_pool}</p>
              </div>
              <p className={tok.metaMuted}>{t("governance_treasury_native_root_observation_hint")}</p>
            </div>
          ) : null}

          {showTreasuryErc20PoolRootSsot ? (
            <div className={tok.divider} aria-label={t("governance_treasury_erc20_root_section_label")}>
              <p className={`text-meta font-medium ${variant === "workspaceL5" ? "text-slate-300" : "text-ink-700 dark:text-ink-300"}`}>
                {t("governance_treasury_erc20_root_section_label")}
              </p>
              <p className={tok.badge}>{t("governance_chain_read_ssot_badge")}</p>
              <div>
                <p className={tok.meta}>{t("governance_treasury_erc20_root_raw_value_caption")}</p>
                <p className={tok.mono}>{pool.treasury_erc20_pool}</p>
              </div>
              {poolCurrencyTrim && looksLikeEvmAddress(poolCurrencyTrim) ? (
                <div>
                  <p className={tok.meta}>{t("governance_treasury_erc20_root_token_address_caption")}</p>
                  <p className={tok.mono}>{poolCurrencyTrim}</p>
                </div>
              ) : null}
              <p className={tok.metaMuted}>{t("governance_treasury_erc20_root_observation_hint")}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
