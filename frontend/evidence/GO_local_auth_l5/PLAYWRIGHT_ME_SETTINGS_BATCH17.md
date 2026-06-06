# Playwright · `/me/settings` batch 17（① 本地）

| 项 | 用例 |
|----|------|
| API + 同源代理 | `GET|DELETE /api/v1/me/sessions*` · `GET /api/v1/me/security-notifications` · `app/api/v1/me/sessions/**` |
| 安全 · 撤销非当前会话 | `data-tt-me-security-revoke-suffix` + L5 → `DELETE …/sessions/e2e02` → Hub `?flash=sessions` |
| 安全 · 撤销当前会话 | 真 API 优先；404 时 `installMeSessionsTwoDeviceRoute` 回退 |
| Hub Soon / 功能路由 | `meSettingsNavModel` 无 `comingSoon: true` · tracker 数据导出 `data-tt` |
| 机读 | `meSettingsBatch17Deep` · FREEZE 批次 **17** 行 |

```bash
bash scripts/dev/smoke-me-settings-local.sh
PLAYWRIGHT_ME_SETTINGS=1 bash scripts/dev/smoke-me-settings-local.sh
```

日志默认：`PLAYWRIGHT_ME_SETTINGS_BATCH17.log`（**47 passed · 1 skipped · exit 0**）
