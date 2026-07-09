/**
 * P8-1 单测：lib/api 核心路径与公开路由（04 §三、14）
 */
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { apiBase, apiUrl, routes } from "./api";
import { routes as routesCanon } from "./api/routes";

describe("lib/api routes (core + public)", () => {
  it("apiBase is a string URL", () => {
    expect(typeof apiBase).toBe("string");
    expect(apiBase.length).toBeGreaterThan(0);
  });

  it("apiUrl concatenates base and path", () => {
    expect(apiUrl("/meta")).toBe(`${apiBase}/meta`);
    expect(apiUrl(routes.meta)).toBe(`${apiBase}/meta`);
    expect(apiUrl(routes.orders)).toBe(`${apiBase}/api/v1/orders`);
  });

  it("routes match 04 §三", () => {
    expect(routes.meta).toBe("/meta");
    expect(routes.auth.login).toBe("/auth/login");
    expect(routes.auth.register).toBe("/auth/register");
    expect(routes.me).toBe("/api/v1/me");
    expect(routes.guides).toBe("/api/v1/guides");
    expect(routes.guideById("abc")).toBe("/api/v1/guides/abc");
    expect(routes.itineraries).toBe("/api/v1/itineraries");
    expect(routes.orders).toBe("/api/v1/orders");
    expect(routes.orderById("id-1")).toBe("/api/v1/orders/id-1");
    expect(routes.orderChainSyncStatus("id-1")).toBe("/api/v1/orders/id-1/chain-sync-status");
    expect(routes.disputes).toBe("/api/v1/disputes");
    expect(routes.disputeById("d-1")).toBe("/api/v1/disputes/d-1");
  });

  it("routes include mock-pay and intents (48 §2.2)", () => {
    expect(routes.orderMockPay("oid")).toBe("/api/v1/orders/oid/mock-pay");
    expect(routes.orderConfirmCompletionIntent("oid")).toBe("/api/v1/orders/oid/confirm-completion-intent");
    expect(routes.orderOpenDisputeIntent("oid")).toBe("/api/v1/orders/oid/open-dispute-intent");
    expect(routes.disputeExecuteResolutionIntent("did")).toBe("/api/v1/disputes/did/execute-resolution-intent");
  });

  it("routes include media signed-urls and access (04 §3.4 / 270)", () => {
    expect(routes.mediaSignedUrls).toBe("/api/v1/media/signed-urls");
    expect(routes.mediaAccess("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "/api/v1/media/access/550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("routes include traveltrust page-brief (04 B-191)", () => {
    expect(routes.traveltrustPageBrief).toBe("/api/v1/traveltrust/page-brief");
    expect(apiUrl(routes.traveltrustPageBrief)).toBe(`${apiBase}/api/v1/traveltrust/page-brief`);
    expect(routesCanon.governanceTtgExchangeQuote).toBe("/api/v1/governance/ttg-exchange/quote");
  });

  it("routes include trust growth P-SCALE1", () => {
    expect(routes.trustGrowthIngest).toBe("/api/v1/trust-growth/ingest");
    expect(routes.trustGrowthConfig).toBe("/api/v1/trust-growth/config");
  });

  it("routes include trust growth admin P-OBS1", () => {
    expect(routes.admin.trustGrowthObservability).toBe("/api/v1/admin/trust-growth/observability");
    expect(routes.admin.trustGrowthControl).toBe("/api/v1/admin/trust-growth/control");
    expect(routes.admin.trustGrowthRollbackControl).toBe("/api/v1/admin/trust-growth/rollback-control");
  });

  it("routes include governance placeholders (49 G / 84)", () => {
    expect(routes.governancePool).toBe("/api/v1/governance/pool");
    expect(routes.governanceRewards).toBe("/api/v1/governance/rewards");
    expect(routes.governanceFeeRoutes).toBe("/api/v1/governance/fee-routes");
    expect(routes.governanceVaultForwards).toBe("/api/v1/governance/vault-forwards");
    expect(routes.governanceVacancyLedger).toBe("/api/v1/governance/vacancy-ledger");
    expect(routes.adminVacancyLedgerOps).toBe("/api/v1/admin/vacancy-ledger");
    expect(routes.governanceProtocolReference).toBe("/api/v1/governance/protocol-reference");
    expect(routes.governanceProtocolReferencePending).toBe(
      "/api/v1/governance/protocol-reference/pending",
    );
  });
});
