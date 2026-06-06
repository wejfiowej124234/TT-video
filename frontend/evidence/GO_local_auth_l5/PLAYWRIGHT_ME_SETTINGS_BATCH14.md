# Playwright · `/me/settings` batch 14（① 本地）

| 项 | 用例 |
|----|------|
| F-025 争议真 id | `ensureDisputeIdForBearer` 种子链；无 mock-pay 时 skip |
| 社区登出 | `/community/me?from=settings` · `data-tt-me-logout-l5` + L5 确认 |
| 通知偏好 PUT | toggle → `PUT /api/v1/me` → reload 保持 `aria-checked` |
| 账户导航并集 | `PLAYWRIGHT_FULL=1 bash scripts/dev/smoke-account-nav-full-local.sh` |

```bash
PLAYWRIGHT_ME_SETTINGS=1 bash scripts/dev/smoke-me-settings-local.sh
PLAYWRIGHT_FULL=1 bash scripts/dev/smoke-account-nav-full-local.sh
```

日志默认：`PLAYWRIGHT_ME_SETTINGS_BATCH14.log`
