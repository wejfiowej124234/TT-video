# P1-C · 可验证发布 manifest — 缺口官方总表互证

**TT**：`TT-07-63B-P1C-MANIFEST-SINGLE-001`  
**日期**：2026-04-09  

## 结论

[缺口与待补-官方总表.md](../../../docs/spec/缺口与待补-官方总表.md) **P1-C** 行「**可验证发布 manifest**」与仓库内流程、脚本、文档**并联索引闭合**；本 artifact **不**替代发版机在 **`npm run build`** 之后产出的**真实** **`frontend-build-manifest.json`**（须按当次构建写入 **`artifacts[]`** 并更新 **GO 根级 `manifest.json`**）。

## 两层 manifest（勿混）

| 层级 | 文件 | 用途 |
|------|------|------|
| **GO bundle 根** | **`evidence/GO_YYYYMMDD/manifest.json`** | 当次过门 **聚合**：**`gate`**、**`date`**、**`bundle_note`**（可选）、**`artifacts[]`**（每项 **`path`** 相对 GO 根、**`sha256`** 小写 hex）、**`sign_off`**；**`manifest.sha256`** **仅**校验该文件本体（**`sha256sum -c manifest.sha256`**）。 |
| **前端构建清单** | **`frontend/.next/build-manifest.json`** → 可选复制为 **`frontend-build-manifest.json`**（**`EVIDENCE_GO_DIR`**） | **`scripts/gen-frontend-manifest.sh`** / **`.ps1`** 在 **build 后**生成；字段：**`gate`**（脚本默认 **Gate-5**）、**`date`**（**YYYY-MM-DD**）、**`artifacts`**（至少 **`.next/BUILD_ID`** 与/或 **`.next/static`** 聚合项）、**`sign_off`**（脚本占位 **`发版人`**，发版前须替换为真实角色/代号）。同目录 **`.sha256`** 为 **该 JSON 文件** 的内容哈希。 |

## 权威步骤与互指

- **有序执行**：[ops/RUNBOOK.md](../../../ops/RUNBOOK.md) **§12.6 §A**（**`pre-release-automation` 不替代** manifest 单独执行）。  
- **格式 SSOT**：[evidence/README.md](../../README.md) **manifest 格式与必填字段**、**可验证发布** 节。  
- **脚本**：仓库根 **`scripts/gen-frontend-manifest.sh`**（**`EVIDENCE_GO_DIR`** 可选）或 **`gen-frontend-manifest.ps1`**。

## 机读 bundle

同目录上一级 **`manifest.json`** / **`manifest.sha256`**（本 artifact 已列入 **`artifacts[]`**）。
