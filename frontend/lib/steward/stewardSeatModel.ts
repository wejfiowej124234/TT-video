export type StewardSeatView = {
  applicationId: string;
  lifecycleState: string;
  jurisdictions: string[];
  walletAddress: string;
  seatActivatedAt: string | null;
  tenureMonthsElapsed: number | null;
  minTenureMonths: number;
  resignNoticeAt: string | null;
  resignNoticeEffectiveAt: string | null;
  resignNoticeDays: number;
  stakeReleaseDelayDays: number;
  stakeReleaseVestDays: number;
  canSubmitResignNotice: boolean;
  canFinalizeResign: boolean;
  canRequestChainRelease: boolean;
};

export function parseStewardSeatView(payload: unknown): StewardSeatView | null {
  if (!payload || typeof payload !== "object") return null;
  const seat = (payload as Record<string, unknown>).seat;
  if (!seat || typeof seat !== "object") return null;
  const row = seat as Record<string, unknown>;
  const jurisdictions = Array.isArray(row.jurisdictions)
    ? row.jurisdictions.filter((j): j is string => typeof j === "string" && j.trim().length > 0)
    : [];
  const wallet =
    typeof row.wallet_address === "string" ? row.wallet_address.trim() : "";
  const applicationId =
    typeof row.application_id === "string" ? row.application_id.trim() : "";
  if (!wallet || jurisdictions.length === 0) return null;

  return {
    applicationId,
    lifecycleState: typeof row.lifecycle_state === "string" ? row.lifecycle_state : "",
    jurisdictions,
    walletAddress: wallet,
    seatActivatedAt:
      typeof row.seat_activated_at === "string" ? row.seat_activated_at : null,
    tenureMonthsElapsed:
      typeof row.tenure_months_elapsed === "number" ? row.tenure_months_elapsed : null,
    minTenureMonths:
      typeof row.min_tenure_months === "number" ? row.min_tenure_months : 24,
    resignNoticeAt:
      typeof row.resign_notice_at === "string" ? row.resign_notice_at : null,
    resignNoticeEffectiveAt:
      typeof row.resign_notice_effective_at === "string"
        ? row.resign_notice_effective_at
        : null,
    resignNoticeDays:
      typeof row.resign_notice_days === "number" ? row.resign_notice_days : 180,
    stakeReleaseDelayDays:
      typeof row.stake_release_delay_days === "number"
        ? row.stake_release_delay_days
        : 90,
    stakeReleaseVestDays:
      typeof row.stake_release_vest_days === "number"
        ? row.stake_release_vest_days
        : 365,
    canSubmitResignNotice: row.can_submit_resign_notice === true,
    canFinalizeResign: row.can_finalize_resign === true,
    canRequestChainRelease: row.can_request_chain_release === true,
  };
}

export function stewardSeatInReleasePhase(seat: StewardSeatView | null): boolean {
  if (!seat) return false;
  return (
    seat.lifecycleState === "stake_release_pending" ||
    seat.lifecycleState === "released" ||
    seat.canRequestChainRelease
  );
}
