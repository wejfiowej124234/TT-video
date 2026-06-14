"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { FOCUS_RING } from "@/components/me/constants";
import { StewardStakeJurisdictionRow } from "@/components/steward/StewardStakeJurisdictionRow";
import { StewardStakeReleaseRow } from "@/components/steward/StewardStakeReleaseRow";
import { PROTOCOL_SSOT_V1 } from "@/lib/governance/protocolSsot.v1";
import type { useStewardStakeManage } from "@/lib/steward/useStewardStakeManage";
import { stewardSeatInReleasePhase } from "@/lib/steward/stewardSeatModel";
import {
  formatStewardWalletDisplay,
  isMultiDemoStewardWallet,
  isValidEvmWalletAddress,
  stewardChainStakeSummaryKey,
  stewardOffchainSeatLabelKey,
  stewardShowsOnboardingCta,
  stewardStakeSectionTitleKey,
} from "@/lib/steward/stewardStakeUiModel";
import type { StewardStakePanelCollapseMode } from "@/lib/governance/stewardWorkbenchWorkspaceL5";
import { stewardStakePanelCollapsedHintKey } from "@/lib/governance/stewardWorkbenchWorkspaceL5";
import { TT_IDENTITY_SLOT_SETTINGS_L5 } from "@/lib/me/identitySlotSettingsL5";
import { scrollToStewardAdmissionSection, stewardAdmissionWorkbenchHref } from "@/lib/steward/stewardAdmissionNav";
import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export type StewardTtgStakeManagePanelProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  manage: ReturnType<typeof useStewardStakeManage>;
  variant?: "workbench" | "settings";
  /** 工作台顶部门闸已展示入驻 CTA */
  hideGateCtas?: boolean;
  /** 工作台顶部门闸 need_onboarding / need_stake_deferred：折叠，锚点展开 */
  gateCollapsed?: boolean;
  stakePanelCollapseMode?: StewardStakePanelCollapseMode;
  /** 顶区 satisfied 细条已展示链下/链上摘要 */
  hideDualTrackSummary?: boolean;
  /** need_stake 顶部门闸：折叠生命周期/冗长摘要，仅保留可质押操作行 */
  gateStakeCompact?: boolean;
  /** 顶栏进度条已展示 A/B 说明时隐藏重复 disclosure */
  hideAdmissionDisclosure?: boolean;
};

function stakeRowLabel(
  t: StewardTtgStakeManagePanelProps["t"],
  row: { hasStake: boolean | null; loadError: boolean },
): string {
  if (row.hasStake === true) return t("steward_workbench_stake_row_staked");
  if (row.hasStake === false) return t("steward_workbench_stake_row_pending");
  if (row.loadError) return t("steward_workbench_stake_row_unknown");
  return t("steward_workbench_stake_row_chain_off");
}

export function StewardTtgStakeManagePanel({
  t,
  manage,
  variant = "workbench",
  hideGateCtas = false,
  gateCollapsed = false,
  stakePanelCollapseMode = "none",
  hideDualTrackSummary = false,
  gateStakeCompact = false,
  hideAdmissionDisclosure = false,
}: StewardTtgStakeManagePanelProps) {
  const lock = PROTOCOL_SSOT_V1.lock_tiers;
  const { loading, actionLoading, actionError, app, seat, rows, poolConfigured, reload, submitResignNotice, finalizeResign, updateRowStake } =
    manage;
  const { address, isConnected } = useAccount();
  const isWorkbench = variant === "workbench";
  const sectionClass = isWorkbench ? TT_WORKSPACE_L5.sectionCard : TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard;
  const titleClass = isWorkbench ? TT_WORKSPACE_L5.sectionTitle : TT_IDENTITY_SLOT_SETTINGS_L5.sectionTitle;
  const subtitleClass = isWorkbench ? TT_WORKSPACE_L5.sectionSubtitle : TT_IDENTITY_SLOT_SETTINGS_L5.sectionHint;
  const releaseVariant = isWorkbench ? "workspaceL5" : "light";
  const inRelease = stewardSeatInReleasePhase(seat);
  const showStakeRows = Boolean(app && !inRelease);
  const showReleaseRows = app && (inRelease || seat?.canRequestChainRelease);
  const stakeSectionTitleKey = app ? stewardStakeSectionTitleKey(app.status, inRelease) : "stewardSeat_stake_section";
  const showOnboardingCta = stewardShowsOnboardingCta(app?.status);
  const walletMatch = Boolean(
    app && address && address.trim().toLowerCase() === app.walletAddress.trim().toLowerCase(),
  );
  const chainStakeSummaryKey = stewardChainStakeSummaryKey(rows, { isConnected, walletMatch });
  const walletDisplay = app ? formatStewardWalletDisplay(app.walletAddress) : "—";
  const showDemoWalletHint = Boolean(app && isMultiDemoStewardWallet(app.walletAddress));
  const showInvalidWalletHint = Boolean(app && !isValidEvmWalletAddress(app.walletAddress));
  const hideSeatLifecycle =
    gateStakeCompact &&
    !(seat?.canSubmitResignNotice || seat?.canFinalizeResign || seat?.resignNoticeAt);

  if (isWorkbench && gateCollapsed) {
    const collapsedHintKey = stewardStakePanelCollapsedHintKey(stakePanelCollapseMode);
    return (
      <section
        className={sectionClass}
        aria-label={t("steward_workbench_stake_aria")}
        data-tt-steward-ttg-stake-manage="1"
        data-tt-steward-ttg-stake-gate-collapsed="1"
        data-tt-steward-ttg-stake-gate-collapsed-mode={stakePanelCollapseMode}
      >
        <p className="text-meta uppercase tracking-wider text-cyan-400/70">
          {t("steward_workbench_a_track_label")}
        </p>
        <h2 className={titleClass}>{t("steward_workbench_stake_title")}</h2>
        {collapsedHintKey ? (
          <p
            className="mt-3 rounded-xl border border-dashed border-ref-sun/16 bg-ref-sun/[0.02] px-4 py-3 text-meta text-slate-500 leading-relaxed"
            data-tt-steward-ttg-stake-collapsed-hint="1"
          >
            {t(collapsedHintKey)}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section
      className={sectionClass}
      aria-label={t("steward_workbench_stake_aria")}
      data-tt-steward-ttg-stake-manage="1"
      {...(gateStakeCompact ? { "data-tt-steward-ttg-stake-gate-compact": "1" } : {})}
    >
      {isWorkbench ? (
        <p className="text-meta uppercase tracking-wider text-cyan-400/70">
          {t("steward_workbench_a_track_label")}
        </p>
      ) : null}
      <h2 className={titleClass}>{t("steward_workbench_stake_title")}</h2>
      {!gateStakeCompact && !(isWorkbench && hideAdmissionDisclosure) ? (
        <p className={subtitleClass}>
          {isWorkbench ? t("steward_workbench_stake_subtitle_compact") : t("steward_workbench_stake_subtitle")}
        </p>
      ) : null}
      {isWorkbench && !gateStakeCompact && !hideAdmissionDisclosure ? (
        <p
          className="mt-3 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.04] p-3 text-meta leading-relaxed text-slate-400"
          role="note"
          data-tt-steward-workbench-a-track-disclosure="1"
        >
          {t("steward_workbench_stake_a_track_hint")}
        </p>
      ) : null}

      {!isWorkbench ? (
        <ul className={`mt-3 space-y-1.5 list-disc pl-5 text-meta text-slate-400/95`}>
          <li>{t("steward_workbench_stake_rule_lock")}</li>
          <li>
            {t("steward_workbench_stake_rule_tenure", {
              months: lock.steward_seat_min_tenure_months,
            })}
          </li>
          <li>
            {t("steward_workbench_stake_rule_release", {
              delayDays: lock.steward_stake_release_delay_days,
              vestDays: lock.steward_stake_release_vest_days,
            })}
          </li>
          <li>{t("steward_workbench_stake_rule_not_redemption")}</li>
        </ul>
      ) : null}

      {loading ? (
        <p className={`mt-3 ${subtitleClass}`} aria-busy="true">
          {t("common_loading")}
        </p>
      ) : !app ? (
        <p className={`mt-3 ${subtitleClass}`}>{t("steward_workbench_stake_no_application")}</p>
      ) : (
        <div className="mt-4 space-y-4">
          {hideDualTrackSummary || gateStakeCompact ? (
            <div data-tt-steward-wallet-inline="1">
              <p className={`font-mono text-meta text-slate-500 break-all`} title={app.walletAddress}>
                {t("steward_register_wallet")}: {walletDisplay}
              </p>
              {showInvalidWalletHint ? (
                <p className="mt-2 text-small text-amber-900" role="alert">
                  {t("steward_workbench_stake_wallet_invalid_hint")}
                </p>
              ) : null}
              {showDemoWalletHint ? (
                <p className="mt-2 text-meta text-slate-400" role="note">
                  {t("steward_workbench_stake_demo_wallet_hint")}
                </p>
              ) : null}
            </div>
          ) : (
            <div data-tt-steward-dual-track="1">
              <div className="flex flex-wrap gap-3">
                <div className={TT_WORKSPACE_L5.statTile}>
                  <p className={`${TT_WORKSPACE_L5.statValue} text-base sm:text-h3`}>
                    {t(stewardOffchainSeatLabelKey(app.status))}
                  </p>
                  <p className={TT_WORKSPACE_L5.statLabel}>{t("steward_workbench_stake_offchain_label")}</p>
                </div>
                <div className={TT_WORKSPACE_L5.statTile}>
                  <p className={`${TT_WORKSPACE_L5.statValueAccent} text-base sm:text-h3`}>{t(chainStakeSummaryKey)}</p>
                  <p className={TT_WORKSPACE_L5.statLabel}>{t("steward_workbench_stake_chain_label")}</p>
                </div>
              </div>
              <p className={`mt-2 font-mono text-meta text-slate-500 break-all`} title={app.walletAddress}>
                {t("steward_register_wallet")}: {walletDisplay}
              </p>
              {showInvalidWalletHint ? (
                <p className="mt-2 text-small text-amber-900" role="alert">
                  {t("steward_workbench_stake_wallet_invalid_hint")}
                </p>
              ) : null}
              {showDemoWalletHint ? (
                <p className="mt-2 text-meta text-slate-400" role="note">
                  {t("steward_workbench_stake_demo_wallet_hint")}
                </p>
              ) : null}
            </div>
          )}
          {!gateStakeCompact && !poolConfigured ? (
            <p className={subtitleClass} role="note">
              {t("steward_workbench_stake_pool_local_only")}
            </p>
          ) : null}

          {seat && isWorkbench && !hideSeatLifecycle && !seat.canSubmitResignNotice && !seat.canFinalizeResign && !seat.resignNoticeAt ? (
            seat.tenureMonthsElapsed != null ? (
              <p className={`${subtitleClass} text-slate-400`} data-tt-steward-seat-tenure-inline="1">
                {t("stewardSeat_tenure_elapsed", {
                  months: seat.tenureMonthsElapsed,
                  required: seat.minTenureMonths,
                })}
              </p>
            ) : null
          ) : null}

          {seat && !hideSeatLifecycle && (!isWorkbench || seat.canSubmitResignNotice || seat.canFinalizeResign || seat.resignNoticeAt) ? (
            <div
              className={`rounded-xl border p-3 space-y-2 ${isWorkbench ? "border-ref-sun/15 bg-ref-sun/[0.04]" : "border-ref-sun/20 bg-ref-sun/[0.06]"}`}
              data-tt-steward-seat-lifecycle="1"
            >
              <h3 className="text-small font-semibold text-ref-sun/90">{t("stewardSeat_lifecycle_title")}</h3>
              {seat.seatActivatedAt ? (
                <p className={subtitleClass}>
                  {t("stewardSeat_activated_at", { date: new Date(seat.seatActivatedAt).toLocaleDateString() })}
                </p>
              ) : null}
              {seat.tenureMonthsElapsed != null ? (
                <p className={subtitleClass}>
                  {t("stewardSeat_tenure_elapsed", {
                    months: seat.tenureMonthsElapsed,
                    required: seat.minTenureMonths,
                  })}
                </p>
              ) : null}
              {seat.resignNoticeAt ? (
                <p className={subtitleClass}>
                  {t("stewardSeat_resign_notice_submitted", {
                    date: new Date(seat.resignNoticeAt).toLocaleDateString(),
                    effective: seat.resignNoticeEffectiveAt
                      ? new Date(seat.resignNoticeEffectiveAt).toLocaleDateString()
                      : t("ui_em_dash"),
                  })}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                {seat.canSubmitResignNotice ? (
                  <button
                    type="button"
                    className={isWorkbench ? TT_WORKSPACE_L5.primaryBtn : `${TT_WORKSPACE_L5.primaryBtn} text-sm`}
                    disabled={actionLoading}
                    onClick={() => void submitResignNotice(t)}
                    data-testid="steward-resign-notice-submit"
                  >
                    {actionLoading ? t("common_loading") : t("stewardSeat_resign_notice_btn")}
                  </button>
                ) : null}
                {seat.canFinalizeResign ? (
                  <button
                    type="button"
                    className={isWorkbench ? TT_WORKSPACE_L5.navLink : `${TT_WORKSPACE_L5.navLink} text-sm`}
                    disabled={actionLoading}
                    onClick={() => void finalizeResign(t)}
                    data-testid="steward-finalize-resign-submit"
                  >
                    {actionLoading ? t("common_loading") : t("stewardSeat_finalize_resign_btn")}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {actionError ? (
            <p className="text-small text-danger" role="alert">
              {actionError}
            </p>
          ) : null}

          {rows.length > 0 && !showStakeRows && !showReleaseRows ? (
            <ul className="space-y-2">
              {rows.map((row) => (
                <li
                  key={row.jurisdiction}
                  className={`${isWorkbench ? TT_WORKSPACE_L5.statTile : "rounded-lg border border-ref-sun/15 px-3 py-2"} flex justify-between gap-3`}
                >
                  <span className={isWorkbench ? "text-small text-slate-200" : "text-small text-slate-200"}>
                    {row.jurisdiction}
                  </span>
                  <span className="text-meta text-ref-sun">{stakeRowLabel(t, row)}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {showStakeRows ? (
            <div>
              <h3 className="text-small font-semibold text-ref-sun/85 mb-2">{t(stakeSectionTitleKey)}</h3>
              <ul className="space-y-2">
                {app.jurisdictions.map((jid) => (
                  <StewardStakeJurisdictionRow
                    key={jid}
                    jurisdictionId={jid}
                    applicationId={app.id}
                    expectedWallet={app.walletAddress}
                    onStaked={() => void reload()}
                    onStakeStatus={updateRowStake}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {showReleaseRows && app ? (
            <div>
              <h3 className="text-small font-semibold text-ref-sun/85 mb-2">{t("stewardSeat_release_section")}</h3>
              <ul className="space-y-2">
                {app.jurisdictions.map((jid) => (
                  <StewardStakeReleaseRow
                    key={jid}
                    jurisdictionId={jid}
                    expectedWallet={app.walletAddress}
                    releaseAllowed={seat?.canRequestChainRelease === true || inRelease}
                    onUpdated={() => void reload()}
                    variant={releaseVariant}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {!(isWorkbench && hideGateCtas) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {showOnboardingCta ? (
            isWorkbench ? (
              <button
                type="button"
                className={`${TT_WORKSPACE_L5.primaryBtn} ${FOCUS_RING}`}
                onClick={() => scrollToStewardAdmissionSection()}
              >
                {t("steward_workbench_stake_cta_onboarding")}
              </button>
            ) : (
              <Link
                href={stewardAdmissionWorkbenchHref("identities_hub")}
                className={`${TT_WORKSPACE_L5.navLink} ${FOCUS_RING}`}
              >
                {t("steward_workbench_stake_cta_onboarding")}
              </Link>
            )
          ) : null}
          <Link
            href="/governance/params?from=steward_workbench"
            className={`${TT_WORKSPACE_L5.navLink} ${FOCUS_RING}`}
          >
            {t("steward_workbench_stake_cta_protocol")}
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          <Link
            href="/governance/params?from=steward_workbench"
            className={`${TT_WORKSPACE_L5.navLink} ${FOCUS_RING}`}
          >
            {t("steward_workbench_stake_cta_protocol")}
          </Link>
        </div>
      )}
    </section>
  );
}
