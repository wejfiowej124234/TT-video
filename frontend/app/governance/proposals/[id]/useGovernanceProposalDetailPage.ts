import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import {
  getGovernanceProposal,
  getGovernanceVotingPower,
  getMeta,
  postGovernanceProposalVote,
  type GovernanceProposalDetailResponse,
  type GovernanceVotingPowerResponse,
} from "@/lib/apiClient";
import {
  chainContractsFromMeta,
  chainIdFromMeta,
  governorAddressFromMeta,
  type ChainContractsSnapshot,
} from "@/lib/governanceChainMeta";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { mapOrderWriteError } from "@/lib/mapOrderWriteError";
import { deriveGovernanceExecutionReadiness } from "@/lib/governanceExecutionReadiness";
import { hasClientSession, voteCountFromApi } from "./governanceProposalDetailPageModel";

export function useGovernanceProposalDetailPage() {
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
  const [metaContracts, setMetaContracts] = useState<ChainContractsSnapshot | null>(null);

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
      setMetaContracts(null);
      return undefined;
    }
    let cancelled = false;
    getMeta()
      .then((m) => {
        if (cancelled) return;
        setMetaGovernor(governorAddressFromMeta(m));
        setMetaChainId(chainIdFromMeta(m));
        setMetaContracts(chainContractsFromMeta(m));
      })
      .catch(() => {
        if (!cancelled) {
          setMetaGovernor(null);
          setMetaChainId(null);
          setMetaContracts(null);
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

  const executionReadiness = useMemo(
    () => deriveGovernanceExecutionReadiness(onChainGovernor, data?.chain ?? null),
    [onChainGovernor, data?.chain],
  );

  const submitVote = useCallback(
    async (choice: "yes" | "no" | "abstain") => {
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
    },
    [onChainGovernor, proposalId, t, voteBusy],
  );

  const retryLoad = useCallback(() => {
    setRetryTick((n) => n + 1);
  }, []);

  return {
    t,
    pageTitleId,
    proposalId,
    data,
    loading,
    error,
    retryLoad,
    proposal,
    title,
    body,
    status,
    yes,
    no,
    abstain,
    onChainGovernor,
    myVote,
    myVoteWeight,
    executionReadiness,
    hasSession,
    votingPower,
    metaGovernor,
    metaChainId,
    metaContracts,
    loginHref,
    voteBusy,
    voteError,
    voteFailCode,
    voteInfo,
    submitVote,
  };
}
