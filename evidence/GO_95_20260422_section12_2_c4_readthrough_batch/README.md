# GO_95 · §12.2 · C-4 读通批次（非主行闭证 · v1.4.159）

**日期**：2026-04-22  
**范围（有界）**：**[95 §12.2 · C-4](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** 主表所列 **`frontend/app/**`**、**`frontend/lib/api.ts`**、**`frontend/lib/apiClient/**`**、**`frontend/e2e/**`**、**Vitest `*.test.ts`/`*.test.tsx`** 与 **§12.1.1 · C-4** 子证规则；走读 **`frontend/lib/api.ts`** 篇首（**04/14** 互指、**`NEXT_PUBLIC_API_BASE_URL`**、**`routes`** 对象首段 **`health`/`meta`** 与 **`auth`/`me`** 等域锚点）；**`frontend/playwright.config.ts`** 篇首注释（**E2E** 入口与 **CI** 口径）。

## 1 机读（仓库根 `find`/`wc`）

| 指标 | 命令 | 结果 |
|------|------|------|
| **`page.tsx`** | `find frontend/app -name 'page.tsx' \| wc -l` | **119** |
| **`apiClient` `*.ts`** | `find frontend/lib/apiClient -name '*.ts' \| wc -l` | **49**（曾记 **约 46** 以 **95 文首**/**本证** 为准） |
| **`e2e` `*.spec.ts`** | `find frontend/e2e -name '*.spec.ts' \| wc -l` | **40**（曾记 **约 39** 以本证为准） |
| **`e2e` 全 `*.ts`** | `find frontend/e2e -name '*.ts' \| wc -l` | **48**（曾记目录内总 **`*.ts` 约 46** 以本证为准） |
| **Vitest 风格合计** | `find frontend \( -name '*.test.ts' -o -name '*.test.tsx' \) ! -path '*/node_modules/*' \| wc -l` | **235**（**`*.test.ts`→183** + **`*.test.tsx`→52**；曾记合计 **约 217**/**`*.test.ts` 约 165** 以本证为准） |
| **`__tests__/integration`** | `find frontend/__tests__/integration -name '*.ts' \| wc -l` | **4** |
| **`api.ts` 行数** | `wc -l frontend/lib/api.ts` | **931** |

## 2 对读结论（摘要）

- **`api.ts`** 文件头与 **`routes`** 树状结构与 **95**/**04 §3.4**/**`run-check-04`** 门禁叙述一致（本轮**未**全文逐路径对拍 **178** 路径表）。
- **`playwright.config.ts`** 篇首注释列出 **`e2e/`** 关键 spec 与 **CI `build.yml` → `npm run e2e`** 口径，与 **§8.1**/**130** 互指兼容。

## 3 诚实边界

- **未**执行 **`page.tsx`×`api.ts`** 全矩阵、**未**扫 **`frontend/app` 每页** ↔ **04** 表行。
- **未**重跑 **`npm run e2e`** / **`vitest`** 全量；旁证仍见 **§7.3**/**§10.5**/**§8.2** 既有 **`cargo test`/`playwright`** 证据包。
- **不**将 **§12.2 · C-4** 主表 **`[ ]]`** 改为 **`[x]`**。

## 4 门禁

- `bash scripts/check-07-version-triple.sh` → **exit 0**
- `bash scripts/run-check-04-routes.sh` → **exit 0**

