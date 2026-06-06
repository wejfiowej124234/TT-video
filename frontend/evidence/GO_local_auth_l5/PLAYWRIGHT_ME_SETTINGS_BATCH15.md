# Playwright · `/me/settings` batch 15（① 本地）

| 项 | 用例 |
|----|------|
| P0 争议详情 API | `disputePublicDetailOk` + PG 迁移 `20260602120000_disputes_legacy_schema_align` |
| P1 通知偏好 | toggle → 强制 `PUT /api/v1/me` 200 + GET `settings_preferences` 回读 |
| P1 隐私可见性 | `/me/settings/privacy` followers → localStorage + PUT + reload |
| P1 账户导航全量 | `PLAYWRIGHT_FULL=1 bash scripts/dev/smoke-account-nav-full-local.sh` |

```bash
# 迁移（DATABASE_URL 已配置时，API 启动前或后均可）
sqlx migrate run --source crates/api/migrations

bash scripts/dev/smoke-me-settings-local.sh
PLAYWRIGHT_ME_SETTINGS=1 bash scripts/dev/smoke-me-settings-local.sh
PLAYWRIGHT_FULL=1 bash scripts/dev/smoke-account-nav-full-local.sh
```

日志默认：`PLAYWRIGHT_ME_SETTINGS_BATCH15.log`
