import { adminFetchJson } from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders, getMeta } from "@/lib/apiClient";
import { chainContractsFromMeta, chainIdFromMeta } from "@/lib/governanceChainMeta";

import type { AdminHomeTreasuryChainInput } from "@/lib/admin/adminHomeTreasuryPools";

const TREASURY_FACTS_TTL_MS = 30_000;
let treasuryFactsCache: { at: number; value: AdminHomeTreasuryChainInput } | null = null;
let treasuryFactsInflight: Promise<AdminHomeTreasuryChainInput> | null = null;

function strOrNull(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function intOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return Math.floor(v);
  return null;
}

function contractsAddr(
  contracts: Record<string, unknown> | null,
  key: string,
): string | null {
  if (!contracts) return null;
  return strOrNull(contracts[key]);
}

async function fetchIndexerSummary(
  context: string,
  listUrl: string,
): Promise<{ total: number | null; latestAt: string | null }> {
  const headers: Record<string, string> = { "x-request-id": `${context}-${Date.now()}` };
  try {
    Object.assign(headers, getAuthHeaders());
  } catch {
    return { total: null, latestAt: null };
  }
  try {
    const { res, body } = await adminFetchJson<{
      summary?: { total?: unknown; latest_inserted_at?: unknown };
      status?: string;
    }>(context, apiUrl(listUrl), { headers });
    if (!res.ok) return { total: null, latestAt: null };
    const summary = body.summary;
    const latest = summary?.latest_inserted_at;
    return {
      total: intOrNull(summary?.total),
      latestAt: typeof latest === "string" && latest.trim() ? latest.trim() : null,
    };
  } catch {
    return { total: null, latestAt: null };
  }
}

export function invalidateAdminHomeTreasuryChainFacts(): void {
  treasuryFactsCache = null;
}

/**
 * Official workbench Web3 inflow · read-only.
 * L7 = GET /meta chain.contracts · L8 = FeeRouter / RegionVault Indexer lists.
 */
export async function fetchAdminHomeTreasuryChainFacts(): Promise<AdminHomeTreasuryChainInput> {
  const now = Date.now();
  if (treasuryFactsCache && now - treasuryFactsCache.at < TREASURY_FACTS_TTL_MS) {
    return treasuryFactsCache.value;
  }
  if (treasuryFactsInflight) return treasuryFactsInflight;

  const empty: AdminHomeTreasuryChainInput = {
    chainId: null,
    feeRouterAddress: null,
    treasuryAddress: null,
    governorAddress: null,
    governanceTokenAddress: null,
    escrowFactoryAddress: null,
    timelockAddress: null,
    feeRouterEventTotal: null,
    feeRouterLatestAt: null,
    regionVaultEventTotal: null,
    regionVaultLatestAt: null,
    fetchError: false,
  };

  const run = (async (): Promise<AdminHomeTreasuryChainInput> => {
    let meta: Record<string, unknown>;
    try {
      meta = await getMeta({ compact: true });
    } catch {
      return { ...empty, fetchError: true };
    }

    let snap = chainContractsFromMeta(meta);
    let chain = meta.chain;
    let contractsObj =
      chain && typeof chain === "object" && !Array.isArray(chain)
        ? ((chain as Record<string, unknown>).contracts as Record<string, unknown> | null)
        : null;
    if (!snap && !contractsObj) {
      try {
        meta = await getMeta({ compact: false, force: true });
        snap = chainContractsFromMeta(meta);
        chain = meta.chain;
        contractsObj =
          chain && typeof chain === "object" && !Array.isArray(chain)
            ? ((chain as Record<string, unknown>).contracts as Record<string, unknown> | null)
            : null;
      } catch {
        return { ...empty, fetchError: true };
      }
    }

    const escrowFactoryAddress =
      contractsAddr(contractsObj, "escrow_factory_v2_address") ??
      contractsAddr(contractsObj, "escrow_factory_address");

    const [feeRouter, regionVault] = await Promise.all([
      fetchIndexerSummary(
        "AdminHomeTreasury.feeRouter",
        `${routes.admin.feeRouterRoutedEvents}?limit=1`,
      ),
      fetchIndexerSummary(
        "AdminHomeTreasury.regionVault",
        `${routes.admin.regionVaultForwardedEvents}?limit=1`,
      ),
    ]);

    const value: AdminHomeTreasuryChainInput = {
      chainId: chainIdFromMeta(meta),
      feeRouterAddress: snap?.fee_router_address ?? contractsAddr(contractsObj, "fee_router_address"),
      treasuryAddress: snap?.treasury_address ?? contractsAddr(contractsObj, "treasury_address"),
      governorAddress: snap?.governor_address ?? contractsAddr(contractsObj, "governor_address"),
      governanceTokenAddress:
        snap?.governance_token_address ?? contractsAddr(contractsObj, "governance_token_address"),
      escrowFactoryAddress,
      timelockAddress: snap?.timelock_address ?? contractsAddr(contractsObj, "timelock_address"),
      feeRouterEventTotal: feeRouter.total,
      feeRouterLatestAt: feeRouter.latestAt,
      regionVaultEventTotal: regionVault.total,
      regionVaultLatestAt: regionVault.latestAt,
      fetchError: false,
    };
    treasuryFactsCache = { at: Date.now(), value };
    return value;
  })();

  treasuryFactsInflight = run;
  try {
    return await run;
  } finally {
    treasuryFactsInflight = null;
  }
}
