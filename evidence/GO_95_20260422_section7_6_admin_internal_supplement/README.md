# GO_95 · §7.6 Admin · internal — 机读复验（补充 · v1.4.169）

## §1 命令与退出码（仓库根 · Git Bash）

| # | 命令 | 退出码 / 摘要 |
|---|------|---------------|
| 1 | OK: 07 version triple aligned (1.0.858). | （**07** version triple OK） |
| 2 | check-04-routes-vs-code OK: 04 sec 3.4 table paths are mounted (except DOC_ONLY_SCHEDULED).
  (no undocumented public /api/v1 routes vs sec 3.4 table)
check-04-frontend-routes-vs-app OK: 04 sec 3.4 frontend page routes match frontend/app.
check-04-api-ts-routes-vs-doc-34 OK: all routes block /api/v1|/auth|/meta|/health paths match 04 ¡ì3.4 (178 checked).
check-13-1-table1-routes-vs-app OK: 13-1 sec 2 table 1 routes match frontend/app.
check-13-1-routes-covered-by-04-frontend-table OK: 13-1 table 1 routes are covered by 04 sec 3.4 frontend path table.
check-b432-governance-ui-ssot-surface OK: B-428/B-432 governance closeloop surface pinned. | （04↔code / api.ts↔04 等串联门禁） |
| 3 | 
running 6 tests
test middleware::auth_pause_metrics::tests::internal_gate_tests::allows_when_header_matches_trimmed ... ok
test middleware::auth_pause_metrics::tests::internal_gate_tests::denies_when_header_missing ... ok
test middleware::auth_pause_metrics::tests::internal_gate_tests::no_gate_when_secret_unset ... ok
test middleware::auth_pause_metrics::tests::internal_gate_tests::no_gate_when_secret_empty ... ok
test middleware::auth_pause_metrics::tests::internal_gate_tests::denies_when_header_wrong ... ok
test middleware::auth_pause_metrics::tests::internal_gate_tests::no_gate_off_internal_path ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 959 filtered out; finished in 0.00s | **6 passed**（） |
| 4 | 
running 172 tests
test routes::admin::tests::admin_attach_meta_build_replaces_stale_build_object ... ok
test routes::admin::tests::admin_attach_meta_build_inserts_meta_when_absent ... ok
test routes::admin::tests::admin_attach_meta_build_preserves_other_meta_keys ... ok
test routes::admin::tests::admin_community_appeal_review_invalid_uuid ... ok
test routes::admin::tests::admin_approval_detail_forbidden_for_non_admin ... ok
test routes::admin::tests::admin_api_versions_forbidden_for_non_admin ... ok
test routes::admin::tests::admin_audit_log_detail_forbidden_for_non_admin ... ok
test routes::admin::tests::admin_audit_log_detail_invalid_id_returns_400 ... ok
test routes::admin::tests::admin_audit_log_detail_requires_db ... ok
test routes::admin::tests::admin_api_versions_requires_db ... ok
test routes::admin::tests::admin_community_appeals_invalid_report_id ... ok
test routes::admin::tests::admin_community_appeal_review_requires_super_admin ... ok
test routes::admin::tests::admin_api_versions_invalid_status_returns_400_without_db ... ok
test routes::admin::tests::admin_approval_detail_requires_db ... ok
test routes::admin::tests::admin_approval_detail_invalid_id_returns_400 ... ok
test routes::admin::tests::admin_alert_incident_returns_min_payload_for_admin ... ok
test routes::admin::tests::admin_community_appeals_invalid_status_filter ... ok
test routes::admin::tests::admin_community_appeals_requires_db ... ok
test routes::admin::tests::admin_community_moderation_cases_invalid_actor_id_returns_400_without_db ... ok
test routes::admin::tests::admin_audit_operations_limit_200_returns_full_catalog ... ok
test routes::admin::tests::admin_community_penalties_invalid_status_filter ... ok
test routes::admin::tests::admin_community_moderation_invalid_uuid ... ok
test routes::admin::tests::admin_community_penalties_invalid_subject_uuid ... ok
test routes::admin::tests::admin_community_penalties_requires_db ... ok
test routes::admin::tests::admin_community_ranking_snapshots_requires_db ... ok
test routes::admin::tests::admin_community_policy_change_logs_invalid_actor_id_returns_400_without_db ... ok
test routes::admin::tests::admin_community_reports_forbidden_for_non_admin ... ok
test routes::admin::tests::admin_audit_operations_returns_min_payload_for_admin ... ok
test routes::admin::tests::admin_community_reports_invalid_reporter_id_returns_400_without_db ... ok
test routes::admin::tests::admin_community_reports_invalid_status_filter ... ok
test routes::admin::tests::admin_community_reports_requires_db ... ok
test routes::admin::tests::admin_compliance_data_request_events_invalid_uuid ... ok
test routes::admin::tests::admin_community_reports_invalid_target_id_returns_400_without_db ... ok
test routes::admin::tests::admin_compliance_data_request_update_requires_super_admin ... ok
test routes::admin::tests::admin_compliance_data_request_update_invalid_event_type ... ok
test routes::admin::tests::admin_compliance_data_requests_forbidden_for_non_admin ... ok
test routes::admin::tests::admin_compliance_data_request_events_requires_db ... ok
test routes::admin::tests::admin_compliance_data_requests_invalid_status_returns_400_without_db ... ok
test routes::admin::tests::admin_compliance_data_requests_invalid_type_returns_400_without_db ... ok
test routes::admin::tests::admin_compliance_data_requests_requires_db ... ok
test routes::admin::tests::admin_config_release_by_id_invalid_uuid_returns_400 ... ok
test routes::admin::tests::admin_config_release_by_id_requires_db ... ok
test routes::admin::tests::admin_config_releases_requires_db ... ok
test routes::admin::tests::admin_config_releases_invalid_status_returns_400 ... ok
test routes::admin::tests::admin_dispute_detail_forbidden_for_non_admin_actor ... ok
test routes::admin::tests::admin_dispute_detail_not_found ... ok
test routes::admin::tests::admin_dispute_detail_invalid_id_returns_400 ... ok
test routes::admin::tests::admin_fee_router_routed_events_forbidden_for_non_admin ... ok
test routes::admin::tests::admin_fee_router_routed_events_limit_zero_returns_400_before_db ... ok
test routes::admin::tests::admin_fee_router_routed_events_bad_cursor_returns_400_before_db ... ok
test routes::admin::tests::admin_fee_router_routed_events_not_impl_without_chain_off ... ok
test routes::admin::tests::admin_disputes_list_includes_tourist_traveler_mirror ... ok
test routes::admin::tests::admin_dispute_detail_ok_matches_public_dispute_shape ... ok
test routes::admin::tests::admin_fee_router_routed_events_requires_db ... ok
test routes::admin::tests::admin_finance_summary_export_not_impl_without_chain_off ... ok
test routes::admin::tests::admin_finance_summary_export_rejects_unknown_format ... ok
test routes::admin::tests::admin_finance_summary_forbidden_for_non_admin ... ok
test routes::admin::tests::admin_finance_summary_not_impl_without_chain_off ... ok
test routes::admin::tests::admin_flag_publish_invalid_uuid ... ok
test routes::admin::tests::admin_finance_summary_export_csv_ok ... ok
test routes::admin::tests::admin_flags_forbidden_for_non_admin ... ok
test routes::admin::tests::admin_flag_publish_requires_super_admin ... ok
test routes::admin::tests::admin_flags_invalid_enabled_returns_400 ... ok
test routes::admin::tests::admin_guide_detail_forbidden_for_non_admin_actor ... ok
test routes::admin::tests::admin_flags_requires_db ... ok
test routes::admin::tests::admin_finance_summary_ok_includes_meta_and_disputes ... ok
test routes::admin::tests::admin_guide_detail_invalid_id_returns_400 ... ok
test routes::admin::tests::admin_internal_tool_audits_forbidden_for_non_admin ... ok
test routes::admin::tests::admin_guide_detail_ok_matches_list_shape ... ok
test routes::admin::tests::admin_guides_forbidden_for_non_admin_actor ... ok
test routes::admin::tests::admin_guide_detail_not_found ... ok
test routes::admin::tests::admin_internal_tool_audits_invalid_approval_id_returns_400_without_db ... ok
test routes::admin::tests::admin_internal_tool_audits_requires_db ... ok
test routes::admin::tests::admin_indexer_health_returns_ok_with_core_fields_for_admin ... ok
test routes::admin::tests::admin_guides_ok_for_admin_includes_guide_row ... ok
test routes::admin::tests::admin_jobs_invalid_status_returns_400_without_db ... ok
test routes::admin::tests::admin_jobs_requires_db ... ok
test routes::admin::tests::admin_lifecycle_state_machines_forbidden_for_non_admin ... ok
test routes::admin::tests::admin_lifecycle_state_machines_invalid_anomaly_flag_returns_400_without_db ... ok
test routes::admin::tests::admin_lifecycle_state_machines_requires_db ... ok
test routes::admin::tests::admin_media_access_logs_forbidden_for_non_admin ... ok
test routes::admin::tests::admin_media_access_logs_invalid_action_filter ... ok
test routes::admin::tests::admin_media_access_logs_invalid_token_id_returns_400_without_db ... ok
test routes::admin::tests::admin_media_access_logs_requires_db ... ok
test routes::admin::tests::admin_media_signed_url_tokens_invalid_issued_to_returns_400_without_db ... ok
test routes::admin::tests::admin_media_signed_url_tokens_invalid_token_id_returns_400_without_db ... ok
test routes::admin::tests::admin_media_signed_url_tokens_requires_db ... ok
test routes::admin::tests::admin_media_signed_url_tokens_invalid_scope_returns_400_without_db ... ok
test routes::admin::tests::admin_observability_alert_rules_requires_admin_role ... ok
test routes::admin::tests::admin_memory_first_gets_not_impl_without_chain_off ... ok
test routes::admin::tests::admin_observability_alert_rules_returns_rules_view_for_admin ... ok
test routes::admin::tests::admin_order_detail_invalid_id_returns_400 ... ok
test routes::admin::tests::admin_order_detail_forbidden_for_non_admin_actor ... ok
test routes::admin::tests::admin_order_detail_not_found ... ok
test routes::admin::tests::admin_orders_list_includes_traveler_id_mirror ... ok
test routes::admin::tests::admin_policies_forbidden_for_non_admin ... ok
test routes::admin::tests::admin_policy_publish_invalid_status ... ok
test routes::admin::tests::admin_policies_requires_db ... ok
test routes::admin::tests::admin_observability_overview_requires_admin_role ... ok
test routes::admin::tests::admin_order_detail_ok_matches_public_order_shape ... ok
test routes::admin::tests::admin_policies_invalid_status_returns_400_without_db ... ok
test routes::admin::tests::admin_policy_publish_invalid_uuid ... ok
test routes::admin::tests::admin_policy_publish_requires_super_admin ... ok
test routes::admin::tests::admin_reconcile_report_latest_requires_db ... ok
test routes::admin::tests::admin_reconcile_report_returns_min_contract_response ... ok
test routes::admin::tests::admin_reconcile_reports_export_json_requires_db ... ok
test routes::admin::tests::admin_reconcile_reports_export_rejects_unknown_format ... ok
test routes::admin::tests::admin_reconcile_reports_export_rejects_bad_export_scope ... ok
test routes::admin::tests::admin_reconcile_reports_export_requires_db ... ok
test routes::admin::tests::admin_reconcile_reports_list_requires_db ... ok
test routes::admin::tests::admin_region_vault_forwarded_events_bad_cursor_returns_400_before_db ... ok
test routes::admin::tests::admin_region_vault_forwarded_events_export_bad_format_returns_400_before_db ... ok
test routes::admin::tests::admin_region_vault_forwarded_events_export_limit_zero_returns_400_before_db ... ok
test routes::admin::tests::admin_region_vault_forwarded_events_export_not_impl_without_chain_off ... ok
test routes::admin::tests::admin_region_vault_forwarded_events_export_forbidden_for_non_admin ... ok
test routes::admin::tests::admin_region_vault_forwarded_events_export_requires_db ... ok
test routes::admin::tests::admin_region_vault_forwarded_events_forbidden_for_non_admin ... ok
test routes::admin::tests::admin_observability_overview_returns_min_snapshot_for_admin ... ok
test routes::admin::tests::admin_region_vault_forwarded_events_not_impl_without_chain_off ... ok
test routes::admin::tests::admin_region_vault_forwarded_events_limit_zero_returns_400_before_db ... ok
test routes::admin::tests::admin_region_vault_forwarded_events_requires_db ... ok
test routes::admin::tests::admin_reviews_returns_ok_for_admin_empty_store ... ok
test routes::admin::tests::admin_scheduler_rerun_invalid_job_code ... ok
test routes::admin::tests::admin_review_detail_forbidden_for_non_admin_actor ... ok
test routes::admin::tests::admin_review_detail_not_found ... ok
test routes::admin::tests::admin_reviews_forbidden_for_non_admin_actor ... ok
test routes::admin::tests::admin_review_detail_ok_from_memory ... ok
test routes::admin::tests::admin_require_super_admin_uid_not_impl_without_chain_off_with_bearer ... ok
test routes::admin::tests::admin_reviews_list_includes_tourist_traveler_mirror ... ok
test routes::admin::tests::admin_scheduler_jobs_invalid_job_code_returns_400_without_db ... ok
test routes::admin::tests::admin_review_detail_invalid_id_returns_400 ... ok
test routes::admin::tests::admin_scheduler_rerun_requires_super_admin ... ok
test routes::admin::tests::admin_tenant_scope_publish_invalid_status ... ok
test routes::admin::tests::admin_tenant_scope_publish_invalid_uuid ... ok
test routes::admin::tests::admin_secrets_metadata_invalid_env_scope_returns_400 ... ok
test routes::admin::tests::admin_secrets_metadata_requires_db ... ok
test routes::admin::tests::admin_scheduler_jobs_requires_db ... ok
test routes::admin::tests::admin_tenant_scope_publish_requires_super_admin ... ok
test routes::admin::tests::admin_secrets_metadata_invalid_status_returns_400 ... ok
test routes::admin::tests::admin_tenant_scopes_invalid_scope_class_returns_400_without_db ... ok
test routes::admin::tests::admin_tenant_scopes_invalid_status_returns_400_without_db ... ok
test routes::admin::tests::admin_user_detail_forbidden_for_non_admin_actor ... ok
test routes::admin::tests::admin_tenant_scopes_requires_db ... ok
test routes::admin::tests::admin_user_detail_invalid_id_returns_400 ... ok
test routes::admin::tests::admin_tenant_scopes_forbidden_for_non_admin ... ok
test routes::admin::tests::admin_user_detail_not_found ... ok
test routes::admin::tests::admin_users_forbidden_for_non_admin_actor ... ok
test routes::admin::tests::admin_user_detail_ok_excludes_password_hash ... ok
test routes::admin::tests::admin_users_not_impl_without_chain_off ... ok
test routes::admin::tests::finance_summary_to_csv_flattens_router_vault_and_projection_meta ... ok
test routes::admin::tests::admin_require_admin_actor_not_impl_without_chain_off_with_bearer ... ok
test routes::admin::tests::get_admin_approvals_returns_note_without_db ... ok
test routes::admin::tests::parse_reconcile_export_list_mode_accepts_all_alias ... ok
test routes::admin::tests::get_admin_community_policy_change_logs_requires_db ... ok
test routes::admin::tests::approval_requires_super_admin_role ... ok
test routes::admin::tests::get_admin_community_risk_signals_requires_db ... ok
test routes::admin::tests::patch_admin_community_abuse_policy_requires_super_admin ... ok
test routes::admin::tests::patch_admin_community_abuse_policy_empty_patch_bad_request ... ok
test routes::admin::tests::patch_admin_community_abuse_policy_requires_db ... ok
test routes::admin::tests::post_admin_community_penalty_forbidden_for_non_admin ... ok
test routes::admin::tests::patch_admin_community_comment_forbidden_for_non_admin ... ok
test routes::admin::tests::patch_admin_community_comment_requires_db ... ok
test routes::admin::tests::reconcile_export_response_sha256_hex_empty_body ... ok
test routes::admin::tests::reconcile_reports_list_to_csv_empty_has_header_row ... ok
test routes::admin::tests::region_vault_forwarded_export_csv_one_row_matches_sha256_of_body ... ok
test routes::admin::tests::region_vault_forwarded_export_csv_empty_rows_header_only ... ok
test routes::admin::tests::supported_admin_target_roles_include_provider_and_region_steward_692 ... ok
test routes::admin::tests::role_change_request_requires_db_pool ... ok
test routes::admin::tests::reconcile_export_ed25519_sign_verify_roundtrip ... ok
test routes::admin::tests::admin_observability_overview_orders_deadline_ssot_rpc_failure_fallback_hint ... ok
test routes::admin::tests::admin_observability_overview_orders_deadline_ssot_chain_read_success_hint ... ok
test routes::admin::tests::admin_observability_overview_orders_deadline_ssot_old_governor_fallback_hint ... ok

test result: ok. 172 passed; 0 failed; 0 ignored; 0 measured; 793 filtered out; finished in 0.05s | **172 passed**（） |

## §2 诚实边界（非生产闭证）

- **不**表示 **[140](140-阶段开发云部署与交付架构.md)** 外网 ** 2xx 禁止**、**WAF**、**NetworkPolicy** 等人签矩阵已闭。
- **不**替代 **§8.2 F-030** **行完成**（五格 ****）或 **93** 域矩阵终验。
- **不**替代 **全路由人工越权猎洞**；本包仅为 **UT 子集 + 路由脚本门禁** 复跑旁证。
- 与 ****（**v1.4.85** 主证）及 ****（**v1.4.112** 基线重验）**并列**；**不**改 **§7.6** **** / **U=44** / **C=44/78** / **总 %=50**。

## §3 互指（95 正文）

- **§7.6** 块首 **blockquote（v1.4.169）**
- **§0.2 最后刷新** / **§12.4** / **§6** 变更日志
