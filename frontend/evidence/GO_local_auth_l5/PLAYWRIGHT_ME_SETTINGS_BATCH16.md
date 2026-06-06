# Playwright · `/me/settings` batch 16（① 本地）

| 项 | 用例 |
|----|------|
| 安全 · 撤销当前会话 | `data-tt-me-security-revoke-current` + L5 确认 + `DELETE /api/v1/me/sessions/current` |
| 争议空列表 | `installEmptyDisputesListRoute` → `data-tt-disputes-empty` + 文案 |
| 机读 | `meSettingsBatch16Deep` · FREEZE 批次表 · gate `data-tt-disputes-empty` |
| 账户导航全量 | `PLAYWRIGHT_FULL=1 bash scripts/dev/smoke-account-nav-full-local.sh` |

```bash
bash scripts/dev/smoke-me-settings-local.sh
PLAYWRIGHT_ME_SETTINGS=1 bash scripts/dev/smoke-me-settings-local.sh
PLAYWRIGHT_FULL=1 bash scripts/dev/smoke-account-nav-full-local.sh
```

日志默认：`PLAYWRIGHT_ME_SETTINGS_BATCH16.log`
