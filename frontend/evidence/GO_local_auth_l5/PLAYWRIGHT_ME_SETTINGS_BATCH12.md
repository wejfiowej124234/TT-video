# PLAYWRIGHT_ME_SETTINGS · 批次 12 证据（① 本地）

**阶段：① 本地** — 须 API `GET /health` 与 Next dev（默认 `http://127.0.0.1:3000`）可用；**非** ②③ staging/主网 GO。

## 跑法

```bash
# 仓库根 · API + 前端 dev 已起
PLAYWRIGHT_ME_SETTINGS=1 bash scripts/dev/smoke-me-settings-local.sh
```

日志默认写入同目录：`PLAYWRIGHT_ME_SETTINGS_BATCH12.log`（末行须 `exit_code=0`）。

自定义日志路径：

```bash
PLAYWRIGHT_ME_SETTINGS=1 \
  PLAYWRIGHT_ME_SETTINGS_EVIDENCE=frontend/evidence/GO_local_auth_l5/my-run.log \
  bash scripts/dev/smoke-me-settings-local.sh
```

## 批次 12 E2E 深化用例

| 用例 | 说明 |
|------|------|
| Hub 未验证邮箱 chip | 新注册用户 → `data-tt-me-settings-hub-status-email` → `/auth/verify-email?from=settings` |
| 种子游客 chip 条件 | `GET /me` 有 `email_verified_at` 时 chip 隐藏 |
| 删号工单提交链 | `settings-data` + `intent=delete-account` → 提交 → `data-tt-community-feedback-delete-account-submitted` |
| 数据页删号路由 | L5 确认 → 跳转反馈预填 URL |
| 顶栏登出 | `data-tt-header-logout-l5` + `alertdialog` 确认 → 会话清除 |

Vitest 并集：`meSettingsBatch12Deep.contract.test.ts`。
