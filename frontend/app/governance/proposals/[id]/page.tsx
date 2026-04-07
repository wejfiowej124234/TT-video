"use client";

import { type FormEvent, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import {
  AUTH_SESSION_TOKEN_KEY,
  AUTH_USER_ID_KEY,
  getGovernanceProposal,
  getGovernanceVotingPower,
  getMeta,
  postGovernanceProposalVote,
  type GovernanceProposalDetailResponse,
  type GovernanceVotingPowerResponse,
} from "@/lib/apiClient";
import { chainIdFromMeta, governorAddressFromMeta } from "@/lib/governanceChainMeta";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { mapOrderWriteError } from "@/lib/mapOrderWriteError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import LoadingText from "@/components/LoadingText";
import GovernanceTargetNotice from "@/components/governance/GovernanceTargetNotice";
import GovernanceB090OnChainProposalNotice from "@/components/governance/GovernanceB090OnChainProposalNotice";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

function voteCountFromApi(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function hasClientSession(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    localStorage.getItem(AUTH_SESSION_TOKEN_KEY)?.trim() ||
    localStorage.getItem(AUTH_USER_ID_KEY)?.trim()
  );
}

/** B-072：`GET` 详情 + `POST` 投票；同票幂等、异票 409（`parseResponse` → `already_voted`） */
export default function GovernanceProposalDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const pathname = usePathname();
  const pageTitleId = useId();
  const proposalId = useMemo(() => {
    const raw = params?.id;
    const s = Array.isArray(raw) ? raw[0] : raw;
    return typeof s === "string" ? s.trim() : "";
  }, [params]);

  const [data, setData] = useState<GovernanceProposalDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [voteBusy, setVoteBusy] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteFailCode, setVoteFailCode] = useState<string | null>(null);
  const [voteInfo, setVoteInfo] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [votingPower, setVotingPower] = useState<GovernanceVotingPowerResponse | null>(null);
  const [metaGovernor, setMetaGovernor] = useState<string | null>(null);
  const [metaChainId, setMetaChainId] = useState<number | null>(null);

  const loginHref = useMemo(() => {
    const back = pathname && pathname.startsWith("/") ? pathname : `/governance/proposals/${proposalId}`;
    return `/auth/login?returnUrl=${encodeURIComponent(back)}`;
  }, [pathname, proposalId]);

  useEffect(() => {
    const sync = () => setHasSession(hasClientSession());
    sync();
    if (typeof window !== "undefined") {
      window.addEventListener("traveltrust:auth-change", sync);
      return () => window.removeEventListener("traveltrust:auth-change", sync);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (!hasSession) {
      setVotingPower(null);
      return undefined;
    }
    let cancelled = false;
    getGovernanceVotingPower()
      .then((j) => {
        if (!cancelled) setVotingPower(j);
      })
      .catch(() => {
        if (!cancelled) setVotingPower(null);
      });
    return () => {
      cancelled = true;
    };
  }, [hasSession]);

  useEffect(() => {
    if (!proposalId) {
      setLoading(false);
      setError(t("governance_error_invalid_proposal_id"));
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getGovernanceProposal(proposalId)
      .then((j) => {
        if (cancelled) return;
        setData(j);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          console.error("GovernanceProposalDetailPage getGovernanceProposal:", err);
        }
        setData(null);
        setError(mapApiReadError(err, t, "governance_proposal_detail_loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [proposalId, retryTick, t]);

  const onChainGovernorKind = data?.governance_vote?.kind === "on_chain_governor";

  useEffect(() => {
    if (!onChainGovernorKind) {
      setMetaGovernor(null);
      setMetaChainId(null);
      return undefined;
    }
    let cancelled = false;
    getMeta()
      .then((m) => {
        if (cancelled) return;
        setMetaGovernor(governorAddressFromMeta(m));
        setMetaChainId(chainIdFromMeta(m));
      })
      .catch(() => {
        if (!cancelled) {
          setMetaGovernor(null);
          setMetaChainId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [onChainGovernorKind, proposalId, retryTick]);

  const proposal = data?.proposal;
  const title =
    typeof proposal?.title === "string" && proposal.title.trim()
      ? proposal.title
      : t("governance_proposals_item_untitled");
  const body = typeof proposal?.body === "string" ? proposal.body : "";
  const status = typeof proposal?.status === "string" ? proposal.status : "—";
  const counts = data?.vote_counts ?? {};
  const yes = voteCountFromApi(counts.yes);
  const no = voteCountFromApi(counts.no);
  const abstain = voteCountFromApi(counts.abstain);
  const onChainGovernor = onChainGovernorKind;
  const myVote =
    data?.my_vote === null || data?.my_vote === undefined
      ? null
      : typeof data.my_vote === "string"
        ? data.my_vote
        : String(data.my_vote);
  const myVoteWeight =
    typeof data?.my_vote_weight === "number" && Number.isFinite(data.my_vote_weight)
      ? data.my_vote_weight
      : null;

  async function submitVote(choice: "yes" | "no" | "abstain") {
    if (!proposalId || voteBusy || onChainGovernor) return;
    setVoteBusy(true);
    setVoteError(null);
    setVoteFailCode(null);
    setVoteInfo(null);
    try {
      const res = await postGovernanceProposalVote(proposalId, choice);
      if (res.idempotent) {
        setVoteInfo(t("governance_vote_idempotent_notice"));
      }
      const next = await getGovernanceProposal(proposalId);
      setData(next);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("GovernanceProposalDetailPage postGovernanceProposalVote:", err);
      }
      const code = err instanceof Error ? err.message : "";
      setVoteFailCode(code || null);
      setVoteError(mapOrderWriteError(err, t, { fallbackKey: "governance_proposal_detail_voteFailed" }));
    } finally {
      setVoteBusy(false);
    }
  }

  const voteBtnClass = `min-h-[44px] rounded-[var(--radius-sm)] border border-ink-300 bg-white px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-white`;

  return (
    <main className="mx-auto max-w-3xl p-8" aria-labelledby={pageTitleId}>
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("governance_proposal_detail_title")}
      </h1>
      <p className="mt-2 text-body text-ink-600">{t("governance_proposals_intro")}</p>
      <GovernanceTargetNotice className="mt-4" />

      <nav className="mt-4" aria-label={t("governance_nav_label")}>
        <Link
          href="/governance/proposals"
          className={`${touchTargetLink44Classes} inline-flex items-center text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
        >
          {t("governance_proposal_detail_back")}
        </Link>
      </nav>

      {loading ? (
        <div className="mt-6">
          <LoadingText />
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 space-y-2">
          <ApiErrorAlert message={error} />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (loading) return;
              setRetryTick((n) => n + 1);
            }}
          >
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading ? true : undefined}
              aria-label={t("common_retry")}
              className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-white`}
            >
              {loading ? t("common_retrying") : t("common_retry")}
            </button>
          </form>
        </div>
      ) : null}

      {!loading && !error && proposal ? (
        <article className="mt-6 space-y-6">
          <header>
            <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
            <p className="mt-1 text-meta text-ink-600">
              {t("governance_proposal_detail_status")}: {status}
            </p>
          </header>
          {onChainGovernor && proposal ? (
            <GovernanceB090OnChainProposalNotice
              variant="detail"
              chainId={metaChainId}
              governorAddress={metaGovernor}
              proposal={{
                proposer: proposal.proposer,
                snapshot_block: proposal.snapshot_block,
                vote_start_block: proposal.vote_start_block,
                vote_end_block: proposal.vote_end_block,
                operation_id: proposal.operation_id,
              }}
            />
          ) : null}
          <section aria-labelledby="gov-prop-body">
            <h3 id="gov-prop-body" className="text-small font-semibold text-ink-800">
              {t("governance_proposal_detail_body")}
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-body text-ink-800">{body || "—"}</p>
          </section>
          <section aria-labelledby="gov-prop-tally">
            <h3 id="gov-prop-tally" className="text-small font-semibold text-ink-800">
              {t("governance_proposal_detail_vote_counts")}
            </h3>
            <ul className="mt-2 list-inside list-disc text-body text-ink-800">
              <li>
                {t("governance_proposal_detail_vote_yes")}: {yes}
              </li>
              <li>
                {t("governance_proposal_detail_vote_no")}: {no}
              </li>
              <li>
                {t("governance_proposal_detail_vote_abstain")}: {abstain}
              </li>
            </ul>
            <p className="mt-2 text-meta text-ink-600 dark:text-ink-300">
              {onChainGovernor
                ? t("governance_proposal_on_chain_tally_hint")
                : t("governance_proposal_detail_vote_counts_weighted_hint")}
            </p>
            {onChainGovernor && data?.chain?.state_live ? (
              <p className="mt-2 text-body text-ink-800 dark:text-ink-100" role="status">
                {t("governance_proposal_chain_state_live")}: {String(data.chain.state_live)}
                {data.chain.state_rpc_error
                  ? ` (${t("governance_proposal_chain_read_error")}: ${String(data.chain.state_rpc_error)})`
                  : ""}
              </p>
            ) : null}
            {onChainGovernor && data?.voting_power_at_snapshot != null ? (
              <pre className="mt-2 max-w-full overflow-x-auto rounded border border-ink-200/80 bg-white p-2 text-meta text-ink-800 dark:border-ink-600/40 dark:bg-ink-950/40 dark:text-ink-100">
                {JSON.stringify(data.voting_power_at_snapshot, null, 2)}
              </pre>
            ) : null}
            {hasSession &&
            votingPower?.authenticated &&
            ((votingPower.can_cast_vote === false &&
              votingPower.reason === "delegation_active_cannot_vote") ||
              typeof votingPower.total_weight_units === "number") ? (
              <p className="mt-2 text-body text-ink-800 dark:text-ink-100" role="status">
                {votingPower.can_cast_vote === false && votingPower.reason === "delegation_active_cannot_vote"
                  ? t("governance_voting_power_delegated_away")
                  : `${t("governance_voting_power_current")}: ${votingPower.total_weight_units}`}
              </p>
            ) : null}
            <p className="mt-2 text-body text-ink-800">
              <span className="font-medium">{t("governance_proposal_detail_my_vote")}:</span>{" "}
              {myVote && myVote.trim()
                ? myVote === "yes"
                  ? t("governance_proposal_detail_vote_yes")
                  : myVote === "no"
                    ? t("governance_proposal_detail_vote_no")
                    : myVote === "abstain"
                      ? t("governance_proposal_detail_vote_abstain")
                      : myVote
                : t("governance_proposal_detail_my_vote_none")}
            </p>
            {myVote && myVote.trim() && myVoteWeight != null ? (
              <p className="mt-1 text-meta text-ink-600 dark:text-ink-300">
                {t("governance_proposal_detail_my_vote_weight")}: {myVoteWeight}
              </p>
            ) : null}
          </section>

          <section aria-labelledby="gov-prop-vote" className="rounded-[var(--radius-md)] border border-ink-200/80 bg-ink-50/40 p-4 dark:border-ink-600/40 dark:bg-ink-900/20">
            <h3 id="gov-prop-vote" className="text-small font-semibold text-ink-800 dark:text-ink-100">
              {t("governance_proposal_detail_vote_section")}
            </h3>
            {!hasSession ? (
              <p className="mt-2 text-body text-ink-700 dark:text-ink-200">{t("governance_proposal_detail_login_to_vote")}</p>
            ) : null}
            {!hasSession ? (
              <Link
                href={loginHref}
                className={`${touchTargetLink44Classes} mt-2 inline-flex items-center font-medium text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
              >
                {t("governance_proposal_detail_go_login")}
              </Link>
            ) : null}
            {voteError ? (
              <div className="mt-3 space-y-2">
                <ApiErrorAlert message={voteError} />
                {voteFailCode === "delegation_active_cannot_vote" ? (
                  <Link
                    href="/governance/delegate"
                    className={`${touchTargetLink44Classes} inline-flex items-center text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
                  >
                    {t("governance_delegate_nav")}
                  </Link>
                ) : null}
              </div>
            ) : null}
            {voteInfo ? (
              <p className="mt-3 text-body text-ink-700 dark:text-ink-200" role="status">
                {voteInfo}
              </p>
            ) : null}
            {onChainGovernor ? (
              <div className="mt-3 space-y-2 text-body text-ink-800 dark:text-ink-100">
                <p>{t("governance_proposal_on_chain_vote_explain")}</p>
                {data?.cast_vote_calldata ? (
                  <div className="space-y-1 text-meta">
                    <div>
                      <span className="font-medium">{t("governance_proposal_calldata_yes")}</span>
                      <pre className="mt-1 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded border border-ink-200/80 bg-white p-2 dark:border-ink-600/40 dark:bg-ink-950/40">
                        {data.cast_vote_calldata.yes ?? "—"}
                      </pre>
                    </div>
                    <div>
                      <span className="font-medium">{t("governance_proposal_calldata_no")}</span>
                      <pre className="mt-1 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded border border-ink-200/80 bg-white p-2 dark:border-ink-600/40 dark:bg-ink-950/40">
                        {data.cast_vote_calldata.no ?? "—"}
                      </pre>
                    </div>
                    <div>
                      <span className="font-medium">{t("governance_proposal_calldata_abstain")}</span>
                      <pre className="mt-1 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded border border-ink-200/80 bg-white p-2 dark:border-ink-600/40 dark:bg-ink-950/40">
                        {data.cast_vote_calldata.abstain ?? "—"}
                      </pre>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {voteBusy ? (
              <p className="mt-3 text-meta text-ink-600" role="status" aria-live="polite">
                {t("governance_proposal_detail_vote_submitting")}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={voteBtnClass}
                disabled={voteBusy || !hasSession || onChainGovernor}
                aria-busy={voteBusy ? true : undefined}
                onClick={() => void submitVote("yes")}
              >
                {t("governance_proposal_detail_vote_yes")}
              </button>
              <button
                type="button"
                className={voteBtnClass}
                disabled={voteBusy || !hasSession || onChainGovernor}
                aria-busy={voteBusy ? true : undefined}
                onClick={() => void submitVote("no")}
              >
                {t("governance_proposal_detail_vote_no")}
              </button>
              <button
                type="button"
                className={voteBtnClass}
                disabled={voteBusy || !hasSession || onChainGovernor}
                aria-busy={voteBusy ? true : undefined}
                onClick={() => void submitVote("abstain")}
              >
                {t("governance_proposal_detail_vote_abstain")}
              </button>
            </div>
          </section>
        </article>
      ) : null}

      <ProductCrossNav
        ariaLabelKey="governance_subpage_relatedNav_aria"
        showGuides
        className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-500"
      />
    </main>
  );
}
