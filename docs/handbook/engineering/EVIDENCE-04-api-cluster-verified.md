# EVIDENCE · **04 后端与 API** 簇 · **09 §2b**（V-1 / V-2 / V-3）

**Version:** 1.0.9 · **最后更新：** 2026-04-29  
**受众**：审计 **04 簇**（**REG-04** + **engineering/04**）与 **CI** 对齐的 Owner / Tech lead  
**状态**：现行  
**与 spec 关系**：**证据包**；**不替代** **[04](../../spec/04-后端与API.md) §3.4** 表体、**[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**。  
**母版**：[22-横切-簇级verified证据模板](./22-横切-簇级verified证据模板.md)

> **SSOT（必读）**：**engineering 仅为**（**Explanation / How-to**）**导读**；**不替代** **spec**。**HTTP 机读**真源 **[04 §3.4](../../spec/04-后端与API.md)**；**域矩阵**真源 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**；**链上 ABI 与对齐叙述**真源 **[14](../../spec/14-合约-API-ABI-前后端对齐.md)** + **`contracts/`** + **`check-55-s13`** 等脚本；**实现**真源 **`crates/`·`contracts/`·`frontend/`** 与当次 **PR** 可复核产物（含**同 PR 脚本闭包**）。本文件仅为导读，**不**形成第二套机读 SSOT（与 **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)**、**[engineering/README](./README.md)**、磁盘 **`NN`** 主序 **[三处对拍](./02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**）。

---

<a id="ev04api-v1"></a>

## V-1 · 本地运行记录（与 **[engineering/04 §6](./04-HTTP与路由契约导读.md#hb-eng-04-verify)** 同名命令）

**环境**：仓库根 **`D:/TravelTrust`**（Windows **Git Bash**）。**捕获（UTC）**：**2026-04-29**（时效性抽检复跑）。

```text
=== V-1 capture 2026-04-29 UTC · cluster 04-api ===
--- engineering/04 §6 ---
bash scripts/run-check-04-routes.sh
(exit 0; 与 70/07 簇同脚本)
bash scripts/check-handbook-frontmatter.sh
(exit 0)
bash scripts/check-handbook-engineering-content.sh
(exit 0；stderr 可出现 **HBOOK-ENG-TABLE-WARN** 提示行，**exit 仍 0** — 与当前 **`scripts/gates/check-handbook-engineering-content.py`** 口径一致)
final_exit:0
```

**路径**：`docs/handbook/engineering/EVIDENCE-04-api-cluster-verified.md`。

**台账对拍（文档 → 08 → 本证据）**：[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix) **spec/04 §3.4** 行 **覆盖度 full**（**04 簇**：**engineering/04** + **REG-04** + 本证据）；[09 §3](./09-文档迁移覆盖审计报告.md#audit-coverage) **04 后端与 API** 簇 **verified**（**[09 §2b.3](./09-文档迁移覆盖审计报告.md#audit-verified-evidence-04api)**）；**[engineering/04 §2b](./04-HTTP与路由契约导读.md)** 文内证据句与上列 **同 PR** 可读。

---

<a id="ev04api-v2"></a>

## V-2 · CI 具名 step（**GitHub Actions** · 可复核 log）

| Workflow | Job | Step `name:`（摘录） | 与 **engineering/04 §6** 的对应 |
|----------|-----|----------------------|----------------------------------|
| **`.github/workflows/build.yml`** | **`build`** | **`04 section 3.4 API table vs mounted routes (STRICT_WARNINGS)`** | **等价于** **`bash scripts/run-check-04-routes.sh`** |
| 同上 | **`build`** | **`Handbook frontmatter (docs/handbook)`** | **等价于** **`bash scripts/check-handbook-frontmatter.sh`** |
| 同上 | **`build`** | **`Handbook engineering content hygiene …`** | **等价于** **`bash scripts/check-handbook-engineering-content.sh`** |

**复核**：GitHub **Actions** → **`build`** job → 展开上列 **step** 日志。

---

<a id="ev04api-v3"></a>

## V-3 · Owner 文档签收（**Reviewed-by**）

本簇 **签收面**：

- **[engineering/04-HTTP与路由契约导读](./04-HTTP与路由契约导读.md)** 文尾 **`Reviewed-by: @ghost 2026-04-28`**  
- **[REG-04-API叙事](../corpus/REG-04-API叙事.md)** 文尾 **`Reviewed-by: @ghost 2026-04-28`**

**CODEOWNERS** 默认 **`* @ghost`**；真人 Owner 替换见 **70 / 07** 证据包惯例。

**盲测三问（04-api 簇）**（辅助 Owner；**非**单独 **V-3**）：

1. 只读 **REG-04 §1**，能否说出 **§3.4 表体** 的唯一 SSOT 位置？  
2. 只读 **engineering/04 §1**，能否复述 **改 API 的四步**？  
3. **REG-04** 与 **engineering/04** 是否均未粘贴 **§3.4** 宽表？

---

## 变更记录

| Version | 日期 | 摘要 |
|---------|------|------|
| 1.0.9 | 2026-04-29 | **V-1**：时效性抽检复跑；**engineering-content** 行改为「**exit 0** 且允许 stderr **TABLE-WARN**」与当前脚本一致。 |
| 1.0.8 | 2026-04-29 | **V-1**：补 **台账对拍**（**域篇 §2b** ↔ **08 §3** **spec/04 §3.4** ↔ **09 §2b.3**）。 |
| 1.0.7 | 2026-04-29 | 文首 **SSOT（必读）** 与 **08/README** 对拍：补 **14** + **`contracts/`** + **`check-55-s13`** 等脚本句（无正文语义变更）。 |
| 1.0.6 | 2026-04-29 | 文首 **SSOT（必读）** 与 **engineering/README** 同形（**仅为导读**；**不替代 spec**；**PR** 闭包链）。 |
| 1.0.5 | 2026-04-29 | 文首 **SSOT（必读）** 与 **手册 00 §3**/**README**/**三处对拍** 同形（**04 §3.4**/**93**/代码+门禁）。 |
| 1.0.3 | 2026-04-29 | 文首 **SSOT（必读）** 标准句（**母版** 与 **V-1** 分隔线间）。 |
| 1.0.2 | 2026-04-28 | **V-1**：**engineering-content** 捕获与 **40-D** 无 **TABLE-WARN**、checker **`return`** 修复对齐。 |
| 1.0.1 | 2026-04-28 | 互指 **engineering/04 §6**（工程验证节编号与导读正文一致）。 |
| 1.0.0 | 2026-04-28 | 首版：**04-api** 簇 **V-1～V-3**（**REG-04** + **engineering/04**）。 |
