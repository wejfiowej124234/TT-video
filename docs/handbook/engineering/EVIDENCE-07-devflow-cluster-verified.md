# EVIDENCE · **07 开发流程（devflow）** 簇 · **09 §2b**（V-1 / V-2 / V-3）

**Version:** 1.0.8 · **最后更新：** 2026-04-29  
**受众**：审计 **07 簇** handbook 与 **CI** 对齐的 Owner / Tech lead  
**状态**：现行  
**与 spec 关系**：**证据包**；**不替代** **[07](../../spec/07-开发流程与顺序.md)** 全文、**[04](../../spec/04-后端与API.md)**、**[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**。  
**母版**：[22-横切-簇级verified证据模板](./22-横切-簇级verified证据模板.md)

> **SSOT（必读）**：**engineering 仅为**（**Explanation / How-to**）**导读**；**不替代** **spec**。**HTTP 机读**真源 **[04 §3.4](../../spec/04-后端与API.md)**；**域矩阵**真源 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**；**链上 ABI 与对齐叙述**真源 **[14](../../spec/14-合约-API-ABI-前后端对齐.md)** + **`contracts/`** + **`check-55-s13`** 等脚本；**实现**真源 **`crates/`·`contracts/`·`frontend/`** 与当次 **PR** 可复核产物（含**同 PR 脚本闭包**）。本文件仅为导读，**不**形成第二套机读 SSOT（与 **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)**、**[engineering/README](./README.md)**、磁盘 **`NN`** 主序 **[三处对拍](./02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**）。

---

<a id="ev07dev-v1"></a>

## V-1 · 本地运行记录（与 **23-横切-07开发流程导读 §6** 同名命令）

**环境**：仓库根 **`D:/TravelTrust`**（Windows **Git Bash**）。**捕获时间（UTC）**：**2026-04-29**（时效性抽检复跑）。

```text
=== V-1 capture 2026-04-29 UTC · cluster 07-devflow ===
--- 23 / check-07-version-triple ---
bash scripts/check-07-version-triple.sh
OK: 07 version triple aligned (1.0.860).
exit_triple=0
--- handbook ---
bash scripts/check-handbook-frontmatter.sh
(exit 0)
bash scripts/check-handbook-engineering-content.sh
(exit 0；stderr 可出现 **HBOOK-ENG-TABLE-WARN** 提示行，**exit 仍 0**)
--- 04 routes ---
bash scripts/run-check-04-routes.sh
check-04-routes-vs-code OK: 04 sec 3.4 table paths are mounted (except DOC_ONLY_SCHEDULED).
… (下游 check-04-* / check-b45* 均 OK)
exit_04=0
final_exit:0
```

**本文件路径**：`docs/handbook/engineering/EVIDENCE-07-devflow-cluster-verified.md`（满足 **09 §2b · V-1**）。

**台账对拍（文档 → 08 → 本证据）**：[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix) **spec/07→23** 行 **覆盖度 full**；[09 §3](./09-文档迁移覆盖审计报告.md#audit-coverage) **07 开发流程** 簇 **verified**（**[09 §2b.2](./09-文档迁移覆盖审计报告.md#audit-verified-evidence-07devflow)**）；**[23 §2b](./23-横切-07开发流程导读.md)** 文内证据句与上列 **同 PR** 可读。

---

<a id="ev07dev-v2"></a>

## V-2 · CI 具名 step（**GitHub Actions** · 可复核 log）

| Workflow | Job | Step `name:`（摘录） | 与 **23 §6** 的对应 |
|----------|-----|----------------------|---------------------|
| **`.github/workflows/governance-doc-linkage-gate.yml`** | **`check`** | **`Run 07 version triple check (header / 00 index / §6.5 top)`** → `bash scripts/check-07-version-triple.sh` | **字面同** **§6** 首条 |
| **`.github/workflows/build.yml`** | **`build`** | **`Handbook frontmatter (docs/handbook)`** | **等价于** **`bash scripts/check-handbook-frontmatter.sh`** |
| 同上 | **`build`** | **`Handbook engineering content hygiene …`** | **等价于** **`bash scripts/check-handbook-engineering-content.sh`** |
| 同上 | **`build`** | **`04 section 3.4 API table vs mounted routes (STRICT_WARNINGS)`** | **等价于** **`bash scripts/run-check-04-routes.sh`** |

**复核方式**：GitHub **Actions** → 对应 **workflow run** → 展开上表 **step** 日志；**PR** 附成功 **run_id** / URL。

---

<a id="ev07dev-v3"></a>

## V-3 · Owner 文档签收（**Reviewed-by**）

**CODEOWNERS** 默认 **`* @ghost`** 时，**[23-横切-07开发流程导读](./23-横切-07开发流程导读.md)** 文尾 **Reviewed-by: @ghost 2026-04-28** 为本簇 **V-3** 最低签收；**组织具名 Owner** 应在后续 PR 替换 **`@ghost`**。

**盲测四问（07-devflow 簇）**（辅助 Owner ack；**非**单独 **V-3**）：

1. 只读 **23 §6** 能否列出 **四条** `bash scripts/…`？  
2. 能否一句话区分 **`spec/07`** 与 **`engineering/07-ADR`**？  
3. **`governance-doc-linkage-gate`** 中哪一步对应 **版本三线**？  
4. 本文与 **23** 是否**均未**粘贴 **04 §3.4 / 93** 宽表？

---

## 变更记录

| Version | 日期 | 摘要 |
|---------|------|------|
| 1.0.8 | 2026-04-29 | **V-1**：时效性抽检复跑；**engineering-content** stderr 口径与 **04/14/94/110/100-330** 证据包对齐（**TABLE-WARN** 不阻 **exit 0**）。 |
| 1.0.7 | 2026-04-29 | **V-1**：补 **台账对拍**（**23 §2b** ↔ **08 §3** **spec/07→23** ↔ **09 §2b.2**）。 |
| 1.0.6 | 2026-04-29 | 文首 **SSOT（必读）** 与 **08/README** 对拍：补 **14** + **`contracts/`** + **`check-55-s13`** 等脚本句（无正文语义变更）。 |
| 1.0.5 | 2026-04-29 | 文首 **SSOT（必读）** 与 **engineering/README** 同形（**仅为导读**；**不替代 spec**；**PR** 闭包链）。 |
| 1.0.4 | 2026-04-29 | 文首 **SSOT（必读）** 与 **手册 00 §3**/**README**/**三处对拍** 同形（**04 §3.4**/**93**/代码+门禁）。 |
| 1.0.2 | 2026-04-29 | 文首 **SSOT（必读）** 标准句。 |
| 1.0.1 | 2026-04-28 | **V-1**：**engineering-content** 捕获与 **40-D** 无 **TABLE-WARN**、checker **`return`** 修复对齐。 |
| 1.0.0 | 2026-04-28 | 首版：**07-devflow** 簇 **V-1～V-3**（单篇 **23**）。 |
