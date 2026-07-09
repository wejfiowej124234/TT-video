# Manual UAT Session Log

| 字段 | 值 |
|------|-----|
| **Session ID** | `20260630T112505Z` |
| **阶段** | ① 本地 |
| **开始 UTC** | 2026-06-30T11:25:05Z |
| **结束 UTC** | _（进行中）_ |
| **git SHA** | `422aadb9` |
| **测试人 (Reviewer)** | _（待填）_ |
| **执行范围** | Business C1–C4 / E1–E2 · ① API 脚本 + ② UI 人工 · ③ P0 未开始 |
| **SSOT 清单** | [TT-LOCAL-UI-MANUAL-UAT-CHECKLIST](../../docs/runbook/TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md) · [TT-LOCAL-P0-MANUAL-UAT-CHECKLIST](../../docs/runbook/TT-LOCAL-P0-MANUAL-UAT-CHECKLIST.md) |
| **矩阵** | [TT-LOCAL-TEST-ACCOUNTS-MATRIX](../../docs/runbook/TT-LOCAL-TEST-ACCOUNTS-MATRIX.md) |

## 环境

| 项 | 值 | 状态 |
|----|-----|------|
| API | http://127.0.0.1:8080 | ✅ 200 |
| Frontend | http://localhost:3012 | ✅ 200 |
| 密码 | `Test123!` | Business 固定种子 |
| DB | Docker Postgres（一键栈） | 假定与 start-api-with-seed 一致 |

## 会话文件（本目录）

| 文件 | 用途 |
|------|------|
| [SESSION-LOG.md](./SESSION-LOG.md) | 本文件 · 时间线 · 范围 · 层结论 |
| [UI-CHECKLIST.md](./UI-CHECKLIST.md) | ② C1–E2 逐项勾选 |
| [DEFECTS.md](./DEFECTS.md) | 缺陷台账（人读） |
| [defects.json](./defects.json) | 缺陷台账（机读） |
| [SIGNOFF.md](./SIGNOFF.md) | 人工签字 PASS / CONDITIONAL / FAIL |
| [layer-01-api.log](./layer-01-api.log) | ① 脚本原始输出 |
| `screenshots/` | 截图证据 |

## 层进度

| 层 | 状态 | 证据 | 结论 |
|----|------|------|------|
| **① API** | ✅ 完成 | `layer-01-api.log` | **PASS**（1 WARN → DEFECTS API-20260630-001） |
| **② UI** | 🔄 进行中 | `UI-CHECKLIST.md` | 待签字 |
| **③ P0** | ⏳ 未开始 | `SIGNOFF.md` §P0 | — |

## ① API 执行记录

| UTC | 探针 | Matrix | 结果 | 日志 |
|-----|------|--------|------|------|
| 11:23 | `verify-seed-test-accounts-login.ps1` | C2 C3 C4 E2 C1 | PASS | layer-01-api.log |
| 11:23 | 6b5 杭州向导列表 | C3 | SKIP | API-20260630-001 |
| 11:23 | `smoke-multi-identity-closure-local.sh` | C1 | PASS | — |
| 11:23 | `smoke-provider-workbench-l5-local.sh` | C4 | PASS | — |
| 11:23 | `smoke-steward-workbench-l5-local.sh` | C1 | PASS | — |
| 11:24 | `smoke-acquisition-pd009-local.sh` | C1 | PASS | — |
| 11:23 | `POST /auth/login` | E1 | PASS | — |
| 11:23 | C2/C3 核心 API curl | C2 C3 | 200 | — |
| 11:28 | 公网路由 HTTP 探针 | — | 200×6 | `/` `/auth/login` `/market` … |
| 11:33 | Playwright 旁证 `run-local-six-account-ui-l5-audit.sh` | — | exit 1 | INFRA-20260630-001/002 |

## ② UI 执行记录

_（手测时每完成一项，更新 UI-CHECKLIST.md + 本表时间线）_

| UTC | Persona | 项 | 结果 | 缺陷 ID |
|-----|---------|-----|------|---------|
| _待填_ | C1 | — | — | — |

## ③ P0 执行记录

_（② SIGNOFF 后再开）_

## 会话结论（草稿）

| 层 | 结论 |
|----|------|
| ① API | **PASS** |
| ② UI | _待定_ |
| ③ P0 | _未测_ |
| **整体** | _见 [SIGNOFF.md](./SIGNOFF.md)_ |
