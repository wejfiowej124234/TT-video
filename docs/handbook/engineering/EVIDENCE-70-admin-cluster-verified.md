# EVIDENCE · **70 Admin** 簇 · **09 §2b**（V-1 / V-2 / V-3）

**Version:** 1.0.7 · **最后更新：** 2026-04-29  
**受众**：审计 **handbook** 与 **CI** 对齐的 Owner / Tech lead  
**状态**：现行  
**与 spec 关系**：**证据包**；**不替代** **[04](../../spec/04-后端与API.md)**、**[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**、**[70](../../spec/70-管理员系统开发文档.md)**。  
**母版**（后续簇标准化复制）：**[22-横切-簇级verified证据模板](./22-横切-簇级verified证据模板.md)**。

> **SSOT（必读）**：**engineering 仅为**（**Explanation / How-to**）**导读**；**不替代** **spec**。**HTTP 机读**真源 **[04 §3.4](../../spec/04-后端与API.md)**；**域矩阵**真源 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**；**链上 ABI 与对齐叙述**真源 **[14](../../spec/14-合约-API-ABI-前后端对齐.md)** + **`contracts/`** + **`check-55-s13`** 等脚本；**实现**真源 **`crates/`·`contracts/`·`frontend/`** 与当次 **PR** 可复核产物（含**同 PR 脚本闭包**）。本文件仅为导读，**不**形成第二套机读 SSOT（与 **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)**、**[engineering/README](./README.md)**、磁盘 **`NN`** 主序 **[三处对拍](./02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**）。

---

<a id="ev70-v1"></a>

## V-1 · 本地运行记录（可复制日志；与 **40-D / 41-D / 42-D** **§6** 同名命令）

**环境**：仓库根 **`D:/TravelTrust`**（Windows **Git Bash**）；**`DATABASE_URL`** 未显式导出时，下列 **`cargo test … matrix_*`** 仍 **PASS**（用例内 **PG** 或 skip 逻辑以测试体为准）。**捕获时间（UTC）**：**2026-04-29**（时效性抽检复跑）。

```text
=== V-1 capture 2026-04-29 UTC · cluster 70-admin ===
2026-04-29T14:43:42Z
--- 40-D / shared ---
exit_frontmatter:0
exit_eng_content:0  # engineering-content：exit 0；stderr 可出现 **HBOOK-ENG-TABLE-WARN** 提示行
check-04-routes-vs-code OK: 04 sec 3.4 table paths are mounted (except DOC_ONLY_SCHEDULED).
  (no undocumented public /api/v1 routes vs sec 3.4 table)
… (下游 check-04-* / check-b45* 均 OK)
exit_04routes:0
cargo test -p traveltrust-api matrix_93_d_adm_003b_f030 …
test routes::internal_indexer_admin_db_api_tests::matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg ... ok
test result: ok. 1 passed; … finished in 0.00s
--- 41-D ---
cargo test -p traveltrust-api matrix_93_d_idx_001b_f029_get_internal_indexer_status_ok_shape_app_stack_ok_pg …
test routes::internal_indexer_admin_db_api_tests::matrix_93_d_idx_001b_f029_get_internal_indexer_status_ok_shape_app_stack_ok_pg ... ok
test result: ok. 1 passed; … finished in 0.00s
bash scripts/ops/indexer-reorg-recovery.sh status
curl: (7) Failed to connect to 127.0.0.1 port 8080 …   # 无本地 API 时预期失败；见下「未起服时的读法」
--- 42-D ---
cargo test -p traveltrust-api approval_requires_super_admin_role …
test routes::admin::tests::approval_requires_super_admin_role ... ok
test result: ok. 1 passed; … finished in 0.00s
final_exit:0
```

**未起服时的读法（`indexer-reorg-recovery.sh status`）**：该步依赖 **`API_BASE_URL`**（默认 `http://127.0.0.1:8080`）上已有 **`traveltrust-api`**；**无进程监听时 curl 失败属预期**。**V-1** 仍以 **同次捕获** 中 **`cargo test`** 与 **`run-check-04-routes` exit 0** 为主证；**起服后**再跑 **`bash scripts/ops/indexer-reorg-recovery.sh status`** 可补 **curl 200** 截图或日志进 PR。

**本文件在默认分支的路径**：`docs/handbook/engineering/EVIDENCE-70-admin-cluster-verified.md`（满足 **09 §2b · V-1**「可复制日志」归档要求）。

**台账对拍（文档 → 08 → 本证据）**：[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix) **spec/70** 行 **覆盖度 full**；[09 §3](./09-文档迁移覆盖审计报告.md#audit-coverage) **70 Admin** 簇 **verified**（**[09 §2b.1](./09-文档迁移覆盖审计报告.md#audit-verified-evidence-70)**）；**[40-D §2b](./40-D-Admin机制.md#d40-6-verify)** / **[41-D §2b](./41-D-索引与对账导读.md#d41-6-verify)** / **[42-D §2b](./42-D-Admin审计合规与审批.md#d42-6-verify)** 文内证据句与上列 **同 PR** 可读。

---

<a id="ev70-v2"></a>

## V-2 · CI 具名 step（**GitHub Actions** · 可复核 log）

仓库 **`.github/workflows/build.yml`** · **`jobs.build`**（**`ubuntu-latest`** + **Postgres service** + **`DATABASE_URL`**）：

| Step 名（`name:`） | 与域篇 **§6** 的对应关系 |
|--------------------|---------------------------|
| **`Handbook frontmatter (docs/handbook)`** | 与 **`bash scripts/check-handbook-frontmatter.sh`** / **`python3 scripts/gates/check-handbook-frontmatter.py`** 同门禁族 |
| **`Handbook engineering content hygiene (spec links + domain verify hints)`** | **`bash scripts/check-handbook-engineering-content.sh`**（**40/41/42-D** 文内 **`cargo test` / `bash scripts/`** hint 机读） |
| **`04 section 3.4 API table vs mounted routes (STRICT_WARNINGS)`** | **`python3 scripts/check-04-routes-vs-code.py`** — **与** **`bash scripts/run-check-04-routes.sh`** **同目的**（契约表 vs 挂载路由） |
| **`Run tests`** | **`cargo test --workspace`** — **真超集**于 **`cargo test -p traveltrust-api matrix_93_d_adm_003b_f030`**、**`matrix_93_d_idx_001b_f029_*`**、**`approval_requires_super_admin_role`** |

另：**`.github/workflows/production-gate.yml`** · **`traveltrust-api-tests`** · step **`cargo test -p traveltrust-api`** — 与 **`traveltrust-api`** 包内 **Admin / indexer** 单测同仓。

**复核方式**：在 **GitHub** 打开对应 **workflow run** → **`build` / `traveltrust-api-tests` job** → 展开上表 **step** 日志。

---

<a id="ev70-v3"></a>

## V-3 · Owner 文档签收（**Reviewed-by**）

**仓库默认 CODEOWNERS**（`.github/CODEOWNERS`）当前为 **`* @ghost`**。三篇域文在 **合并本证据的 PR 后** 使用下列 **Reviewed-by** 行作为 **V-3** 最低签收（**组织若有具名 Owner，应在下一 PR 替换 `@ghost` 为真人或团队**）：

```text
Reviewed-by: @ghost 2026-04-28（默认 CODEOWNERS；替换规则见本文 §V-3）
```

**盲测四问（70 簇）**（供 Owner 口头/书面 ack 时对照；**非**单独 **V-3** 证据）：

1. 只读 **40-D §6** 能否找到 **`api_router` + `merge(admin::)`** 与 **`run-check-04-routes`**？  
2. 只读 **41-D §6** 能否找到 **`matrix_93_d_idx_001b_*`** 与 **internal 探针** 脚本名？  
3. 只读 **42-D §6** 能否找到 **`approval_requires_super_admin_role`** 与 **Vault 脚本路径**？  
4. 三篇是否均**未**粘贴 **04 §3.4 / 93** 表体？

---

## 变更记录

| Version | 日期 | 摘要 |
|---------|------|------|
| 1.0.7 | 2026-04-29 | **V-1**：时效性抽检复跑；**engineering-content** stderr 口径旁注；捕获日更新。 |
| 1.0.6 | 2026-04-29 | **V-1**：补 **台账对拍**（**40/41/42-D §2b** ↔ **08 §3** **spec/70** ↔ **09 §2b.1**）。 |
| 1.0.5 | 2026-04-29 | 文首 **SSOT（必读）** 与 **08/README** 对拍：补 **14** + **`contracts/`** + **`check-55-s13`** 等脚本句（无正文语义变更）。 |
| 1.0.4 | 2026-04-29 | 文首 **SSOT（必读）** 与 **engineering/README** 同形（**仅为导读**；**不替代 spec**；**PR** 闭包链）。 |
| 1.0.3 | 2026-04-29 | 文首 **SSOT（必读）** 与 **手册 00 §3**/**README**/**三处对拍** 同形（**04 §3.4**/**93**/代码+门禁）。 |
| 1.0.1 | 2026-04-29 | 文首 **SSOT（必读）** 标准句。 |
| 1.0.0 | 2026-04-28 | 首版：**V-1** 捕获、**V-2** CI 映射、**V-3** 模板与盲测四问。 |
