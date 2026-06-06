/** Admin 路径：内部工具/媒体/Flag/Job/调度/租户/合规；由 `routesAdmin.ts` 聚合。 */
export const routesAdminPlatformOps = {
    /** 450 / 170：内部工具执行审计；query limit、tool_id / action_code / actor_id（ILIKE 子串）、approval_request_id（UUID） */
    internalToolAudits: (params?: {
      limit?: number;
      tool_id?: string;
      action_code?: string;
      actor_id?: string;
      approval_request_id?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.tool_id != null && params.tool_id.trim() !== "") {
        sp.set("tool_id", params.tool_id.trim());
      }
      if (params?.action_code != null && params.action_code.trim() !== "") {
        sp.set("action_code", params.action_code.trim());
      }
      if (params?.actor_id != null && params.actor_id.trim() !== "") {
        sp.set("actor_id", params.actor_id.trim());
      }
      if (params?.approval_request_id != null && params.approval_request_id.trim() !== "") {
        sp.set("approval_request_id", params.approval_request_id.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/internal-tools/audits${q ? `?${q}` : ""}`;
    },
    /** 270：`media_access_logs` 只读；query limit、action（精确 [A-Za-z0-9_]≤64）、object_id/actor_or_ip（ILIKE 子串）、token_id（UUID 精确） */
    mediaAccessLogs: (params?: {
      limit?: number;
      action?: string;
      object_id?: string;
      actor_or_ip?: string;
      token_id?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.action != null && params.action.trim() !== "") {
        sp.set("action", params.action.trim());
      }
      if (params?.object_id != null && params.object_id.trim() !== "") {
        sp.set("object_id", params.object_id.trim());
      }
      if (params?.actor_or_ip != null && params.actor_or_ip.trim() !== "") {
        sp.set("actor_or_ip", params.actor_or_ip.trim());
      }
      if (params?.token_id != null && params.token_id.trim() !== "") {
        sp.set("token_id", params.token_id.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/media/access-logs${q ? `?${q}` : ""}`;
    },
    /** 270：`signed_url_tokens` 只读；query limit、object_id（ILIKE）、url_scope（read|download）、issued_to/token_id（UUID 精确） */
    mediaSignedUrlTokens: (params?: {
      limit?: number;
      object_id?: string;
      url_scope?: string;
      issued_to?: string;
      token_id?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.object_id != null && params.object_id.trim() !== "") {
        sp.set("object_id", params.object_id.trim());
      }
      if (params?.url_scope != null && params.url_scope.trim() !== "") {
        sp.set("url_scope", params.url_scope.trim());
      }
      if (params?.issued_to != null && params.issued_to.trim() !== "") {
        sp.set("issued_to", params.issued_to.trim());
      }
      if (params?.token_id != null && params.token_id.trim() !== "") {
        sp.set("token_id", params.token_id.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/media/signed-url-tokens${q ? `?${q}` : ""}`;
    },
    /** 220/240：Feature Flag 台账；query limit、flag_code（子串）、enabled（true|false|1|0|yes|no）、scope */
    flags: (params?: {
      limit?: number;
      flag_code?: string;
      enabled?: string;
      scope?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.flag_code != null && params.flag_code.trim() !== "") {
        sp.set("flag_code", params.flag_code.trim());
      }
      if (params?.enabled != null && params.enabled.trim() !== "") {
        sp.set("enabled", params.enabled.trim());
      }
      if (params?.scope != null && params.scope.trim() !== "") {
        sp.set("scope", params.scope.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/flags${q ? `?${q}` : ""}`;
    },
    /** 240 / 70：Flag 发布；super_admin + 乐观锁 + Idempotency-Key */
    flagPublish: (flagId: string) => `/api/v1/admin/flags/${encodeURIComponent(flagId)}/publish`,
    /** 250：异步任务队列；query limit、status（pending|running|completed|failed|dead_letter|cancelled） */
    jobs: (params?: { limit?: number; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/jobs${q ? `?${q}` : ""}`;
    },
    /** 220：配置发布登记；query limit、release_key、status（draft|published|rolled_back） */
    configReleases: (params?: { limit?: number; release_key?: string; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.release_key != null && params.release_key.trim() !== "") {
        sp.set("release_key", params.release_key.trim());
      }
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/config/releases${q ? `?${q}` : ""}`;
    },
    /** 220：单条 config_releases 只读（UUID） */
    configRelease: (id: string) =>
      `/api/v1/admin/config/releases/${encodeURIComponent(id)}`,
    /** 70 / 230：Secret 元数据（永不返回明文）；query limit、key_alias（子串）、status、env_scope */
    secretsMetadata: (params?: {
      limit?: number;
      key_alias?: string;
      status?: string;
      env_scope?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.key_alias != null && params.key_alias.trim() !== "") {
        sp.set("key_alias", params.key_alias.trim());
      }
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      if (params?.env_scope != null && params.env_scope.trim() !== "") {
        sp.set("env_scope", params.env_scope.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/secrets/metadata${q ? `?${q}` : ""}`;
    },
    /** 260：调度运行记录；query limit、job_code（可选） */
    schedulerJobs: (params?: { limit?: number; job_code?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.job_code != null && params.job_code.trim() !== "") {
        sp.set("job_code", params.job_code.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/scheduler/jobs${q ? `?${q}` : ""}`;
    },
    /** 260：手工补跑登记 queued；super_admin + Idempotency-Key；job_code 路径段须 URL 安全字符 */
    schedulerJobRerun: (jobCode: string) =>
      `/api/v1/admin/scheduler/jobs/${encodeURIComponent(jobCode)}/rerun`,
    /** 320 / 70：多租户区域作用域台账；query limit、tenant_key/region_code（ILIKE 子串）、status、scope_class */
    tenantScopes: (params?: {
      limit?: number;
      tenant_key?: string;
      region_code?: string;
      status?: string;
      scope_class?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.tenant_key != null && params.tenant_key.trim() !== "") {
        sp.set("tenant_key", params.tenant_key.trim());
      }
      if (params?.region_code != null && params.region_code.trim() !== "") {
        sp.set("region_code", params.region_code.trim());
      }
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      if (params?.scope_class != null && params.scope_class.trim() !== "") {
        sp.set("scope_class", params.scope_class.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/tenants/scopes${q ? `?${q}` : ""}`;
    },
    /** 500：DSAR 请求台账；query limit、request_ref/subject_id/jurisdiction（ILIKE 子串）、request_type（export|erasure）、status（open|in_progress|completed|rejected|cancelled） */
    complianceDataRequests: (params?: {
      limit?: number;
      request_ref?: string;
      subject_id?: string;
      request_type?: string;
      status?: string;
      jurisdiction?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.request_ref != null && params.request_ref.trim() !== "") {
        sp.set("request_ref", params.request_ref.trim());
      }
      if (params?.subject_id != null && params.subject_id.trim() !== "") {
        sp.set("subject_id", params.subject_id.trim());
      }
      if (params?.request_type != null && params.request_type.trim() !== "") {
        sp.set("request_type", params.request_type.trim());
      }
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      if (params?.jurisdiction != null && params.jurisdiction.trim() !== "") {
        sp.set("jurisdiction", params.jurisdiction.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/compliance/data-requests${q ? `?${q}` : ""}`;
    },
    /** 500：DSAR 事件轴；`:request_id` 为 UUID */
    complianceDataRequestEvents: (
      requestId: string,
      params?: { limit?: number; event_type?: string },
    ) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.event_type != null && params.event_type.trim() !== "") {
        sp.set("event_type", params.event_type.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/compliance/data-requests/${encodeURIComponent(requestId)}/events${q ? `?${q}` : ""}`;
    },
    /** 320 / 70：作用域状态发布；super_admin + 乐观锁 + Idempotency-Key */
    tenantScopePublish: (scopeId: string) =>
      `/api/v1/admin/tenants/scopes/${encodeURIComponent(scopeId)}/publish`,
    /** 500：DSAR 更新 + 事件；super_admin + 乐观锁 + Idempotency-Key */
    complianceDataRequestUpdate: (requestId: string) =>
      `/api/v1/admin/compliance/data-requests/${encodeURIComponent(requestId)}/update`,
} as const;
