import { readFileSync } from "node:fs";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";



const __dir = dirname(fileURLToPath(import.meta.url));

const fe = join(__dir, "..", "..");

const appAdmin = join(fe, "app", "admin");



const DEEP_PAGES: { file: string; key: string }[] = [

  { file: "inbox/AdminUnifiedInboxPageMain.tsx", key: "admin_unified_inbox_subtitle_l5" },

  { file: "finance-suite/AdminFinanceSuitePageMain.tsx", key: "admin_fin_suite_subtitle_l5" },

  { file: "compliance/AdminComplianceHubPageMain.tsx", key: "admin_compliance_hub_subtitle_l5" },

  { file: "compliance/requests/AdminComplianceRequestsPageMain.tsx", key: "admin_compliance_requests_subtitle_l5" },

  { file: "compliance/requests/[requestId]/events/AdminComplianceRequestEventsPageMain.tsx", key: "admin_compliance_events_subtitle_l5" },

  { file: "compliance/requests/[requestId]/update/AdminComplianceRequestUpdatePageMain.tsx", key: "admin_compliance_update_subtitle_l5" },

  { file: "audit/operations/AdminAuditOperationsPageMain.tsx", key: "admin_audit_ops_subtitle_l5" },

  { file: "alerts/incidents/AdminAlertIncidentsHubPageMain.tsx", key: "admin_alert_incident_hub_subtitle_l5" },

  { file: "trust-growth/AdminTrustGrowthPageMain.tsx", key: "admin_trust_growth_subtitle_l5" },

  { file: "api-versions/AdminApiVersionsPageMain.tsx", key: "admin_api_versions_subtitle_l5" },

  { file: "lifecycle/AdminLifecyclePageMain.tsx", key: "admin_lifecycle_subtitle_l5" },

  { file: "media/access-logs/AdminMediaAccessLogsPageMain.tsx", key: "admin_media_access_logs_subtitle_l5" },

  { file: "media/signed-url-tokens/AdminMediaSignedUrlTokensPageMain.tsx", key: "admin_media_signed_url_tokens_subtitle_l5" },

  { file: "scheduler/jobs/AdminSchedulerJobsPageMain.tsx", key: "admin_scheduler_jobs_subtitle_l5" },

  { file: "secrets/metadata/AdminSecretsMetadataPageMain.tsx", key: "admin_secrets_meta_subtitle_l5" },

  { file: "internal-tools/audits/AdminInternalToolAuditsPageMain.tsx", key: "admin_tool_audits_subtitle_l5" },

  { file: "tenants/scopes/AdminTenantScopesPageMain.tsx", key: "admin_tenant_scopes_subtitle_l5" },

  { file: "config/releases/[id]/AdminConfigReleaseDetailPageMain.tsx", key: "admin_config_release_detail_subtitle_l5" },

  { file: "indexer/reconcile/[id]/AdminIndexerReconcileReportPageMain.tsx", key: "admin_indexer_reconcile_subtitle_l5" },

  { file: "indexer/reconcile-reports/ReconcileReportsPageMain.tsx", key: "admin_indexer_reconcile_reports_subtitle_l5" },

  { file: "auth-audit-events/AdminAuthAuditEventsPageMain.tsx", key: "admin_auth_audit_events_subtitle_l5" },

];



/** ① 第三十六批 UX · 合规/媒体/生命周期等深页 subtitle 产品化。 */

describe("admin batch36 UX L5 (①)", () => {

  const zh = readFileSync(join(fe, "locales", "zh.ts"), "utf8");

  const en = readFileSync(join(fe, "locales", "en.ts"), "utf8");



  it("defines paired deep-page _subtitle_l5 keys", () => {

    for (const { key } of DEEP_PAGES) {

      expect(zh).toContain(key);

      expect(en).toContain(key);

    }

  });



  it("deep PageMain chrome uses _subtitle_l5", () => {

    for (const { file, key } of DEEP_PAGES) {

      expect(readFileSync(join(appAdmin, file), "utf8")).toContain(key);

    }

  });

});


