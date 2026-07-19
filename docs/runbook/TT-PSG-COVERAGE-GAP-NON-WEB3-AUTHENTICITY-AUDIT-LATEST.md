# PSG · Non-Web3 Coverage Gap Completion · Authenticity Audit（Read-only）

**Machine:** `TT_PSG_COVERAGE_GAP_NON_WEB3_AUTHENTICITY_AUDIT`  
**Status:** **COMPLETE** · `2026-07-19` · **只读**  
**被审对象：** [Non-Web3 Gap Completion](./TT-PSG-COVERAGE-GAP-COMPLETION-NON-WEB3-LATEST.md)  
**Evidence 根：** `evidence/GO_pre_eta_production_prep/coverage-gap-non-web3-20260719/`  
**动作边界：** 未改代码 · 未修复 · 未改 Gate / Fix Required  
**后续体系修正：** [Measurement Recalculate](./TT-PSG-COVERAGE-MEASUREMENT-RECALCULATE-LATEST.md)（估数作废 · Evidence VERIFIED · Metric GAP）

```text
PSG:       CONDITIONAL_GO
Fix:       8
Coverage:  Evidence VERIFIED
Metrics:   NOT FINAL
```

**判定词：** `VERIFIED` = 脚本+日志+结论一致 · `GAP` = 有证据但声明过宽/陈旧/范围不足 · `NOT_FOUND` = 声称有证据但文件或成功信号缺失

---

## 1 · 总裁决

| 声明（文档） | 审计结果 |
|--------------|----------|
| Live smoke 链已跑且脚本存在 | **VERIFIED**（多数） |
| RBAC / Journey / Data / UI P0「PASS」有真实日志 | **VERIFIED**（运行态）· 见范围 GAP |
| Coverage %「~88–100%」已机器重算 | **GAP**（估数 · 非 Metrics Recalculate 产物） |
| `RESULTS.json` 与最终状态一致 | **GAP**（仍写 API DOWN / NOT_RUN · **陈旧**） |
| 六角色 RBAC 矩阵 100% | **GAP**（仅 Admin CS deny/allow 矩阵 · 非 Tourist/Guide/… 全矩阵） |
| UI P0 含 loading/error/empty 态 | **GAP**（仅 HTTP 可进入 · 无态覆盖日志） |
| Tourist 完整 Journey FE `/orders` | **GAP**（orders smoke 当时 FE SKIP） |

**一句话：** 非 Web3 **确有真实运行证据**；文档「PASS / 高 %」在**范围与措辞**上部分过满；**不得**把估数当成已过 Threshold 硬门槛。

---

## 2 · 分项核对

### 2.1 基础设施

| 项 | 脚本/动作 | Evidence | 结果 |
|----|-----------|----------|------|
| Checksum 对齐 SQL | `align-checksums.sql` | 文件存在 · 含 140000/15120000 | **VERIFIED**（060000 另次 UPDATE · 不在该 SQL 内 → 小 **GAP** vs SUMMARY「含 060000」表述） |
| API boot | `cargo run` | `api-boot-aligned.log` 有 `/health` 200 | **VERIFIED** |
| FE boot | `next dev :3012` | `fe-boot.log` Ready · 另有 `peekWalletInstallPending` import error | **VERIFIED** 起服 · **GAP** 控制台错误（页仍 200） |
| `RESULTS.json` | — | 仍 `local_api: DOWN` / `live_smoke: NOT_RUN` | **GAP**（与 SUMMARY/日志矛盾 · 未刷新） |
| `SUMMARY.txt` | — | 与 live PASS 日志一致 | **VERIFIED** |

### 2.2 RBAC

| 项 | 核对 | 结果 |
|----|------|------|
| 脚本 | `scripts/dev/smoke-admin-rbac-matrix-local.sh` | **VERIFIED** FOUND |
| 日志 | `smoke-rbac-matrix.log`：OK assign CS · route_matrix · CS deny publish · Finance allow | **VERIFIED** |
| 文档「RBAC PASS / ~92–100%」 | 证据=Admin 控制台角色矩阵 · **非** 六角色×能做/禁止全表 live | **GAP**（PASS 对「该 smoke」成立 · 对「阈值 100% 核心矩阵」过宽） |

### 2.3 Journey

| 角色/步 | 脚本 | 日志信号 | 结果 |
|---------|------|----------|------|
| Orders API | `smoke-orders-list-local.sh` | `TT_ORDERS_LIST_SMOKE: OK` · **SKIP web /orders** | **VERIFIED** API · **GAP** FE orders |
| Provider | `smoke-provider-onboarding-local.sh` | `TT_SMOKE_PROVIDER_ONBOARDING: OK` | **VERIFIED** |
| Guide | `smoke-guide-workbench-l5-local.sh` | `ALL PASS` + API probes | **VERIFIED** |
| Steward | `smoke-steward-onboarding-local.sh` | `TT_SMOKE_STEWARD_ONBOARDING: OK`（含 stake-quote 读 · 非链上 execute） | **VERIFIED** |
| Tourist 注册→市场→订单 FE 全链 | 未单独立项 smoke | `/` `/market` `/auth/login` 见 UI P0 · 无「创建需求」独立日志 | **GAP** |
| Escrow 链上步 | 故意不做 | — | **VERIFIED** 排除（与声明一致） |

### 2.4 Data Lifecycle

| 项 | 脚本 | 日志 | 结果 |
|----|------|------|------|
| Catalog ops（FE 后） | `smoke-admin-content-catalog-ops-p0-local.sh` | `exit 0` · unauth 401 + fe 307 | **VERIFIED** |
| Catalog consumer | `smoke-catalog-consumer-opt-in-staging-p0-local.sh` | catalog RO 200 · `/` `/market` 200 · `exit 0` | **VERIFIED** |
| 早期 FE-down 日志 | `smoke-catalog-ops.log` / `smoke-admin-pages.log` | 含 **FAIL** HTTP 000 | **VERIFIED** 存在 · **不**作最终 PASS 依据（以 `*-fe.log` 为准） |
| Create→DB→API→UI 全对象（Guide/Announcement/Community 逐条） | 未全覆盖 | Community/Announcement 无独立 create 日志 | **GAP** |

### 2.5 UI P0

| 项 | Evidence | 结果 |
|----|----------|------|
| Enterability | `ui-p0-enterability.log`：`/` market orders login governance/proposals me → **200** | **VERIFIED** |
| Admin 页门态 | `smoke-admin-pages-fe.log`：大量 fe 307 · `exit 0` | **VERIFIED** |
| `/escrow` 进入 | **未**出现在 ui-p0 日志 | **NOT_FOUND**（文档 P0 列表含 Escrow · 本探针未测） |
| loading/error/empty/权限态 | **无**对应日志 | **NOT_FOUND** / **GAP** vs「UI 态验证」叙事 |
| Vitest UI 契约 | identity/home/escrowExperience/admin · 73 tests PASS 日志 | **VERIFIED** |

### 2.6 Vitest / Functional 旁证

| 项 | Evidence | 结果 |
|----|----------|------|
| 42+15+16 tests PASS | `vitest-*.log` | **VERIFIED** |
| cargo auth 定向 | `cargo-auth-*.log` · 0 tests / 错目标 | **GAP**（未形成有效 cargo 证据） |

### 2.7 Coverage 结论数字

| 声明 | 结果 |
|------|------|
| Journey ~88–92% · RBAC ~92–100% · Data ~88–92% · UI ~90–95% | **GAP** — 文档自标「估」· **无** `TT-PSG-COVERAGE-METRICS-*` 重算文件 |
| Overall 仍 CONDITIONAL · Fix=8 | **VERIFIED**（与 Gate 纪律一致 · 本审计未改 Gate） |

---

## 3 · 对照表（用户关心的四维）

| 维度 | 文档结论 | 真实性 |
|------|----------|--------|
| **RBAC** | PASS | **VERIFIED**（Admin matrix smoke）· **GAP**（≠ 全角色 100% 阈值） |
| **Journey** | PASS（非链上） | **VERIFIED**（Provider/Guide/Steward/Orders API）· **GAP**（Tourist FE 订单 SKIP · 无创建需求专用证） |
| **Data** | PASS | **VERIFIED**（catalog ops/consumer + FE）· **GAP**（非全 Surface create 链） |
| **UI P0** | PASS | **VERIFIED**（HTTP 进入 + admin 307）· **GAP/NOT_FOUND**（Escrow URL · 态覆盖） |

---

## 4 · 审计结论（给 Owner）

1. **可以信任：** 本地 API/FE 拉起后，RBAC matrix、Provider/Guide/Steward/Orders、catalog、admin pages、P0 路由 200 **确有日志**，不是空口。  
2. **不可夸大：** 「阈值 ≥90% / RBAC 100% / UI 态齐全」**尚未**被机器 Metrics Recalculate 证明；`RESULTS.json` **过期**。  
3. **建议（不在本审计执行）：** 刷新 `RESULTS.json` 与 Metrics 数字；Escrow 进入探针；勿在 WAIT_WINDOW 扩测。  
4. **Gate：** 保持 `CONDITIONAL_GO` · Fix=8 · 本审计 **零变更**。
