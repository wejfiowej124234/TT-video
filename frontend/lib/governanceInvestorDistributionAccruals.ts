/**
 * P5-4-2：应计分红分录只读 — URL 与校验（仅 `GET /api/v1/governance/investor-distribution-accruals`）。
 * 禁止在此模块引用 `routes.internalInvestorDistributionAccrual` 或任何 `/internal/` 写路径。
 */

import { routes } from "@/lib/api";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** 列表/详情请求均只命中 governance GET（04 §3.4）。 */
export function buildGovernanceInvestorDistributionAccrualsUrl(opts: {
  limit?: number;
  chainId?: number;
  distributionId?: string;
}): string {
  const base = routes.governanceInvestorDistributionAccruals;
  const sp = new URLSearchParams();
  if (opts.limit != null) sp.set("limit", String(opts.limit));
  if (opts.chainId != null) sp.set("chain_id", String(opts.chainId));
  if (opts.distributionId != null && opts.distributionId.trim() !== "") {
    sp.set("distribution_id", opts.distributionId.trim());
  }
  const q = sp.toString();
  return q ? `${base}?${q}` : base;
}

export function isDistributionDetailUuid(id: string): boolean {
  return UUID_RE.test(id.trim());
}
