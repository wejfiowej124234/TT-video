# Playwright · `/me/settings` batch 19（① 本地）

| 项 | 用例 |
|----|------|
| P0 稳定性 | `PLAYWRIGHT_E2E_STABILITY=1` 时 API webServer **600s** 超时 |
| 真双会话 | `loginTouristDualSessionViaBrowser`（第二 Context UI 登录）→ 回退 API 双 login |
| Hub 通知 chip | `data-tt-me-settings-hub-status-notifications` → `?focus=notifications` |
| 通知筛选 | seed `me_settings_e2e_sent`（`delivery_status=sent`）· 筛选后仅见 sent 行 |
| 机读 | `meSettingsExtensionPlaywrightCoverage` · `meSettingsBatch19Deep` |

```bash
bash scripts/dev/smoke-me-settings-local.sh
PLAYWRIGHT_ME_SETTINGS=1 bash scripts/dev/smoke-me-settings-local.sh
```

日志默认：`PLAYWRIGHT_ME_SETTINGS_BATCH19.log`
