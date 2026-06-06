/** Admin 路径：社区治理/生命周期/策略；由 `routesAdmin.ts` 聚合。 */
export const routesAdminCommunityPolicies = {
    /** 160：社区举报工单池；query limit、status、reporter_id/target_id（UUID）、target_type/reason_code（ILIKE 子串） */
    communityReports: (params?: {
      limit?: number;
      status?: string;
      reporter_id?: string;
      target_type?: string;
      reason_code?: string;
      target_id?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      if (params?.reporter_id != null && params.reporter_id.trim() !== "") {
        sp.set("reporter_id", params.reporter_id.trim());
      }
      if (params?.target_type != null && params.target_type.trim() !== "") {
        sp.set("target_type", params.target_type.trim());
      }
      if (params?.reason_code != null && params.reason_code.trim() !== "") {
        sp.set("reason_code", params.reason_code.trim());
      }
      if (params?.target_id != null && params.target_id.trim() !== "") {
        sp.set("target_id", params.target_id.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/community/reports${q ? `?${q}` : ""}`;
    },
    /** 160：申诉台账；query limit、report_id（UUID，可选）、status（pending|accepted|rejected） */
    communityAppeals: (params?: { limit?: number; report_id?: string; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.report_id != null && params.report_id.trim() !== "") {
        sp.set("report_id", params.report_id.trim());
      }
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/community/appeals${q ? `?${q}` : ""}`;
    },
    /** 160：审核审计行；query limit、report_id/actor_id（UUID）、status_before/status_after（ILIKE 子串） */
    communityModerationCases: (params?: {
      limit?: number;
      report_id?: string;
      actor_id?: string;
      status_before?: string;
      status_after?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.report_id != null && params.report_id.trim() !== "") {
        sp.set("report_id", params.report_id.trim());
      }
      if (params?.actor_id != null && params.actor_id.trim() !== "") {
        sp.set("actor_id", params.actor_id.trim());
      }
      if (params?.status_before != null && params.status_before.trim() !== "") {
        sp.set("status_before", params.status_before.trim());
      }
      if (params?.status_after != null && params.status_after.trim() !== "") {
        sp.set("status_after", params.status_after.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/community/moderation/cases${q ? `?${q}` : ""}`;
    },
    /** 160 §5：风险信号；query limit、subject_user_id（UUID）、signal_type/rule_id/severity（ILIKE 子串） */
    communityRiskSignals: (params?: {
      limit?: number;
      subject_user_id?: string;
      signal_type?: string;
      rule_id?: string;
      severity?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.subject_user_id != null && params.subject_user_id.trim() !== "") {
        sp.set("subject_user_id", params.subject_user_id.trim());
      }
      if (params?.signal_type != null && params.signal_type.trim() !== "") {
        sp.set("signal_type", params.signal_type.trim());
      }
      if (params?.rule_id != null && params.rule_id.trim() !== "") {
        sp.set("rule_id", params.rule_id.trim());
      }
      if (params?.severity != null && params.severity.trim() !== "") {
        sp.set("severity", params.severity.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/community/risk-signals${q ? `?${q}` : ""}`;
    },
    /** 160 §5：策略变更审计；query limit、scope/summary/source（ILIKE）、actor_id（UUID） */
    communityPolicyChangeLogs: (params?: {
      limit?: number;
      scope?: string;
      summary?: string;
      source?: string;
      actor_id?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.scope != null && params.scope.trim() !== "") {
        sp.set("scope", params.scope.trim());
      }
      if (params?.summary != null && params.summary.trim() !== "") {
        sp.set("summary", params.summary.trim());
      }
      if (params?.source != null && params.source.trim() !== "") {
        sp.set("source", params.source.trim());
      }
      if (params?.actor_id != null && params.actor_id.trim() !== "") {
        sp.set("actor_id", params.actor_id.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/community/policy-change-logs${q ? `?${q}` : ""}`;
    },
    /** 160：Feed 排序快照审计；query limit、feed_mode（ILIKE 子串） */
    communityRankingSnapshots: (params?: { limit?: number; feed_mode?: string }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.feed_mode != null && params.feed_mode.trim() !== "") {
        sp.set("feed_mode", params.feed_mode.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/community/ranking/snapshots${q ? `?${q}` : ""}`;
    },
    /** 160：处罚台账；query limit、subject_user_id、report_id、status（active|lifted|superseded） */
    communityPenalties: (params?: {
      limit?: number;
      subject_user_id?: string;
      report_id?: string;
      status?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.subject_user_id != null && params.subject_user_id.trim() !== "") {
        sp.set("subject_user_id", params.subject_user_id.trim());
      }
      if (params?.report_id != null && params.report_id.trim() !== "") {
        sp.set("report_id", params.report_id.trim());
      }
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/community/penalties${q ? `?${q}` : ""}`;
    },
    /** 160：审核处置 PATCH；`:id` 为举报 UUID；admin + 幂等键 */
    communityModeration: (reportId: string) =>
      `/api/v1/admin/community/moderation/${encodeURIComponent(reportId)}`,
    /** 160：登记处罚 POST（与 GET 同路径） */
    communityPenaltyCreate: "/api/v1/admin/community/penalties",
    /** 160：评论可见性 PATCH */
    communityCommentVisibility: (commentId: string) =>
      `/api/v1/admin/community/comments/${encodeURIComponent(commentId)}`,
    /** 160 §5：滥用策略补丁 PATCH；super_admin + 幂等键 */
    communityAbusePolicy: "/api/v1/admin/community/abuse-policy",
    /** 160：申诉复核 POST；`:id` 为 appeal UUID；super_admin + 幂等键 */
    communityAppealReview: (appealId: string) =>
      `/api/v1/admin/community/appeals/${encodeURIComponent(appealId)}/review`,
    /** 350：生命周期状态机台账；query limit；machine_code/domain/entity_type/version/source_of_truth（ILIKE 子串）；anomaly_flag（true|false|1|0|yes|no） */
    lifecycleStateMachines: (params?: {
      limit?: number;
      machine_code?: string;
      domain?: string;
      entity_type?: string;
      version?: string;
      source_of_truth?: string;
      anomaly_flag?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.machine_code != null && params.machine_code.trim() !== "") {
        sp.set("machine_code", params.machine_code.trim());
      }
      if (params?.domain != null && params.domain.trim() !== "") {
        sp.set("domain", params.domain.trim());
      }
      if (params?.entity_type != null && params.entity_type.trim() !== "") {
        sp.set("entity_type", params.entity_type.trim());
      }
      if (params?.version != null && params.version.trim() !== "") {
        sp.set("version", params.version.trim());
      }
      if (params?.source_of_truth != null && params.source_of_truth.trim() !== "") {
        sp.set("source_of_truth", params.source_of_truth.trim());
      }
      if (params?.anomaly_flag != null && params.anomaly_flag.trim() !== "") {
        sp.set("anomaly_flag", params.anomaly_flag.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/lifecycle/state-machines${q ? `?${q}` : ""}`;
    },
    /** 70：数据权限策略台账；query limit、policy_code / scope_type / binding_role（ILIKE 子串）、status */
    policies: (params?: {
      limit?: number;
      policy_code?: string;
      status?: string;
      scope_type?: string;
      binding_role?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.limit != null) sp.set("limit", String(params.limit));
      if (params?.policy_code != null && params.policy_code.trim() !== "") {
        sp.set("policy_code", params.policy_code.trim());
      }
      if (params?.status != null && params.status.trim() !== "") {
        sp.set("status", params.status.trim());
      }
      if (params?.scope_type != null && params.scope_type.trim() !== "") {
        sp.set("scope_type", params.scope_type.trim());
      }
      if (params?.binding_role != null && params.binding_role.trim() !== "") {
        sp.set("binding_role", params.binding_role.trim());
      }
      const q = sp.toString();
      return `/api/v1/admin/policies${q ? `?${q}` : ""}`;
    },
    /** 70：策略状态发布；super_admin + 乐观锁 + Idempotency-Key */
    policyPublish: (policyId: string) =>
      `/api/v1/admin/policies/${encodeURIComponent(policyId)}/publish`,
} as const;
