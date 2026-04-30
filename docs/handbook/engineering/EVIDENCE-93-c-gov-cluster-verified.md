# EVIDENCE · **93·C 域 §3（治理只读 / `governance` HTTP）** 簇 · **09 §2b.9**（V-1 / V-2 / V-3）

**Version:** 1.0.7 · **最后更新：** 2026-04-29  
**受众**：审计 **31-C** 与 **CI** 对齐的 Owner / Tech lead  
**状态**：现行  
**与 spec 关系**：**证据包**；**不替代** **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md) §3** 表体、**[04](../../spec/04-后端与API.md) §3.4**。  
**母版**：[22-横切-簇级verified证据模板](./22-横切-簇级verified证据模板.md)

> **SSOT（必读）**：**engineering 仅为**（**Explanation / How-to**）**导读**；**不替代** **spec**。**HTTP 机读**真源 **[04 §3.4](../../spec/04-后端与API.md)**；**域矩阵**真源 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**；**链上 ABI 与对齐叙述**真源 **[14](../../spec/14-合约-API-ABI-前后端对齐.md)** + **`contracts/`** + **`check-55-s13`** 等脚本；**实现**真源 **`crates/`·`contracts/`·`frontend/`** 与当次 **PR** 可复核产物（含**同 PR 脚本闭包**）。本文件仅为导读，**不**形成第二套机读 SSOT（与 **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)**、**[engineering/README](./README.md)**、磁盘 **`NN`** 主序 **[三处对拍](./02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**）。

---

<a id="ev93cgov-v1"></a>

## V-1 · 本地运行记录（与 **[31-C §6](./31-C-治理与质押只读导读.md#c31-6-verify)** 同名命令）

**环境**：仓库根 **`D:/TravelTrust`**（Windows **Git Bash**）。**捕获（UTC）**：**2026-04-29**（时效性抽检复跑）。

```text
=== V-1 capture 2026-04-29 UTC · cluster 93-c-gov ===
--- 31-C §6 ---
bash scripts/run-check-04-routes.sh
(exit 0)
cargo test -p traveltrust-api read_contract_pool_placeholder_matches_chain_lane
(test result: ok. 1 passed)
bash scripts/check-handbook-frontmatter.sh
(exit 0)
bash scripts/check-handbook-engineering-content.sh
(exit 0；stderr 可出现 **HBOOK-ENG-TABLE-WARN** 提示行，**exit 仍 0**)
final_exit:0
```

**路径**：`docs/handbook/engineering/EVIDENCE-93-c-gov-cluster-verified.md`。

**台账对拍（文档 → 08 → 本证据）**：[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix) **spec/93 §3（93·C）** 行 **覆盖度 full**；[09 §3](./09-文档迁移覆盖审计报告.md#audit-coverage) **93·C / governance** 簇 **verified**（**[09 §2b.9](./09-文档迁移覆盖审计报告.md#audit-verified-evidence-93-c-gov)**）；**[31-C §2b](./31-C-治理与质押只读导读.md#c31-6-verify)** 文内证据句与上列 **同 PR** 可读。

---

<a id="ev93cgov-v2"></a>

## V-2 · CI 具名 step（**GitHub Actions** · 可复核 log）

| Workflow | Job | Step `name:`（摘录） | 与 **31-C §6** 的对应 |
|----------|-----|----------------------|------------------------|
| **`.github/workflows/build.yml`** | **`build`** | **`04 section 3.4 API table vs mounted routes (STRICT_WARNINGS)`** | **等价于** **`bash scripts/run-check-04-routes.sh`** |
| 同上 | **`build`** | **`Run tests`** | **`cargo test --workspace`** 为**超集**；含 **`cargo test -p traveltrust-api …`** 子集 |
| 同上 | **`build`** | **`Handbook frontmatter (docs/handbook)`** | **等价于** **`bash scripts/check-handbook-frontmatter.sh`** |
| 同上 | **`build`** | **`Handbook engineering content hygiene …`** | **等价于** **`bash scripts/check-handbook-engineering-content.sh`** |

**复核**：GitHub **Actions** → **`build`** job → 展开上列 **step** 日志。

---

<a id="ev93cgov-v3"></a>

## V-3 · Owner 文档签收（**Reviewed-by**）

本簇 **签收面**：

- **[31-C-治理与质押只读导读](./31-C-治理与质押只读导读.md)** 文内 **`Reviewed-by: @ghost 2026-04-29`**

**CODEOWNERS** 默认 **`* @ghost`**；真人 Owner 替换见 **70 / 04-api** 证据包惯例。

**盲测三问（93·C / governance 簇）**（辅助 Owner；**非**单独 **V-3**）：

1. 只读 **31-C §2**，能否区分 **30-C**（250/260）与 **`governance/*`** 分工？  
2. **§6** 所列 **`cargo test`** 过滤串是否与 **`governance_read_contract_contract_tests`** 同名？  
3. **93 §3** 与 **04 §3.4** 是否仍为 **PASS/路径** 的唯一 SSOT？

---

## 变更记录

| Version | 日期 | 摘要 |
|---------|------|------|
| 1.0.7 | 2026-04-29 | **V-1**：时效性抽检复跑；**engineering-content** stderr 口径与他簇一致。 |
| 1.0.6 | 2026-04-29 | **V-1**：补 **台账对拍**（**31-C §2b** ↔ **08 §3** **spec/93 §3（93·C）** ↔ **09 §2b.9**）。 |
| 1.0.5 | 2026-04-29 | 文首 **SSOT（必读）** 与 **08/README** 对拍：补 **14** + **`contracts/`** + **`check-55-s13`** 等脚本句（无正文语义变更）。 |
| 1.0.4 | 2026-04-29 | 文首 **SSOT（必读）** 与 **engineering/README** 同形（**仅为导读**；**不替代 spec**；**PR** 闭包链）。 |
| 1.0.3 | 2026-04-29 | 文首 **SSOT（必读）** 与 **手册 00 §3**/**README**/**三处对拍** 同形（**04 §3.4**/**93**/代码+门禁）。 |
| 1.0.1 | 2026-04-29 | 文首 **SSOT（必读）** 标准句。 |
| 1.0.0 | 2026-04-29 | 首版：**93·C governance** 簇 **V-1～V-3**（**31-C**）。 |
