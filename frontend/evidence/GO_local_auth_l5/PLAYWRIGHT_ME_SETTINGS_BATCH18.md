# Playwright · `/me/settings` batch 18（① 本地）

| 项 | 用例 |
|----|------|
| 真双会话 | `loginTouristWithSecondarySession`（两次 login）· 按真实 suffix 撤销 · 无 `e2e02` mock |
| Hub → 安全 | `data-tt-me-settings-hub-status-sessions` → `/me/security?focus=sessions` · `#me-security-sessions` 入视口 |
| 安全通知 | seed `login_alert` / `me_settings_e2e_fixture` · 展开 `data-tt-me-security-notif-expand` · 导出 JSON |
| gate | `me-settings-l5-local-gate` 安全 markers + `api_proxy_paths` |
| 机读 | `meSettingsBatch18Deep` · FREEZE 批次 **18** |

```bash
bash scripts/dev/smoke-me-settings-local.sh
PLAYWRIGHT_ME_SETTINGS=1 bash scripts/dev/smoke-me-settings-local.sh
PLAYWRIGHT_FULL=1 bash scripts/dev/smoke-account-nav-full-local.sh
```

日志默认：`PLAYWRIGHT_ME_SETTINGS_BATCH18.log`
