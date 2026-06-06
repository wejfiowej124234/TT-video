/**
 * P8-1 单测：lib/api routes.admin（平台 / 配置 / 生命周期）与 04 §三、14、70 管理面路径一致
 */
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { routes } from "./api";

describe("lib/api routes.admin · platform & config", () => {
  it("observability, fee-router, config, secrets, flags, tenants, policies, tools, api-versions, lifecycle", () => {
    expect(routes.admin.observabilityOverview).toBe("/api/v1/admin/observability/overview");
    expect(routes.admin.metricsHomeOverview).toBe("/api/v1/admin/metrics/home-overview");
    expect(routes.admin.feeRouterRoutedEvents).toBe("/api/v1/admin/fee-router/routed-events");
    expect(routes.admin.regionVaultForwardedEvents).toBe(
      "/api/v1/admin/region-vault/forwarded-events",
    );
    expect(routes.admin.configRelease("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "/api/v1/admin/config/releases/550e8400-e29b-41d4-a716-446655440000",
    );
    expect(
      routes.admin.configReleases({ limit: 20, release_key: "ssot", status: "published" }),
    ).toBe("/api/v1/admin/config/releases?limit=20&release_key=ssot&status=published");
    expect(
      routes.admin.secretsMetadata({
        limit: 50,
        key_alias: "HMAC",
        status: "active",
        env_scope: "api",
      }),
    ).toBe("/api/v1/admin/secrets/metadata?limit=50&key_alias=HMAC&status=active&env_scope=api");
    expect(
      routes.admin.flags({ limit: 100, flag_code: "pay", enabled: "true", scope: "global" }),
    ).toBe("/api/v1/admin/flags?limit=100&flag_code=pay&enabled=true&scope=global");
    expect(
      routes.admin.tenantScopes({
        limit: 30,
        tenant_key: "def",
        region_code: "global",
        status: "active",
        scope_class: "ops",
      }),
    ).toBe(
      "/api/v1/admin/tenants/scopes?limit=30&tenant_key=def&region_code=global&status=active&scope_class=ops",
    );
    expect(
      routes.admin.policies({
        limit: 25,
        policy_code: "baseline",
        status: "active",
        scope_type: "resource",
        binding_role: "tourist",
      }),
    ).toBe(
      "/api/v1/admin/policies?limit=25&policy_code=baseline&status=active&scope_type=resource&binding_role=tourist",
    );
    expect(
      routes.admin.internalToolAudits({
        limit: 40,
        tool_id: "reg",
        action_code: "inspect",
        actor_id: "u1",
        approval_request_id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    ).toBe(
      "/api/v1/admin/internal-tools/audits?limit=40&tool_id=reg&action_code=inspect&actor_id=u1&approval_request_id=550e8400-e29b-41d4-a716-446655440000",
    );
    expect(
      routes.admin.apiVersions({ limit: 30, api_version: "v1", status: "active" }),
    ).toBe("/api/v1/admin/api-versions?limit=30&api_version=v1&status=active");
    expect(
      routes.admin.lifecycleStateMachines({
        limit: 25,
        machine_code: "escrow",
        domain: "order",
        entity_type: "escrow",
        version: "1",
        source_of_truth: "db",
        anomaly_flag: "false",
      }),
    ).toBe(
      "/api/v1/admin/lifecycle/state-machines?limit=25&machine_code=escrow&domain=order&entity_type=escrow&version=1&source_of_truth=db&anomaly_flag=false",
    );
  });
});
