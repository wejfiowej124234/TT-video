# GO · 前端 TypeScript 门禁收口（`tsc --noEmit` 全绿）

**TT ID**：`TT-DOC-FRONTEND-TSC-GATE-CLOSE-001`  
**母表**：[`docs/任务母表.md`](../docs/任务母表.md) **B-125**  
**过门日**：2026-04-09  

## 验收命令

```bash
cd frontend && npx tsc --noEmit
```

**期望**：进程 **exit code 0**，无诊断输出。

## 收口项（TS-0 / TS-4 / TS-5 / TS-6 / TS-7 / TS-8）

| 项 | 作用 | 主要触及 |
|----|------|----------|
| **TS-0** | **`compilerOptions.target` → ES2020**；清理陈旧 **`tsconfig.tsbuildinfo`**，避免增量缓存下的 **TS2737**（BigInt 字面量）误报 | `frontend/tsconfig.json`、`frontend/tsconfig.tsbuildinfo`（删除） |
| **TS-4** | **`claimable` / `effectiveMax`**：对 **`useReadContract`** 的 **`data`** 做 **`bigint` 只读窄化**（`typeof v === "bigint"`），不改 Claim 页业务分支 | `frontend/app/governance/distribution-claim/page.tsx` |
| **TS-5 / TS-6** | **`mapApiReadError(err, t, fallbackKey)`** 三参；HTTP 非 OK 使用 **`new Error(\`request_failed_${status}\`)`** + **`t`** + **`governance_requestFailed`** | `frontend/app/governance/distribution-accruals/page.tsx`、`frontend/app/governance/distribution-accruals/[id]/page.tsx` |
| **TS-7 / TS-8** | Vitest **`vi` 未定义（TS2304）**：自 **`vitest`** 显式导入 **`vi`** | 治理相关 `*.test.tsx`（以仓库当前文件为准） |

## 已封口边界（本卷未改动）

本轮为 **类型/工具链与测试桩** 级修补，**不**修改 **B-115 / B-116 / P5 / Epic A / Epic C** 已封口的业务语义、路由行为或产品文案。

## 索引

- **Evidence 目录总入口**：[evidence/README.md](README.md)（本节锚点：**前端 TypeScript 门禁收口 · 2026-04-09**）。
