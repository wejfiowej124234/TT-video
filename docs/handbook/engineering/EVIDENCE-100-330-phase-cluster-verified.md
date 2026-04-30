# EVIDENCE · **100～330 阶段体系（phase）** 簇 · **09 §2b**（V-1 / V-2 / V-3）

**Version:** 1.0.9 · **最后更新：** 2026-04-29  
**受众**：审计 **32-横切-Wave与阶段体系导读** 与 **CI** 对齐的 Owner / Tech lead  
**状态**：现行  
**与 spec 关系**：**证据包**；**不替代** **[07](../../spec/07-开发流程与顺序.md)**、各 **`../../spec/NNN-阶段*.md`**、**[04](../../spec/04-后端与API.md)**、**[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**。  
**母版**：[22-横切-簇级verified证据模板](./22-横切-簇级verified证据模板.md)

> **SSOT（必读）**：**engineering 仅为**（**Explanation / How-to**）**导读**；**不替代** **spec**。**HTTP 机读**真源 **[04 §3.4](../../spec/04-后端与API.md)**；**域矩阵**真源 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**；**链上 ABI 与对齐叙述**真源 **[14](../../spec/14-合约-API-ABI-前后端对齐.md)** + **`contracts/`** + **`check-55-s13`** 等脚本；**实现**真源 **`crates/`·`contracts/`·`frontend/`** 与当次 **PR** 可复核产物（含**同 PR 脚本闭包**）。本文件仅为导读，**不**形成第二套机读 SSOT（与 **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)**、**[engineering/README](./README.md)**、磁盘 **`NN`** 主序 **[三处对拍](./02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**）。

---

<a id="evw330-v1"></a>

## V-1 · 本地运行记录（与 **[32 §6](./32-横切-Wave与阶段体系导读.md#x32-6-verify)** 同名命令）

**环境**：仓库根 **`D:/TravelTrust`**。**捕获（UTC）**：**2026-04-29**（时效性抽检复跑）。

```text
=== V-1 capture 2026-04-29 · cluster 100-330-phase · ① 本地 ===
bash scripts/check-wave-phase-files.sh
OK: wave phase spec files present (empty slots skipped: 280 290 300 310).
(exit 0)

bash scripts/check-handbook-frontmatter.sh
(exit 0)

bash scripts/check-handbook-engineering-content.sh
(exit 0；stderr 可出现 **HBOOK-ENG-TABLE-WARN** 提示行，**exit 仍 0**)

bash scripts/run-check-04-routes.sh
check-04-routes-vs-code OK: 04 sec 3.4 table paths are mounted (except DOC_ONLY_SCHEDULED).
check-04-frontend-routes-vs-app OK … check-04-api-ts-routes-vs-doc-34 OK … check-b457: OK
(exit 0)
```

**台账对拍（文档 → 08 → 本证据）**：[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix) **`spec/07` §零 Wave + `NNN-阶段*.md`** 行 **覆盖度 full**；[09 §3](./09-文档迁移覆盖审计报告.md#audit-coverage) **100～330 阶段体系** 簇 **verified**（**[09 §2b.7](./09-文档迁移覆盖审计报告.md#audit-verified-evidence-100330phase)**）；**[32 §2b](./32-横切-Wave与阶段体系导读.md#x32-6-verify)** 文内证据句与上列 **同 PR** 可读。

---

<a id="evw330-v2"></a>

## V-2 · CI 具名 step（**GitHub Actions** · 可复核 log）

| Workflow | Job | Step `name:`（摘录） | 与 **32 §6** 的对应 |
|----------|-----|----------------------|---------------------|
| **`.github/workflows/check-wave-phase-files.yml`** | **`check`** | **`Verify phase spec files (90～550, empty slots 280–310 allowed)`** | **`bash scripts/check-wave-phase-files.sh`** **字面一致** |
| **`.github/workflows/build.yml`** | **`build`** | **`04 section 3.4 API table vs mounted routes (STRICT_WARNINGS)`** | **`bash scripts/run-check-04-routes.sh`** **同目的** |
| 同上 | **`build`** | **`Handbook frontmatter (docs/handbook)`** / **`Handbook engineering content hygiene …`** | 与 **§6** **`check-handbook-*.sh`** **同门禁族** |

---

<a id="evw330-v3"></a>

## V-3 · Owner 文档签收（**Reviewed-by**）

**[32-横切-Wave与阶段体系导读](./32-横切-Wave与阶段体系导读.md)** 文内 **`Reviewed-by: @ghost 2026-04-28`** 为本簇 **V-3** 最低签收（与 **70 / 94 / 04** 簇同 **CODEOWNERS** 占位惯例）。

**盲测四问（100～330-phase）**（辅助 Owner；**非**单独 **V-3**）：

1. **§6** 第一命令是否为 **`check-wave-phase-files.sh`**？  
2. **§4** 是否写明 **阶段 spec 不整篇迁入 engineering**？  
3. **27-archived / snapshots** 是否归入 **「历史材料」**？  
4. 本文是否**未**粘贴 **04/93** 表体？

---

## 变更记录

| Version | 日期 | 摘要 |
|---------|------|------|
| 1.0.9 | 2026-04-29 | **V-1**：时效性抽检复跑；**engineering-content** stderr 口径修正（去 **40-D** 旧版号旁注）。 |
| 1.0.8 | 2026-04-29 | **V-1**：补 **台账对拍**（**32 §2b** ↔ **08 §3** **`spec/07` §零 Wave + `NNN-阶段*.md`** ↔ **09 §2b.7**）。 |
| 1.0.7 | 2026-04-29 | 文首 **SSOT（必读）** 与 **08/README** 对拍：补 **14** + **`contracts/`** + **`check-55-s13`** 等脚本句（无正文语义变更）。 |
| 1.0.6 | 2026-04-29 | 文首 **SSOT（必读）** 与 **engineering/README** 同形（**仅为导读**；**不替代 spec**；**PR** 闭包链）。 |
| 1.0.5 | 2026-04-29 | 文首 **SSOT（必读）** 与 **手册 00 §3**/**README**/**三处对拍** 同形（**04 §3.4**/**93**/代码+门禁）。 |
| 1.0.3 | 2026-04-29 | 文首 **SSOT（必读）** 标准句。 |
| 1.0.2 | 2026-04-28 | **V-1**：**40-D** 大表已列表化；**engineering-content** 捕获与无 **TABLE-WARN**、checker **`return`** 修复对齐。 |
| 1.0.1 | 2026-04-28 | **V-1** 贴 **① 本地** 实跑摘要（**TABLE-WARN** 诚实段；**run-check-04** 子检查缩写）。 |
| 1.0.0 | 2026-04-28 | 首版：**100-330-phase** 簇 **V-1～V-3**（**32**）。 |
