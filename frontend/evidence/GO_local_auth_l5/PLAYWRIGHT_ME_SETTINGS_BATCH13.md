# PLAYWRIGHT_ME_SETTINGS · 批次 13 证据（① 本地）

**阶段：① 本地** — Hub 登出 / 导出下载 / 状态条失败重试 / 邮箱验证链 / 争议真 id（有数据时）。

```bash
PLAYWRIGHT_ME_SETTINGS=1 bash scripts/dev/smoke-me-settings-local.sh
```

日志：`PLAYWRIGHT_ME_SETTINGS_BATCH13.log`（末行 `exit_code=0`）。

## 批次 13 E2E

| 用例 | 说明 |
|------|------|
| Hub `data-tt-me-settings-logout` | L5 确认 → `/auth/login` |
| 数据导出 | 确认 → `.json` 下载 + `data-tt-me-settings-data-export-done` |
| Hub 状态条 | mock API 失败 → 重试恢复 |
| verify-email | 重发 dev token → 提交验证 → done |
| 争议详情 | `GET /disputes` 有项时测真 id（无则 skip） |

Vitest：`meSettingsBatch13Deep.contract.test.ts`。
