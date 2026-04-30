# EVIDENCE · **97 Auth / A 域 HTTP** 簇 · **09 §2b.8**（V-1 / V-2 / V-3）

**Version:** 1.0.9 · **最后更新：** 2026-04-29  
**受众**：审计 **97 Auth** 工程承接（**[10-A](./10-A-认证机制.md)**）与 **CI** 对齐的 Owner / Tech lead  
**状态**：现行  
**与 spec 关系**：**证据包**；**不替代** **[97](../../spec/97-登录找回密码钱包态企业级审计清单.md)** 全文、**[04 §3.4](../../spec/04-后端与API.md)**、**[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**。  
**母版**：[22-横切-簇级verified证据模板](./22-横切-簇级verified证据模板.md)  
**簇登记**：**[09 §3 · 97 Auth](./09-文档迁移覆盖审计报告.md#audit-coverage)** **migrated**；**[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix)** **spec/97→10-A** 行 **覆盖度 full**（**不**抄 **97** 表体）。

> **SSOT（必读）**：**engineering 仅为**（**Explanation / How-to**）**导读**；**不替代** **spec**。**HTTP 机读**真源 **[04 §3.4](../../spec/04-后端与API.md)**；**域矩阵**真源 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**；**链上 ABI 与对齐叙述**真源 **[14](../../spec/14-合约-API-ABI-前后端对齐.md)** + **`contracts/`** + **`check-55-s13`** 等脚本；**实现**真源 **`crates/`·`contracts/`·`frontend/`** 与当次 **PR** 可复核产物（含**同 PR 脚本闭包**）。本文件仅为导读，**不**形成第二套机读 SSOT（与 **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)**、**[engineering/README](./README.md)**、磁盘 **`NN`** 主序 **[三处对拍](./02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**）。

---

<a id="ev10a-v1"></a>

## V-1 · 本地运行记录（与 **[10-A §6](./10-A-认证机制.md)** 同名命令）

**环境**：仓库根（**① 本地**）。**捕获（UTC）**：**2026-04-29**（时效性抽检复跑）。

```text
=== V-1 capture 2026-04-29 UTC · cluster 97-auth-A-http ===
--- 10-A §6 ---
cargo test -p traveltrust-api auth_register_login_logout_db_api_tests
(本抽检 **DATABASE_URL** 就绪：**test result: ok. 55 passed**；缺库时 skip / 子集语义见测试文件头注释)
bash scripts/run-check-04-routes.sh
(exit 0)
bash scripts/check-handbook-frontmatter.sh
(exit 0)
bash scripts/check-handbook-engineering-content.sh
(exit 0；stderr 可出现 **HBOOK-ENG-TABLE-WARN** 提示行，**exit 仍 0**)
final_exit:0
```

**路径**：`docs/handbook/engineering/EVIDENCE-10-A-auth-cluster-verified.md`。

---

<a id="ev10a-v2"></a>

## V-2 · CI 具名 step（**GitHub Actions** · 可复核 log）

| Workflow | Job | Step `name:`（摘录） | 与 **10-A §6** 的对应 |
|----------|-----|----------------------|------------------------|
| **`.github/workflows/build.yml`** | **`build`** | **`04 section 3.4 API table vs mounted routes (STRICT_WARNINGS)`** | **等价于** **`bash scripts/run-check-04-routes.sh`** |
| 同上 | **`build`** | **`Handbook frontmatter (docs/handbook)`** | **等价于** **`bash scripts/check-handbook-frontmatter.sh`** |
| 同上 | **`build`** | **`Handbook engineering content hygiene …`** | **等价于** **`bash scripts/check-handbook-engineering-content.sh`** |
| 同上 | **`build`** | **`Run tests`**（常见为 **`cargo test --workspace`** 或等价） | **workspace** 覆盖 **`traveltrust-api`**；**`auth_register_login_logout_db_api_tests`** 为其子集 |

**复核**：GitHub **Actions** → **`build`** job → 展开上列 **step** 日志。

---

<a id="ev10a-v3"></a>

## V-3 · Owner 文档签收（**Reviewed-by**）

本簇 **签收面**：

- **[10-A-认证机制](./10-A-认证机制.md)** 文尾 **`Reviewed-by: @ghost 2026-04-29`**

**CODEOWNERS** 默认 **`* @ghost`**；真人 Owner 替换见 **04 / 70** 证据包惯例。

**盲测三问（97-auth / A 域）**（辅助 Owner；**非**单独 **V-3**）：

1. **04 §3.4** 是否为 **`/auth/*` / `/api/v1/me*`** 的**唯一** **HTTP 机读**窗？  
2. **93** **A 域** 脚注与 **`matrix_93_a_*`** 命名是否仍与 **10-A §4** 同向？  
3. 是否**未**把 **10-A** 或本证据包写成「可删 **spec/97**」依据？

---

## 变更记录

| Version | 日期 | 摘要 |
|---------|------|------|
| 1.0.9 | 2026-04-29 | **V-1**：时效性抽检复跑；**cargo test** 行补 **55 passed**（本机 PG 就绪）；**engineering-content** stderr 口径对齐。 |
| 1.0.8 | 2026-04-29 | 文首 **SSOT（必读）** 与 **08/README** 对拍：补 **14** + **`contracts/`** + **`check-55-s13`** 等脚本句（无正文语义变更）。 |
| 1.0.7 | 2026-04-29 | 文首 **SSOT（必读）** 与 **engineering/README** 同形（**仅为导读**；**不替代 spec**；**PR** 闭包链）。 |
| 1.0.6 | 2026-04-29 | **簇登记**行：**09 §3 · 97 Auth migrated**、**08 §3 · 97 full** 与 **10-A**/**01 §4** 对拍。 |
| 1.0.5 | 2026-04-29 | **变更记录**：**1.0.4** 行去旧工程四字连写；**V-1** 盲测仍对齐「**HTTP 机读**窗」口径（语义不变）。 |
| 1.0.4 | 2026-04-29 | **V-1 盲测**表述：旧「路由表对照窗」说法 →「**HTTP 机读**窗」；与文首 **SSOT** 对齐。 |
| 1.0.3 | 2026-04-29 | 文首 **SSOT（必读）** 与 **手册 00 §3**/**README**/**三处对拍** 同形（**04 §3.4**/**93**/代码+门禁）。 |
| 1.0.1 | 2026-04-29 | 文首 **SSOT（必读）** 标准句。 |
| 1.0.0 | 2026-04-28 | 首版：**97 Auth / A 域 HTTP** 承接 **V-1～V-3**（**09 §2b.8**）。 |
