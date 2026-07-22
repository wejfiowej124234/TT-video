# PSG Delta Recertify · Auth Identity Lifecycle · DRY-RUN

> **SUPERSEDED_SNAPSHOT** · tip `652bbab5` ≠ current Active tip `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.


**Machine:** `TT_PSG_DELTA_RECERTIFY_AUTH_IDENTITY_DRY_RUN`  
**Status:** `DRY_RUN_COMPLETE` · `REPORT_ONLY` · **Project B remains FROZEN**  
**Recorded:** `2026-07-20T06:25:00Z`（approx）  
**Scope:** Auth Identity Lifecycle **only**  
**HEAD:** `652bbab51a1eb0652ea31f18ae4146fbe325a1ea`  
**Pin (read, not modified):** `PSG-REL-20260720-WEB3-CAND-V2`

```text
本轮 = Delta Detect → Classify → Impact Graph → Production-Grade Gap
禁止：自动改码 · 改 Registry · 动 Candidate v2 · 触碰 Web3 L5 / S7 / PSG Complete
Project B（全仓 Delta Recertify）= 仍 FROZEN · 本文件 ≠ 启动 Project B
```

**对比基线（Prior Audit）：**  
[`TT-WAIT-ETA-PRODUCTION-FEATURE-READINESS-AUDIT-LATEST.md`](./TT-WAIT-ETA-PRODUCTION-FEATURE-READINESS-AUDIT-LATEST.md)（2026-07-20 Track B）  
**非基线：** PSG Tag `v1.1.0-psg-go.20260717`（工程 Tag · 非 Auth PCR）· 无独立 `PCR-AUTH-*` 实现记录。

**诚实边界：**

| 命题 | 真假 |
|------|------|
| 本 dry-run 提升 `psg_complete` | **否** |
| 本 dry-run = Web3 L5 Final | **否**（Auth「生产级 L5 条」≠ PSG Layer5 FG-Web3） |
| Prior Auth 审计结论仍有效？ | **是 · CONFIRMED**（代码未收敛） |

---

## 1 · Delta Detect（当前代码 vs Prior Audit）

### 1.1 文件指纹（抽样）

| Path | sha256_12 | bytes |
|------|-----------|------:|
| `crates/api/src/chain_off/auth.rs` | `1812f679935b` | 79766 |
| `crates/api/src/db/auth_email_tokens.rs` | `9b1ca0ba1e61` | 6804 |
| `crates/api/src/email_transport_resend.rs` | `0c4518227c23` | 2685 |
| `crates/api/src/routes/auth.rs` | `e2a3872e22d3` | 10778 |
| `crates/api/src/routes/me_security.rs` | `0523772fad00` | 12628 |

### 1.2 探针结果（相对 Prior 结论）

| 探针 | Prior 断言 | 当前实测 | Delta |
|------|------------|----------|-------|
| OTP 注册 + 立即 `mark_user_email_verified` | 是 | `auth.rs:428` 仍调用 | **NONE · CONFIRMED** |
| OTP 外发仅 `log` / 其他 → false | 是 | `dispatch_*` match 仅 `"log"` · `_ => false` `:565-586` | **NONE · CONFIRMED** |
| Forgot/Reset = stub → `chain_off_stub` | 是 | `routes/auth.rs` → stub；无 `issue_and_send` | **NONE · CONFIRMED** |
| Email Change handler | ABSENT | 全仓 `email_change`/`change_email` **0 命中** | **NONE · CONFIRMED** |
| Session list/revoke | PARTIAL | `me_security.rs` list + current/suffix revoke | **NONE · CONFIRMED** |
| 改密 revoke-all | 未做 | `put_me_password` 无 `revoke_all_sessions` | **NONE · CONFIRMED** |
| PG tokens / Resend 模块 | 孤儿 | 仍存在；**路由未接线** | **NONE · CONFIRMED** |
| IT 期望完整 forgot 限流/审计 | 文档/测试领先 | `auth_*_db_api_tests` 仍有 forgot 用例 · **live 路由 stub** | **DRIFT_TEST_VS_RUNTIME**（非产品改善） |

### 1.3 Delta 汇总

| Class | Count | 含义 |
|-------|------:|------|
| **NONE / CONFIRMED** | 7 | 旧审计仍成立 · 无正向收敛 |
| **DRIFT_TEST_VS_RUNTIME** | 1 | 测试/文档期望 > 运行时 stub |
| **NEW_FEATURE** | 0 | 无新 Auth 能力合入 |
| **REGRESSION** | 0 | 未发现相对 Prior 变差的产品路径 |

**Detect 裁决：** `NO_MATERIAL_CODE_DELTA_VS_PRIOR_AUDIT` · 差距清单可 **直接继承并升级为行业生产级标准**，无需因「代码已修」作废 Prior。

---

## 2 · Classify（四能力面）

| Face ID | 能力 | Feature Complete? | Production-Grade? | Classify |
|---------|------|:-----------------:|:-----------------:|----------|
| **AIL-01** | 注册邮箱验证码（OTP） | ✅ 本地 | ❌ | `GAP_PRODUCTION` |
| **AIL-02** | 密码找回 / Reset | ❌ stub | ❌ | `GAP_MISSING` |
| **AIL-03** | Email Change | ❌ 缺失 | ❌ | `GAP_MISSING` |
| **AIL-04** | Session Recovery / 会话安全 | ✅ 部分 list/revoke | ❌ 无改密全撤 / 无恢复流产品化 | `GAP_PARTIAL` |

**附加类：**

| ID | 类 | 说明 |
|----|-----|------|
| AIL-X1 | `ORPHAN_INFRA` | `auth_email_tokens` + Resend + limit 模块未接路由 |
| AIL-X2 | `FALSE_CONFIDENCE` | IT/docs 暗示生产 forgot/verify · runtime stub |
| AIL-X3 | `ENUMERATION` | send-code / register 409 |

---

## 3 · Impact Graph（只读 · 不改系统）

```text
                    ┌─────────────────────┐
                    │ Owner Formal Baseline│
                    │ (未来 · 非本轮)        │
                    └──────────┬──────────┘
                               │ unlocks independent PCR-AUTH-*
                               ▼
┌──────────────┐   depends    ┌──────────────────────────┐
│ AIL-01 OTP   │─────────────►│ Mail transport (Resend)  │
│ ownership    │              │ fail-closed              │
└──────┬───────┘              └────────────┬─────────────┘
       │ needs durable token               │
       ▼                                   ▼
┌──────────────┐                     ┌─────────────┐
│ AIL-X1 wire  │◄── same PCR or ───►│ DNS SPF/…   │
│ or delete    │     follow-on       └─────────────┘
└──────┬───────┘
       │ enables
       ▼
┌──────────────┐     ┌──────────────┐
│ AIL-02 Reset │────►│ AIL-04 Sess  │ revoke-all on reset/password
└──────────────┘     └──────┬───────┘
                            │
┌──────────────┐            │
│ AIL-03 Email │────────────┘  (re-verify + session policy)
│ Change       │
└──────────────┘

Web3 Candidate v2 / FG-15-B / S7 / PSG Complete
        │
        └── ⟂ ORTHOGONAL（本 Impact 不进入）
```

**爆炸半径（若错误地在 WAIT_ETA 改码）：** Auth 路由 · users 表 · session · 邮件密钥 · 前端 `/auth/*` → 会触发 **PCR → Local → Staging → Recert**，并污染 Candidate 窗。  
**故：** dry-run **禁止自动修改**。

---

## 4 · Production-Grade（「Auth L5 条」）差距分析

> **命名澄清：** 此处 **Production-Grade / Auth industry L5 bar** = 身份生命周期可上公网的质量条。  
> **≠** PSG **Layer5 Financial-Grade Web3** · **≠** `L5 Final` · **≠** `psg_complete`。

### 4.1 行业生产级准则 vs 现状

| 准则 | AIL-01 OTP | AIL-02 Reset | AIL-03 EmailΔ | AIL-04 Session |
|------|:----------:|:------------:|:-------------:|:--------------:|
| 密码学安全 / 足够熵 | PARTIAL（6 位） | FAIL | N/A | PARTIAL |
| 一次性 + 过期 + 防重放 | PARTIAL | FAIL | N/A | PARTIAL |
| 生产外发 + 投递失败 fail-closed | FAIL | FAIL | N/A | N/A |
| 邮箱所有权证明后才 verified | FAIL（注册即 verified） | — | N/A | — |
| 枚举防护 | FAIL | FAIL(stub ok 假) | N/A | — |
| 限流（邮箱+IP） | PARTIAL | 死代码/未接 | N/A | — |
| Audit trail | FAIL | FAIL | N/A | PARTIAL |
| 改密/重置后 session 回收 | — | FAIL | N/A | FAIL |
| 多设备可控撤销 | — | — | — | PARTIAL |
| SPF/DKIM/DMARC | UNKNOWN | UNKNOWN | — | — |

### 4.2 差距清单（升级到行业生产级 · 继承 Backlog）

| Gap ID | Face | 差距 | 目标态 | Pri |
|--------|------|------|--------|:---:|
| GAP-AIL-01 | AIL-01 | 无生产投递 · 自动 verified | 投递成功才算所有权 **或** 链接验证后置 verified | P0 |
| GAP-AIL-02 | AIL-01 | 6 位 OTP / 内存存储 | opaque token 或加强 OTP + 持久化 | P0 |
| GAP-AIL-03 | AIL-01 | 可枚举 409 | 统一响应 | P0 |
| GAP-AIL-04 | AIL-02 | stub 返回 ok | 真重置链路或关闭入口 | P0 |
| GAP-AIL-05 | AIL-03 | 能力缺失 | 验证旧邮→新邮→换绑→会话策略 | P1 |
| GAP-AIL-06 | AIL-04 | 改密不撤会话 | revoke-all（或保留当前） | P0 |
| GAP-AIL-07 | X1 | 孤儿双层 | 接线 **或** 删除/隔离测试 | P0 |
| GAP-AIL-08 | X2 | IT 假信心 | 测活用例与 runtime 对齐 | P1 |
| GAP-AIL-09 | — | DNS 邮件认证 | SPF/DKIM/DMARC 运维清单 | P1 |

---

## 5 · 执行计划（仅计划 · Formal Baseline 后独立 PCR）

```text
NOW (WAIT_ETA)
  └─ 本 DRY-RUN 归档 · Project B 仍 FROZEN · Maintain only

AFTER Candidate Formal Baseline
  └─ PCR-AUTH-VERIFY-MODEL      (GAP-AIL-01/02 产品决)
  └─ PCR-AUTH-MAIL-TRANSPORT    (投递 fail-closed)
  └─ PCR-AUTH-PASSWORD-RESET    (GAP-AIL-04)
  └─ PCR-SEC-SESSION-REVOKE     (GAP-AIL-06)
  └─ PCR-AUTH-ANTI-ENUM         (GAP-AIL-03)
  └─ PCR-AUTH-LAYER-CONVERGE    (GAP-AIL-07)
  └─ PCR-AUTH-EMAIL-CHANGE      (GAP-AIL-05 · P1)
```

**每 PCR 验收：** Local 绿 → Staging 真邮件探针 → 证据包 → **禁止**写入 Candidate / FG-15-B / S7 证据根。

**明确不做（本 dry-run）：**  
改 `auth.rs` · 改 schema · 跑 S7 · 翻 Hard Gate · 宣称 Auth Production Ready · 宣称 PSG Complete。

---

## 6 · 与 Prior / Backlog 关系

| 文档 | 关系 |
|------|------|
| Feature Readiness Audit | **仍有效** · 本 dry-run **CONFIRMED** |
| [`PRODUCTION-READINESS-BACKLOG`](./TT-WAIT-ETA-PRODUCTION-READINESS-BACKLOG-LATEST.md) | Gap → 已映射 PR-AUTH / PR-SEC |
| Project B 全仓 Delta Recertify | **未启动** · 仍 FROZEN |

---

## 7 · 机读摘要

见 [`TT-PSG-DELTA-RECERTIFY-AUTH-IDENTITY-DRY-RUN-LATEST.json`](./TT-PSG-DELTA-RECERTIFY-AUTH-IDENTITY-DRY-RUN-LATEST.json)

```text
verdict: PRIOR_AUDIT_STILL_VALID
material_code_delta: false
production_grade_ready: false
psg_complete_impact: none
candidate_v2_impact: none
web3_l5_s7_impact: none
project_b: FROZEN
```
