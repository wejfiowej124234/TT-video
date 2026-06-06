/** Admin 路径：`users`～`apiVersions`；由 `routesAdmin.ts` 聚合。 */
export const routesAdminCore = {
    /** ① RBAC 能力包（`admin_rbac.rs`） */
    capabilities: "/api/v1/admin/capabilities",
    rbacRouteMatrix: "/api/v1/admin/rbac/route-matrix",
    /** 工作台系统概况 · 7 日趋势（`admin_metrics_home_http.rs`） */
    metricsHomeOverview: "/api/v1/admin/metrics/home-overview",
    security2faPolicy: "/api/v1/admin/security/2fa-policy",
    userConsoleRole: (userId: string) =>
      `/api/v1/admin/users/${encodeURIComponent(userId)}/console-role`,
    userConsoleRoleChangeRequest: (userId: string) =>
      `/api/v1/admin/users/${encodeURIComponent(userId)}/console-role-change-request`,
    totpStatus: "/api/v1/admin/security/totp/status",
    totpEnroll: "/api/v1/admin/security/totp/enroll",
    totpVerify: "/api/v1/admin/security/totp/verify",
    /** 用户列表；query **`limit`**（1～500，缺省 100）、**`role`**、**`kyc_status`**（精确匹配） */
    users: (params?: { limit?: number; role?: string; kyc_status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.role != null && params.role.trim() !== "") {
        sp.set("role", params.role.trim());
      }
      if (params?.kyc_status != null && params.kyc_status.trim() !== "") {
        sp.set("kyc_status", params.kyc_status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/users${q ? `?${q}` : ""}`;
    },
    userRoleChangeRequest: (id: string) =>
      `/api/v1/admin/users/${id}/role-change-request`,
    /** 70：用户监管详情；不含 password_hash；须 admin */
    userById: (id: string) =>
      `/api/v1/admin/users/${encodeURIComponent(id)}`,
    /** 向导入驻台账；query **`limit`**（1～500，缺省 100）、**`status`**（向导状态精确匹配） */
    guides: (params?: { limit?: number; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/guides${q ? `?${q}` : ""}`;
    },
    /** 70：向导监管详情，与 `GET /api/v1/admin/guides` 列表行同形；不含护照哈希；须 admin */
    guideById: (id: string) =>
      `/api/v1/admin/guides/${encodeURIComponent(id)}`,
    /** 70：订单监管列表；query **`limit`**（1～500，缺省 100）、**`state`**（与 **`order_state_to_str`** 同形，如 **`draft`**） */
    orders: (params?: { limit?: number; state?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.state != null && params.state.trim() !== "") {
        sp.set("state", params.state.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/orders${q ? `?${q}` : ""}`;
    },
    /** 70：订单监管详情，与 `GET /api/v1/orders/:id` 成功响应同形（含可选 itinerary）；须 admin */
    orderById: (id: string) =>
      `/api/v1/admin/orders/${encodeURIComponent(id)}`,
    financeSummary: "/api/v1/admin/finance/summary",
    /** 200 §3.6：财务摘要 CSV 导出（与 `financeSummary` 同源聚合；`format=csv`） */
    financeSummaryExport: "/api/v1/admin/finance/summary/export?format=csv",
    /** FeeRouter PlatformFeeRouted 投影：summary + items + page；须 DB + admin */
    feeRouterRoutedEvents: "/api/v1/admin/fee-router/routed-events",
    /** Epic C-01：治理/协议多源对拍只读（三槽 + drift_summary）；须 admin */
    crossCheck: "/api/v1/admin/cross-check",
    /** Epic C-01：fee-pool vs protocol-reference 漂移摘要只读；须 admin */
    driftSummary: "/api/v1/admin/drift-summary",
    /** RegionVault RegionVaultForwarded 投影：summary + items + page；须 DB + admin */
    regionVaultForwardedEvents: "/api/v1/admin/region-vault/forwarded-events",
    /** 70：争议运营列表；query **`limit`**（1～500，缺省 100）、**`status`**（与行内 **`status`** 精确匹配） */
    disputes: (params?: { limit?: number; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/disputes${q ? `?${q}` : ""}`;
    },
    /** 70：争议监管详情，与 `GET /api/v1/disputes/:id` 成功响应同形（含 updated_at）；须 admin */
    disputeById: (id: string) =>
      `/api/v1/admin/disputes/${encodeURIComponent(id)}`,
    /** Phase 5：评价列表；query `limit`（1～500，缺省 100）、`min_score`/`max_score`（可选 **i16**） */
    reviews: (params?: { limit?: number; min_score?: number; max_score?: number }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.min_score != null) sp.set("min_score", String(params.min_score));
      if (params?.max_score != null) sp.set("max_score", String(params.max_score));
      const q = sp.toString();
      return `/api/v1/admin/reviews${q ? `?${q}` : ""}`;
    },
    /** 70：单条评价监管详情；DB 优先，与列表同源回退内存；响应含 meta.source */
    reviewById: (id: string) =>
      `/api/v1/admin/reviews/${encodeURIComponent(id)}`,
    /** 管理审计日志；query **`limit`**（1～200，缺省 50）、**`actor_id`**（UUID）、**`action`**、**`resource_type`** */
    auditLogs: (params?: {
      limit?: number;
      actor_id?: string;
      action?: string;
      resource_type?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.actor_id != null && params.actor_id.trim() !== "") {
        sp.set("actor_id", params.actor_id.trim());
      }
      if (params?.action != null && params.action.trim() !== "") {
        sp.set("action", params.action.trim());
      }
      if (params?.resource_type != null && params.resource_type.trim() !== "") {
        sp.set("resource_type", params.resource_type.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/audit-logs${q ? `?${q}` : ""}`;
    },
    /** 单条审计日志；与列表项同形；须 PostgreSQL */
    auditLogById: (id: string) =>
      `/api/v1/admin/audit-logs/${encodeURIComponent(id)}`,
    /** 审批单列表；query **`limit`**（1～200，缺省 50）、**`status`**（omit = 不按状态过滤）；须 DB */
    approvals: (params?: { limit?: number; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/approvals${q ? `?${q}` : ""}`;
    },
    /** 单条审批单只读；与列表项同形；须 PostgreSQL */
    approvalById: (id: string) =>
      `/api/v1/admin/approvals/${encodeURIComponent(id)}`,
    approvalApprove: (id: string) => `/api/v1/admin/approvals/${id}/approve`,
    /** Phase 5：运维快照（chain、indexer、rate_limits） */
    observabilityOverview: "/api/v1/admin/observability/overview",
    /** P-OBS1：信任增长 CTR/分布/generation/告警；须 admin + DB */
    trustGrowthObservability: "/api/v1/admin/trust-growth/observability",
    /** P-OBS1：PATCH 冻结权重、强制对照、变体占比上限 */
    trustGrowthControl: "/api/v1/admin/trust-growth/control",
    /** P-OBS1：一键回滚为三等分对照权重并清空 caps */
    trustGrowthRollbackControl: "/api/v1/admin/trust-growth/rollback-control",
    /** 120 / 70：运维审计动作最小列表（占位直至导出流水线） */
    /** 120 / 70：运维审计动作占位列表；query **`limit`**（1～200，缺省 50）；**`applied_filters`** 见响应 */
    auditOperations: (params?: { limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      const q = sp.toString();
      return `/api/v1/admin/audit/operations${q ? `?${q}` : ""}`;
    },
    /** 120 / 70：告警 incident 最小读（占位 JSON） */
    alertIncident: (incidentId: string) =>
      `/api/v1/admin/alerts/incidents/${encodeURIComponent(incidentId)}`,
    /** 330 / 70：schema 版本、迁移历史、回滚、回填、双写校验（query limit 1～200，缺省 50） */
    schemaMigrations: (params?: { limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      const q = sp.toString();
      return `/api/v1/admin/schema/migrations${q ? `?${q}` : ""}`;
    },
    /** 110 / 70：索引器健康、finality、checkpoint、lag（须 admin） */
    indexerHealth: "/api/v1/admin/indexer/health",
    /** 110 / 200：对账报告最小只读（`:id` 为 report 标识；完整导出流水线待补） */
    indexerReconcileReport: (id: string) =>
      `/api/v1/admin/indexer/reconcile-report/${encodeURIComponent(id)}`,
    /** 110 / 200：`reconciliation_reports` 分页列表（不含大 summary） */
    indexerReconcileReports: (params?: {
      limit?: number;
      offset?: number;
      report_type?: string;
      chain_id?: string;
      projection_reconcile_clean?: boolean;
      issues_min?: number;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.offset != null) sp.set("offset", String(params.offset));
      if (params?.report_type != null && params.report_type.trim() !== "") {
        sp.set("report_type", params.report_type.trim());
      }
      if (params?.chain_id != null && params.chain_id.trim() !== "") {
        sp.set("chain_id", params.chain_id.trim());
      }
      if (params?.projection_reconcile_clean !== undefined) {
        sp.set("projection_reconcile_clean", params.projection_reconcile_clean ? "true" : "false");
      }
      if (params?.issues_min != null && params.issues_min > 0) {
        sp.set("issues_min", String(params.issues_min));
      }
      const q = sp.toString();
      return `/api/v1/admin/indexer/reconcile-reports${q ? `?${q}` : ""}`;
    },
    /** 200/110：当前列表筛选条件下的对账报告导出（`format=csv` | `json`；`export_scope=all` 忽略 offset，最多 2000 行；与 `indexerReconcileReports` 同筛选键） */
    indexerReconcileReportsExport: (params?: {
      format?: "csv" | "json";
      /** `all`：与当前筛选匹配的全部行（硬上限见 API 文档） */
      exportScope?: "all";
      limit?: number;
      offset?: number;
      report_type?: string;
      chain_id?: string;
      projection_reconcile_clean?: boolean;
      issues_min?: number;
    }) => {
      const sp = new URLSearchParams();
      sp.set("format", params?.format === "json" ? "json" : "csv");
      if (params?.exportScope === "all") {
        sp.set("export_scope", "all");
      }
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.offset != null) sp.set("offset", String(params.offset));
      if (params?.report_type != null && params.report_type.trim() !== "") {
        sp.set("report_type", params.report_type.trim());
      }
      if (params?.chain_id != null && params.chain_id.trim() !== "") {
        sp.set("chain_id", params.chain_id.trim());
      }
      if (params?.projection_reconcile_clean !== undefined) {
        sp.set("projection_reconcile_clean", params.projection_reconcile_clean ? "true" : "false");
      }
      if (params?.issues_min != null && params.issues_min > 0) {
        sp.set("issues_min", String(params.issues_min));
      }
      const q = sp.toString();
      return `/api/v1/admin/indexer/reconcile-reports/export?${q}`;
    },
    /** 340：API 版本兼容台账；query limit 1～200，缺省 50；api_version（ILIKE 子串）、status（planned|active|deprecated|sunset） */
    apiVersions: (params?: { limit?: number; api_version?: string; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.api_version != null && params.api_version.trim() !== "") {
        sp.set("api_version", params.api_version.trim());
      }
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/api-versions${q ? `?${q}` : ""}`;
    },
    /** 认证审计事件只读（`auth_audit_events`；须 admin；**`reason`** 等 query 与 04 §3.5 对读） */
    authAuditEvents: (params?: {
      limit?: number;
      event_type?: string;
      reason?: string;
      user_id?: string;
      client_ip?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.event_type?.trim()) sp.set("event_type", params.event_type.trim());
      if (params?.reason?.trim()) sp.set("reason", params.reason.trim());
      if (params?.user_id?.trim()) sp.set("user_id", params.user_id.trim());
      if (params?.client_ip?.trim()) sp.set("client_ip", params.client_ip.trim());
      const q = sp.toString();
      return `/api/v1/admin/auth-audit-events${q ? `?${q}` : ""}`;
    },
} as const;
