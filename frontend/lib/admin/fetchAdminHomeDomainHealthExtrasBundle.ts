import { adminInboxQueueListFetchConfig } from "@/lib/admin/adminHomeInboxQueueListCache";
import { fetchAdminQueueList } from "@/lib/admin/fetchAdminQueueList";
import {
  invalidateAdminHomeTreasuryChainFacts,
  fetchAdminHomeTreasuryChainFacts,
} from "@/lib/admin/fetchAdminHomeTreasuryChainFacts";
import {
  isAdminHomeTreasuryEvmAddress,
  resolveAdminHomeTreasuryPoolsSnapshot,
  type AdminHomeTreasuryPoolsSnapshot,
} from "@/lib/admin/adminHomeTreasuryPools";
import { getAdminCrossCheck } from "@/lib/apiClient/adminCrossCheck/http";
import { getAdminContentCountries, getAdminContentPublishQueue } from "@/lib/apiClient/content/http";
import { getAdminGrowthAnalyticsOverview } from "@/lib/apiClient/growth/analyticsHttp";
import {
  getAdminOfficialPublicOperationsPublishQueue,
  getAdminOfficialPublicOperationsStats,
} from "@/lib/apiClient/official/http";

export type AdminHomeDomainHealthExtrasBundle = {
  contentQueueCount: number | null;
  officialQueueCount: number | null;
  communityReportsCount: number | null;
  growthRegistrations: number | null;
  growthReferrals: number | null;
  growthFrozen: number | null;
  governorAddress: string | null;
  governanceLive: boolean;
  treasurySnapshot: AdminHomeTreasuryPoolsSnapshot;
};

const TTL_MS = 30_000;
let cache: { at: number; value: AdminHomeDomainHealthExtrasBundle } | null = null;
let inflight: Promise<AdminHomeDomainHealthExtrasBundle> | null = null;

function queueCountFromList(res: {
  errorKind: unknown;
  total: number | null;
  items?: unknown;
}): number | null {
  if (res.errorKind) return null;
  if (typeof res.total === "number" && Number.isFinite(res.total) && res.total >= 0) {
    return Math.floor(res.total);
  }
  if (Array.isArray(res.items)) return res.items.length;
  return 0;
}

async function fetchCommunityReportsCount(): Promise<number | null> {
  const { listUrl } = adminInboxQueueListFetchConfig("reports");
  try {
    const res = await fetchAdminQueueList<{ items?: unknown[] }>(
      "AdminHomeDomainHealth.reports",
      listUrl,
      { scope: "community-reports" },
    );
    return queueCountFromList(res);
  } catch {
    return null;
  }
}

async function fetchContentQueueCount(): Promise<number | null> {
  try {
    const res = await getAdminContentPublishQueue();
    if (res && typeof res === "object" && "error" in res && (res as { error?: unknown }).error) {
      throw new Error("content_queue_error");
    }
    if (typeof res.count === "number" && Number.isFinite(res.count) && res.count >= 0) {
      return Math.floor(res.count);
    }
    if (Array.isArray(res.items)) return res.items.length;
    return 0;
  } catch {
    try {
      const countries = await getAdminContentCountries();
      if (Array.isArray(countries.items) || typeof countries.count === "number") return 0;
      return 0;
    } catch {
      return null;
    }
  }
}

async function fetchOfficialQueueCount(): Promise<number | null> {
  try {
    const res = await getAdminOfficialPublicOperationsPublishQueue({ limit: 20 });
    if (res && typeof res === "object" && "error" in res && (res as { error?: unknown }).error) {
      throw new Error("official_queue_error");
    }
    if (Array.isArray(res.items)) return res.items.length;
    return 0;
  } catch {
    try {
      const stats = await getAdminOfficialPublicOperationsStats();
      if (stats && typeof stats === "object" && !stats.error) return 0;
      return null;
    } catch {
      return null;
    }
  }
}

async function fetchGrowthSnapshot(): Promise<{
  registrations: number | null;
  referrals: number | null;
  frozen: number | null;
}> {
  try {
    const res = await getAdminGrowthAnalyticsOverview({ days: 30 });
    if (res && typeof res === "object" && "error" in res && (res as { error?: unknown }).error) {
      throw new Error("growth_overview_error");
    }
    const summary = res.summary;
    if (summary && typeof summary.registrations_total === "number") {
      return {
        registrations: summary.registrations_total,
        referrals: summary.referral_events_total ?? 0,
        frozen: summary.frozen_or_ineligible_count ?? 0,
      };
    }
    return { registrations: 0, referrals: 0, frozen: 0 };
  } catch {
    return { registrations: null, referrals: null, frozen: null };
  }
}

async function fetchGovernanceLive(
  governorAddress: string | null,
  timelock: string | null,
  token: string | null,
) {
  const addrLive =
    isAdminHomeTreasuryEvmAddress(governorAddress) ||
    isAdminHomeTreasuryEvmAddress(timelock) ||
    isAdminHomeTreasuryEvmAddress(token);
  if (addrLive) return true;
  try {
    await getAdminCrossCheck();
    return true;
  } catch {
    return false;
  }
}

export function invalidateAdminHomeDomainHealthExtrasBundle(): void {
  cache = null;
  invalidateAdminHomeTreasuryChainFacts();
}

export async function fetchAdminHomeDomainHealthExtrasBundle(): Promise<AdminHomeDomainHealthExtrasBundle> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.value;
  if (inflight) return inflight;

  const run = (async (): Promise<AdminHomeDomainHealthExtrasBundle> => {
    const [communityReportsCount, contentQueueCount, officialQueueCount, growth, treasuryPayload] =
      await Promise.all([
        fetchCommunityReportsCount(),
        fetchContentQueueCount(),
        fetchOfficialQueueCount(),
        fetchGrowthSnapshot(),
        fetchAdminHomeTreasuryChainFacts(),
      ]);

    const treasurySnapshot = resolveAdminHomeTreasuryPoolsSnapshot({ payload: treasuryPayload });
    const governorAddress = treasuryPayload.governorAddress;
    const governanceLive = await fetchGovernanceLive(
      governorAddress,
      treasuryPayload.timelockAddress,
      treasuryPayload.governanceTokenAddress,
    );

    const value: AdminHomeDomainHealthExtrasBundle = {
      contentQueueCount,
      officialQueueCount,
      communityReportsCount,
      growthRegistrations: growth.registrations,
      growthReferrals: growth.referrals,
      growthFrozen: growth.frozen,
      governorAddress,
      governanceLive,
      treasurySnapshot,
    };
    cache = { at: Date.now(), value };
    return value;
  })();

  inflight = run;
  try {
    return await run;
  } finally {
    inflight = null;
  }
}
