# EVIDENCE · **14 合约与 ABI 对齐（chain-abi）** 簇 · **09 §2b**（V-1 / V-2 / V-3）

**Version:** 1.0.9 · **最后更新：** 2026-04-29  
**受众**：审计 **14 簇**（**50-链上与ABI导读**）与 **CI** 对齐的 Owner / Tech lead  
**状态**：现行  
**与 spec 关系**：**证据包**；**不替代** **[14](../../spec/14-合约-API-ABI-前后端对齐.md)**、**[04](../../spec/04-后端与API.md) §3.4**、**[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**、**`contracts/src`/`contracts/abi` 真值**。  
**母版**：[22-横切-簇级verified证据模板](./22-横切-簇级verified证据模板.md)

> **SSOT（必读）**：**engineering 仅为**（**Explanation / How-to**）**导读**；**不替代** **spec**。**HTTP 机读**真源 **[04 §3.4](../../spec/04-后端与API.md)**；**域矩阵**真源 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**；**链上 ABI 与对齐叙述**真源 **[14](../../spec/14-合约-API-ABI-前后端对齐.md)** + **`contracts/`** + **`check-55-s13`** 等脚本；**实现**真源 **`crates/`·`contracts/`·`frontend/`** 与当次 **PR** 可复核产物（含**同 PR 脚本闭包**）。本文件仅为导读，**不**形成第二套机读 SSOT（与 **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)**、**[engineering/README](./README.md)**、磁盘 **`NN`** 主序 **[三处对拍](./02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**）。

---

<a id="ev14abi-v1"></a>

## V-1 · 本地运行记录（与 **[50 §6](./50-链上与ABI导读.md#b50-6-verify)** 同名命令）

**环境**：仓库根 **`D:/TravelTrust`**（Windows **Git Bash**）。**捕获（UTC）**：**2026-04-29**（时效性抽检复跑）。

```text
=== V-1 capture 2026-04-29 UTC · cluster 14-chain-abi ===
--- 55-S13 ---
bash scripts/check-55-s13.sh
55-S13 OK: GuideIdentityStakingPool/ProviderIdentityStakingPool/Registry/EscrowFactory/FeeRouter/RegionVault/OnboardingFeeReceiver JSON byte-identical (contracts/abi ↔ frontend/dapp/abis)
55-S13 自动检查通过。
(exit 0)
--- routes vs 04 ---
bash scripts/run-check-04-routes.sh
check-04-routes-vs-code OK: 04 sec 3.4 table paths are mounted (except DOC_ONLY_SCHEDULED).
… (下游 check-04-* / check-b45* 均 OK)
(exit 0)
--- handbook ---
bash scripts/check-handbook-frontmatter.sh
(exit 0)
bash scripts/check-handbook-engineering-content.sh
(exit 0；stderr 可出现 **HBOOK-ENG-TABLE-WARN** 提示行，**exit 仍 0**)
```

**说明**：**`forge test` / `run-verify-abi-forge.sh`** 以 **§V-2** **`contract-abi-gate.yml`** 为主证；本地未装 **Foundry** 时**不**强要求贴 **forge** 全绿日志（与 **[contracts/LOCAL-FOUNDRY.md](../../../contracts/LOCAL-FOUNDRY.md)** 一致）。

**台账对拍（文档 → 08 → 本证据）**：[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix) **spec/14** 行 **覆盖度 full**；[09 §3](./09-文档迁移覆盖审计报告.md#audit-coverage) **14 chain-abi** 簇 **verified**（**[09 §2b.5](./09-文档迁移覆盖审计报告.md#audit-verified-evidence-14chainabi)**）；**[50 §2b](./50-链上与ABI导读.md#b50-6-verify)** 文内证据句与上列 **同 PR** 可读。

---

<a id="ev14abi-v2"></a>

## V-2 · CI 具名 step（**GitHub Actions** · 可复核 log）

| Workflow | Job | Step `name:`（摘录） | 与 **50 §6** 的对应 |
|----------|-----|----------------------|---------------------|
| **`.github/workflows/build.yml`** | **`build`** | **`04 section 3.4 API table vs mounted routes (STRICT_WARNINGS)`** | **`bash scripts/run-check-04-routes.sh`** **同目的** |
| 同上 | **`build`** | **`Handbook frontmatter (docs/handbook)`** / **`Handbook engineering content hygiene …`** | 与 **§6** 两 **`check-handbook-*.sh`** **同门禁族** |
| **`.github/workflows/contract-abi-gate.yml`** | **`contract-abi`** | **`Run forge test`** | **合约编译+单测**（**`forge test --root contracts`**；**14 / contracts README** 工程真值） |
| 同上 | **`contract-abi`** | **`Verify contracts/abi matches forge inspect (canonical)`** | **`bash scripts/run-verify-abi-forge.sh`**（**canonical ABI** 对齐 **forge inspect**） |
| 同上 | **`contract-abi`** | **`Generate ABI alignment report`** | 报告生成段内执行 **`bash ./scripts/check-55-s13.sh`**（与 **50 §6** **`check-55-s13`** **同脚本**） |

---

<a id="ev14abi-v3"></a>

## V-3 · Owner 文档签收（**Reviewed-by**）

**[50-链上与ABI导读](./50-链上与ABI导读.md)** 文尾 **`Reviewed-by: @ghost 2026-04-28`** 为本簇 **V-3** 最低签收（与 **70 / 94 / 04** 簇同 **CODEOWNERS** 占位惯例）。

**盲测四问（14-chain-abi）**（辅助 Owner；**非**单独 **V-3**）：

1. **§6** 能否找到 **`check-55-s13`** 与 **`run-check-04-routes`**？  
2. **§4** 是否外链 **14** 与 **`contracts/README`**？  
3. **canonical ABI** 目录是否为 **`contracts/abi/`**（相对 **`frontend/dapp/abis/`** 角色）？  
4. 本文是否**未**粘贴 **14 §1.1** 表体或 ABI JSON？

---

## 变更记录

| Version | 日期 | 摘要 |
|---------|------|------|
| 1.0.9 | 2026-04-29 | **V-1**：时效性抽检复跑；**55-S13**/**run-check-04** 摘录与当前脚本输出对齐；**engineering-content** stderr 口径修正。 |
| 1.0.8 | 2026-04-29 | **V-1**：补 **台账对拍**（**50 §2b** ↔ **08 §3** **spec/14** ↔ **09 §2b.5**）。 |
| 1.0.7 | 2026-04-29 | 文首 **SSOT（必读）** 与 **08/README** 对拍：补 **14** + **`contracts/`** + **`check-55-s13`** 等脚本句（无正文语义变更）。 |
| 1.0.6 | 2026-04-29 | 文首 **SSOT（必读）** 与 **engineering/README** 同形（**仅为导读**；**不替代 spec**；**PR** 闭包链）。 |
| 1.0.5 | 2026-04-29 | 文首 **SSOT（必读）** 与 **手册 00 §3**/**README**/**三处对拍** 同形（**04 §3.4**/**93**/代码+门禁）。 |
| 1.0.3 | 2026-04-29 | 文首 **SSOT（必读）** 标准句。 |
| 1.0.2 | 2026-04-28 | **V-1 说明**：**LOCAL-FOUNDRY** 链改为 **`../../../contracts/`**（与 **50 v1.0.1** 同源）。 |
| 1.0.1 | 2026-04-28 | **V-1**：**engineering-content** 捕获与 **40-D** 无 **TABLE-WARN**、checker **`return`** 修复对齐。 |
| 1.0.0 | 2026-04-28 | 首版：**14-chain-abi** 簇 **V-1～V-3**（**50**）。 |
