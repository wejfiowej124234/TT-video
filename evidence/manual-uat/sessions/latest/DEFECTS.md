# Defect Register — Session 20260630T112505Z

**机读副本：** [defects.json](./defects.json)

| 状态 | 含义 |
|------|------|
| OPEN | 待修复 |
| VERIFIED | 已修复待复测 |
| CLOSED | 复测通过 |
| WONTFIX | 明确不修（须写理由） |

---

## API-20260630-001

| 字段 | 值 |
|------|-----|
| **ID** | API-20260630-001 |
| **账号** | `guide@test.com` (C3) |
| **页面/探针** | Step 6b5 · `GET /guides?city=杭州` |
| **现象** | 杭州向导列表探针 SKIP |
| **严重度** | P2 |
| **复现步骤** | 1. API 已起 `SEED_TEST_ACCOUNTS=1` 2. 未设 `TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1` 3. 跑 `verify-seed-test-accounts-login.ps1` |
| **预期** | C3 出现在杭州向导列表 |
| **实际** | 探针 SKIP，未断言 |
| **截图** | — |
| **归属** | ① API · env/脚本 |
| **状态** | OPEN |

---

## INFRA-20260630-001

| 字段 | 值 |
|------|-----|
| **ID** | INFRA-20260630-001 |
| **账号** | — |
| **页面/探针** | `frontend/e2e/local-six-account-matrix-ui-l5-audit.spec.ts` |
| **现象** | Playwright 矩阵 spec 文件不存在 · `No tests found` |
| **严重度** | P1 |
| **复现步骤** | 1. `bash scripts/dev/run-local-six-account-ui-l5-audit.sh` 2. 观察 matrix 阶段 |
| **预期** | 17 路径 Playwright 旁证可跑 |
| **实际** | Error: No tests found |
| **截图** | `../local-six-account-ui-l5-audit/20260630T112524Z/playwright-matrix.log` |
| **归属** | ② UI 旁证基建 · Phase ① backlog |
| **状态** | OPEN |

---

## INFRA-20260630-002

| 字段 | 值 |
|------|-----|
| **ID** | INFRA-20260630-002 |
| **账号** | `guide@test.com` 等 |
| **页面/探针** | `e2e/guide-workbench-full-l5.spec.ts` 等 7 条 L5 spec |
| **现象** | E2E 使用错误密码 `password123`，矩阵应为 `Test123!` → 登录超时 FAIL |
| **严重度** | P2 |
| **复现步骤** | 1. 前端 :3012 + API :8080 2. `run-local-six-account-ui-l5-audit.sh` SKIP_MACHINE=1 |
| **预期** | 旁证 exit 0（或至少登录成功） |
| **实际** | 7/7 L5 corridor FAIL · waitForURL timeout |
| **截图** | `../local-six-account-ui-l5-audit/20260630T112524Z/playwright-guide-workbench-full-l5.log` |
| **归属** | ② UI 旁证基建 · 不阻断人工 Checklist |
| **状态** | OPEN |

---

## UI 缺陷模板（手测发现时复制）

```markdown
## UI-YYYYMMDD-Cx-NNN

| 字段 | 值 |
|------|-----|
| **ID** | UI-20260630-C1-001 |
| **账号** | multi-demo@test.com |
| **页面** | /me/publish |
| **现象** | （描述） |
| **严重度** | P0 / P1 / P2 / P3 |
| **复现步骤** | 1. … 2. … 3. … |
| **预期** | |
| **实际** | |
| **截图** | screenshots/UI-20260630-C1-001.png |
| **归属** | ② UI / ③ P0 backlog |
| **状态** | OPEN |
```
