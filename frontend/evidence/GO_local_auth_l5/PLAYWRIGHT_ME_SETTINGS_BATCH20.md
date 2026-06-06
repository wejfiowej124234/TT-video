# Playwright · `/me/settings` batch 20（① 本地）

| 项 | 用例 |
|----|------|
| Hub 钱包 chip | `data-tt-me-settings-hub-status-wallet` → `?focus=wallet` · `#me-security-wallet` 入视口 |
| 撤销 suffix | `DELETE …/sessions/:suffix` 后 `GET /me/sessions` 条数 **-1** |
| 通知 event_type | 筛选 `password_changed` · 隐藏 `login_alert` |
| tracker / gate | Hub 三 chip + security `data-tt` 入 `meSettingsPageTracker.v1` |
| smoke | API `/health` 预检 → 自动 `PLAYWRIGHT_REUSE_API_SERVER=1` |

```bash
bash scripts/dev/smoke-me-settings-local.sh
PLAYWRIGHT_ME_SETTINGS=1 bash scripts/dev/smoke-me-settings-local.sh
```

日志默认：`PLAYWRIGHT_ME_SETTINGS_BATCH20.log`
