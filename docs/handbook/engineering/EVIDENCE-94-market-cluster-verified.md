# EVIDENCE · **94 自由市场托管（market）** 簇 · **09 §2b**（V-1 / V-2 / V-3）

**Version:** 1.0.9 · **最后更新：** 2026-05-27  
**受众**：审计 **94 簇**（**21-B**）与 **CI** 对齐的 Owner / Tech lead  
**状态**：现行  
**与 spec 关系**：**证据包**；**不替代** **[94](../../spec/94-自由市场-商家橱窗与旅行收购-链上托管技术规格.md)**、**[53](../../spec/53-阶段开发技术文档.md)**、**[04](../../spec/04-后端与API.md) §3.4**、**[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**。  
**母版**：[22-横切-簇级verified证据模板](./22-横切-簇级verified证据模板.md)

> **SSOT（必读）**：**engineering 仅为**（**Explanation / How-to**）**导读**；**不替代** **spec**。**HTTP 机读**真源 **[04 §3.4](../../spec/04-后端与API.md)**；**域矩阵**真源 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**；**链上 ABI 与对齐叙述**真源 **[14](../../spec/14-合约-API-ABI-前后端对齐.md)** + **`contracts/`** + **`check-55-s13`** 等脚本；**实现**真源 **`crates/`·`contracts/`·`frontend/`** 与当次 **PR** 可复核产物（含**同 PR 脚本闭包**）。本文件仅为导读，**不**形成第二套机读 SSOT（与 **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)**、**[engineering/README](./README.md)**、磁盘 **`NN`** 主序 **[三处对拍](./02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**）。

---

<a id="ev94mkt-v1"></a>

## V-1 · 本地运行记录（与 **[21-B §6](./21-B-市场与托管机制.md#b21-6-verify)** 同名命令）

**环境**：仓库根 **`D:/TravelTrust`**（Windows **Git Bash**）。**捕获（UTC）**：**2026-04-29**（时效性抽检复跑）。

```text
=== V-1 capture 2026-04-29 UTC · cluster 94-market ===
--- compile market_subsite IT module ---
cargo test -p traveltrust-api market_subsite_catalog_db_api_tests --no-run
Finished `test` profile … (compile OK)
--- routes vs 04 ---
bash scripts/run-check-04-routes.sh
(exit 0)
bash scripts/check-handbook-frontmatter.sh
(exit 0)
bash scripts/check-handbook-engineering-content.sh
(exit 0；stderr 可出现 **HBOOK-ENG-TABLE-WARN** 提示行，**exit 仍 0**)
```

**说明**：**`market_subsite_catalog_db_api_tests`** 在 **`DATABASE_URL` 未设**时运行体会 **skip** 具体用例；**V-1** 仍以 **同轮 `run-check-04-routes` exit 0** + **测试目标编译通过**为主证；**PG 已迁移**环境可再贴 **`test result: ok`** 全绿日志进 PR。**PD-009 收购（① · 2026-05-27）**：**`cargo test -p traveltrust-api market_subsite_catalog`** + **`matrix_pd009_trust_pg_memory_parity`** + **`bash scripts/dev/smoke-acquisition-pd009-local.sh`** — 互指 **[21-B §6](./21-B-市场与托管机制.md#b21-6-verify)**、**[acquisition-publish-trust-rules §8.1](../../spec/artifacts/acquisition-publish-trust-rules.v1.md#81-第一阶段--本地--closed2026-05-27)**。

**台账对拍（文档 → 08 → 本证据）**：[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix) **spec/94** 行 **覆盖度 full**；[09 §3](./09-文档迁移覆盖审计报告.md#audit-coverage) **94 自由市场托管** 簇 **verified**（**[09 §2b.4](./09-文档迁移覆盖审计报告.md#audit-verified-evidence-94market)**）；**[21-B §2b](./21-B-市场与托管机制.md#b21-6-verify)** 文内证据句与上列 **同 PR** 可读。

---

<a id="ev94mkt-v2"></a>

## V-2 · CI 具名 step（**GitHub Actions** · 可复核 log）

| Workflow | Job | Step `name:`（摘录） | 与 **21-B §6** 的对应 |
|----------|-----|----------------------|------------------------|
| **`.github/workflows/build.yml`** | **`build`** | **`04 section 3.4 API table vs mounted routes (STRICT_WARNINGS)`** | **`bash scripts/run-check-04-routes.sh`** **同目的** |
| 同上 | **`build`** | **`Run tests`**（`cargo test --workspace`） | **超集**于 **`cargo test -p traveltrust-api market_subsite_catalog_db_api_tests`** |
| 同上 | **`build`** | **`Handbook frontmatter` / `Handbook engineering content hygiene`** | 与 **§6** 两 **`bash scripts/check-handbook-*.sh`** **同门禁族** |

---

<a id="ev94mkt-v3"></a>

## V-3 · Owner 文档签收（**Reviewed-by**）

**[21-B-市场与托管机制](./21-B-市场与托管机制.md)** 文尾 **`Reviewed-by: @ghost 2026-04-28`** 为本簇 **V-3** 最低签收（**CODEOWNERS** 占位与 **70/07/04** 簇同惯例）。

**盲测四问（94-market）**（辅助 Owner；**非**单独 **V-3**）：

1. **§6** 能否找到 **`market_subsite_catalog_db_api_tests`** 与 **`run-check-04-routes`**？  
2. **§4** 是否显式链 **04 / 93 / 94 / 53**？  
3. 与 **20-B** 分工一句是否在 **§1**？  
4. 本文是否**未**粘贴 **04 §3.4 / 93** 宽表？

---

## 变更记录

| Version | 日期 | 摘要 |
|---------|------|------|
| 1.0.9 | 2026-05-27 | **V-1**：补 **PD-009** 收购验证命令互指（**`matrix_pd009_*`** + **`smoke-acquisition-pd009-local.sh`**）。 |
| 1.0.8 | 2026-04-29 | **V-1**：时效性抽检复跑；**engineering-content** stderr 口径与当前 checker 一致。 |
| 1.0.7 | 2026-04-29 | **V-1**：补 **台账对拍**（**21-B §2b** ↔ **08 §3** **spec/94** ↔ **09 §2b.4**）。 |
| 1.0.6 | 2026-04-29 | 文首 **SSOT（必读）** 与 **08/README** 对拍：补 **14** + **`contracts/`** + **`check-55-s13`** 等脚本句（无正文语义变更）。 |
| 1.0.5 | 2026-04-29 | 文首 **SSOT（必读）** 与 **engineering/README** 同形（**仅为导读**；**不替代 spec**；**PR** 闭包链）。 |
| 1.0.4 | 2026-04-29 | 文首 **SSOT（必读）** 与 **手册 00 §3**/**README**/**三处对拍** 同形（**04 §3.4**/**93**/代码+门禁）。 |
| 1.0.2 | 2026-04-29 | 文首 **SSOT（必读）** 标准句。 |
| 1.0.1 | 2026-04-28 | **V-1**：**engineering-content** 捕获与 **40-D** 无 **TABLE-WARN**、checker **`return`** 修复对齐。 |
| 1.0.0 | 2026-04-28 | 首版：**94-market** 簇 **V-1～V-3**（**21-B**）。 |
