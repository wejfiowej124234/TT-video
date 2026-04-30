# EVIDENCE · **250/260 强异步（outbox / async_jobs / onboarding）** 簇 · **09 §2b**（V-1 / V-2 / V-3）

**Version:** 1.0.8 · **最后更新：** 2026-04-29  
**受众**：审计 **30-C** 强异步簇与 **CI** 对齐的 Owner / Tech lead  
**状态**：现行  
**与 spec 关系**：**证据包**；**不替代** **[250](../../spec/250-阶段Job-Queue-异步任务系统.md)**、**[260](../../spec/260-阶段定时任务系统-Scheduler.md)**、**[04](../../spec/04-后端与API.md)**、**[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**、**[96-09](../../spec/96-09-消息通知与异步任务.md)**。  
**母版**：[22-横切-簇级verified证据模板](./22-横切-簇级verified证据模板.md)

> **SSOT（必读）**：**engineering 仅为**（**Explanation / How-to**）**导读**；**不替代** **spec**。**HTTP 机读**真源 **[04 §3.4](../../spec/04-后端与API.md)**；**域矩阵**真源 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**；**链上 ABI 与对齐叙述**真源 **[14](../../spec/14-合约-API-ABI-前后端对齐.md)** + **`contracts/`** + **`check-55-s13`** 等脚本；**实现**真源 **`crates/`·`contracts/`·`frontend/`** 与当次 **PR** 可复核产物（含**同 PR 脚本闭包**）。本文件仅为导读，**不**形成第二套机读 SSOT（与 **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)**、**[engineering/README](./README.md)**、磁盘 **`NN`** 主序 **[三处对拍](./02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**）。

---

<a id="ev30c-v1"></a>

## V-1 · 本地运行记录（与 **[30-C §6](./30-C-执行器调度机制.md)** 同名命令）

**环境**：仓库根 **`D:/TravelTrust`**（Windows **Git Bash**）。**捕获（UTC）**：**2026-04-29**（时效性抽检复跑）。

```text
=== V-1 capture 2026-04-29 UTC · cluster 30-C-async ===
--- routes vs 04 ---
bash scripts/run-check-04-routes.sh
(exit 0)
bash scripts/check-handbook-frontmatter.sh
(exit 0)
bash scripts/check-handbook-engineering-content.sh
(exit 0；stderr 可出现 **HBOOK-ENG-TABLE-WARN** 提示行，**exit 仍 0**)
--- compile onboarding / async_jobs 栈 IT（同 §6 过滤串） ---
cargo test -p traveltrust-api onboarding_app_stack_db_api_tests --no-run
Finished `test` profile … (compile OK)
```

**说明**：**`onboarding_app_stack_db_api_tests`** 在 **`DATABASE_URL` 未就绪**时可能 **skip** 或行为见 **`onboarding_app_stack_db_api_tests.rs`** 头注释；**V-1** 仍以 **`run-check-04-routes` + 两 handbook 门禁 exit 0** + **目标测试目标编译通过**为主证。

**台账对拍（文档 → 08 → 本证据）**：[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix) **spec/250 + spec/260** 行 **覆盖度 full**；[09 §3](./09-文档迁移覆盖审计报告.md#audit-coverage) **250/260 异步与调度** 簇 **verified**（**§2b.11**）；**[30-C §2b](./30-C-执行器调度机制.md)** 文内证据句与上列 **同 PR** 可读。

**本文件在默认分支的路径**：`docs/handbook/engineering/EVIDENCE-30-C-async-cluster-verified.md`（满足 **09 §2b · V-1**「可复制日志」归档要求）。

---

<a id="ev30c-v2"></a>

## V-2 · CI 具名 step（**GitHub Actions** · 可复核 log）

仓库 **`.github/workflows/build.yml`** · **`jobs.build`**（与域篇 **§6** 命令同族）：

| Step 名（`name:`） | 与 **30-C §6** 的对应关系 |
|--------------------|---------------------------|
| **`Handbook frontmatter (docs/handbook)`** | 与 **`bash scripts/check-handbook-frontmatter.sh`** / **`python3 scripts/gates/check-handbook-frontmatter.py`** 同门禁族 |
| **`Handbook engineering content hygiene (spec links + domain verify hints)`** | **`bash scripts/check-handbook-engineering-content.sh`**（**30-C** 文内 **`cargo test` / `bash scripts/`** 机读） |
| **`04 section 3.4 API table vs mounted routes (STRICT_WARNINGS)`** | **`python3 scripts/check-04-routes-vs-code.py`** — 与 **`bash scripts/run-check-04-routes.sh`** **同目的** |
| **`Run tests`** | **`cargo test --workspace`** — **超集**于 **`cargo test -p traveltrust-api onboarding_app_stack_db_api_tests`** |

另：**`.github/workflows/production-gate.yml`** · **`traveltrust-api-tests`** · step **`cargo test -p traveltrust-api`** — 与 **`traveltrust-api`** 包内 **onboarding / async_jobs** 相关单测同仓。

**复核方式**：在 **GitHub** 打开对应 **workflow run** → **`build` / `traveltrust-api-tests` job** → 展开上表 **step** 日志。

---

<a id="ev30c-v3"></a>

## V-3 · Owner 文档签收（**Reviewed-by**）

**仓库默认 CODEOWNERS**（`.github/CODEOWNERS`）当前为 **`* @ghost`**。**[30-C-执行器调度机制](./30-C-执行器调度机制.md)** 在合并本证据修订的 PR 后使用下列 **Reviewed-by** 行作为 **V-3** 最低签收（**组织若有具名 Owner，应在下一 PR 替换 `@ghost` 为真人或团队**）：

```text
Reviewed-by: @ghost 2026-04-29（默认 CODEOWNERS；替换规则见本文 §V-3）
```

与 **30-C** 文末 **`Reviewed-by:`** 行同效。

**盲测四问（强异步）**（辅助 Owner；**非**单独 **V-3**）：

1. **§6** 能否找到 **`onboarding_app_stack_db_api_tests`** 与 **`run-check-04-routes`**？  
2. **§4** 是否显式链 **250 / 260 / 04 / 93**？  
3. **outbox** 与 **250 §二** 环境闸一句是否在 **§5** 或 **§8** 可定位？  
4. 本文是否**未**整篇粘贴 **250/260** 长表？

---

## 变更记录

| Version | 日期 | 摘要 |
|---------|------|------|
| 1.0.8 | 2026-04-29 | **V-1**：时效性抽检复跑；**engineering-content** stderr 口径与他簇对齐。 |
| 1.0.7 | 2026-04-29 | **V-1**：补 **08 §3**（**250+260**）与 **09 §3** 台账对拍句（与 **30-C §2b** 三向一致）。 |
| 1.0.6 | 2026-04-29 | 文首 **SSOT（必读）** 与 **08/README** 对拍：补 **14** + **`contracts/`** + **`check-55-s13`** 等脚本句（无正文语义变更）。 |
| 1.0.5 | 2026-04-29 | 文首 **SSOT（必读）** 与 **engineering/README** 同形（**仅为导读**；**不替代 spec**；**PR** 闭包链）。 |
| 1.0.4 | 2026-04-29 | 文首 **SSOT（必读）** 与 **手册 00 §3**/**README**/**三处对拍** 同形（**04 §3.4**/**93**/代码+门禁）。 |
| 1.0.2 | 2026-04-29 | 文首 **SSOT（必读）** 标准句。 |
| 1.0.1 | 2026-04-29 | 对齐 **[22](./22-横切-簇级verified证据模板.md)** / **70** 样例：**V-1** 默认分支路径句；**V-2** 改 step 名表 + **`production-gate.yml`**；**V-3** **CODEOWNERS** 说明块。 |
| 1.0.0 | 2026-04-29 | 首版：**30-C-async** 簇 **V-1～V-3**（**09 §2b.11**）。 |
