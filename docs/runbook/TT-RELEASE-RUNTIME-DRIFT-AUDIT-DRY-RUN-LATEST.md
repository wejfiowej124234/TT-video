# Release Runtime Drift Audit · DRY-RUN（Candidate v2）

> **SUPERSEDED_SNAPSHOT** · tip `652bbab5` ≠ current Active tip `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.


**Machine:** `TT_RELEASE_RUNTIME_DRIFT_AUDIT_DRY_RUN`  
**Status:** `DRY_RUN_COMPLETE` · `REPORT_ONLY`  
**Recorded:** `2026-07-20T06:30:00Z`（approx）  
**Baseline pin:** `PSG-REL-20260720-WEB3-CAND-V2` · `v311_fund_safety_candidate_v2`  
**Local HEAD:** `652bbab51a1eb0652ea31f18ae4146fbe325a1ea`  
**Staging `/meta` git_sha:** `f8181b63507fe339e23a1e5285c4242a8bb3507e`  
**Fly:** `tt-api-staging` **v279** · `2026-07-19T07:29:00Z` · `tt-web-staging` ~`2026-07-19T07:08:53Z`

```text
禁止本轮：改码 · 重部署 · 动 Settlement · S7 · Candidate pin · ETA 收口梯子
本审计 = 验证「我们以为的系统」vs「正在跑的系统」
```

---

## 0 · 三个问题（直答）

| # | 问题 | 答案 |
|---|------|------|
| 1 | **现在运行的是不是最新 Candidate？** | **否。** Staging API `build.git_sha=f8181b63…`，比 Candidate tip `652bbab5…` **落后 4 个 commit**（且为 ancestor）。Fly 镜像停在 7/19 v279。 |
| 2 | **PSG 证明的是不是同一个版本？** | **部分是、部分不是。** Registry + Candidate Release Identity + FG-15-B 状态钉在 **`652bbab5` / CAND-V2**；Staging runtime **不是**该 tip。L1–L5 材料钉 pin **但均 `equals_l*_pass=false`**（READY / 旅程记录 ≠ PASS）。 |
| 3 | **有没有「以前修过，旧部署又冒出来」？** | **有 · 主要在 Web3/合约环境面。** Staging `/meta` **未暴露** Candidate `escrow_factory_v2`（`null`），FeeRouter/Factory 地址与 Candidate Money Path **不一致**；Indexer checkpoint **0**。Auth 源码 tip **已在 staging 祖先链上** → Auth「生产级缺口」是**设计债**，不是「旧镜像缺 OTP 补丁」。CMS/WAIT_ETA 审计为 docs-only，不依赖本轮 redeploy。 |

---

## 1 · 身份三角（核心）

| 层 | 值 | 相对 Candidate tip |
|----|-----|-------------------|
| Local `git HEAD` | `652bbab5…` | **VALID（= tip）** |
| `registry/psg-release-version-LATEST.yaml` active | `652bbab5…` · `PSG-REL-20260720-WEB3-CAND-V2` | **VALID** |
| `WEB3-CANDIDATE-V2-RELEASE-IDENTITY-LATEST.json` | `652bbab5…` | **VALID** |
| Staging `/meta` `build.git_sha` | `f8181b63…` | **OLD_RUNTIME** |
| Fly release clock | API v279 · 2026-07-19 | **OLD_RUNTIME** |
| Engineering Tag `v1.1.0-psg-go.20260717` | `7f9099b2…` | **ARCHIVED baseline**（≠ Candidate tip） |

```text
Local HEAD == Registry pin == Candidate Evidence Identity
        ≠
Staging Fly /meta git_sha
        ≠
Candidate Sepolia Money-Path addresses (on staging /meta contracts)
```

**Commit delta（staging → local）：**

1. `493596ae` CDR-19 pin  
2. `09c72b93` L5-A Release Identity（历史节点，现已 ARCHIVED 轨）  
3. `1de17b6a` Mainnet cutover hard gate + Escrow/PG freeze  
4. `652bbab5` Mainnet Release Freeze stamp  

---

## 2 · 分类定义（本报告）

| Class | 含义 |
|-------|------|
| **VALID** | 该层代码/钉扎/证据互指一致（或明确 ARCHIVED / REPORT_ONLY） |
| **OLD_RUNTIME** | 仓库/证据已前进 · **运行环境仍旧** |
| **EVIDENCE_DRIFT** | 证据/活文档仍写旧 tip 或错误 ACTIVE 叙事 |
| **REGISTRY_DRIFT** | Registry/文档与实际 ACTIVE 不一致（本轮抽样多为命名债，见 Hygiene） |
| **NEEDS_RECERTIFY** | 若对齐部署/环境后，相关认证面须重烟测（**非**本轮执行） |
| **MISMATCH** | 同窗内两真源冲突（地址/SHA） |

---

## 3 · 分域结论表

### 3.1 身份与安全

| 模块 | Class | 说明 |
|------|-------|------|
| 注册邮箱 OTP | **VALID（源码相对 staging）** + **GAP（生产级）** | `auth.rs` tip ∈ staging 祖先 → 镜像大致含 OTP；生产级缺口见 Auth Audit / Delta dry-run（设计债） |
| 找回密码 | **VALID（仍 stub）** | 非「旧部署丢修复」· 能力本就未生产化 |
| Email Change | **VALID（缺失）** | 同上 |
| Session list/revoke | **VALID（部分）** | `me_security` 存在；改密全撤仍缺 |
| Rate limit / RBAC | **VALID / residual** | L3 READY_FOR_RECALCULATE ≠ PASS；RBAC residual 已登记 |
| Cookie/Security | **未深探 staging 头** | dry-run 未改部署；标 **NEEDS_RECERTIFY**（对齐部署后烟测） |

### 3.2 用户业务（Market / Guide / Provider / Orders / Escrow / Payment）

| 面 | Class | 说明 |
|----|-------|------|
| Staging API 存活 | **VALID** | `/health` ok · DB ok |
| 业务代码 vs tip | **OLD_RUNTIME** | SHA 落后 tip（业务 diff 主要在后 4 commit 的 Web3/freeze 叙事；非全量业务重写） |
| Payment/Settlement 产品面 | **NEEDS_RECERTIFY** | 与 Candidate Money Path 地址不一致时，staging 业务链上展示**不能**当 Candidate 证 |

### 3.3 Web3（重点）

| 项 | Candidate Evidence | Staging `/meta` | Class |
|----|--------------------|-----------------|-------|
| `escrow_factory_v2` | `0x6e9a4c40…bdef` | **`null`**（仅旧 `escrow_factory` `0xbf746B6a…`） | **MISMATCH · OLD_RUNTIME** |
| `settlement_router` | `0x5A6df184…` | **未出现** | **MISMATCH · OLD_RUNTIME** |
| `fee_router` | `0xf406E6f1…` | `0x81A80092…` | **MISMATCH** |
| `timelock` | `0x46240208…` | `0x46240208…` | **VALID（重叠）** |
| chain_id | 11155111 | 11155111 | **VALID** |
| Indexer checkpoint | FG-15-B 观察轨 | **block=0** | **OLD_RUNTIME / 弱证** |
| Money Path evidence | Candidate 根 `_candidate_v2` | Staging 环境未对齐 V2 | **NEEDS_RECERTIFY**（部署+env 对齐后） |

**裁决：** Staging Fly **不是** Candidate Money Path 的运行时投影；链上 Candidate 证据在 Sepolia 证据根，**不能**用当前 staging `/meta` contracts 冒充已部署 Candidate 运行时。

### 3.4 数据与运营（Migration / CMS / Catalog / OCS / Admin）

| 面 | Class | 说明 |
|----|-------|------|
| CMS Content QA / LOCK | **VALID（证据轨）** | JP CLOSED · 330 LOCKED；治理缺口见 CMS Audit |
| FE Unsplash 回退 | **EVIDENCE/设计债** | 与部署 SHA 正交；假绿风险仍在 |
| SG QA LATEST 污染 | **EVIDENCE_DRIFT** | FR keys in SG file |
| Catalog bake on staging | **OLD_RUNTIME 风险** | Freshness 审计已记：数据面≠代码面 |
| Admin | **VALID（部分）** | 审计 best-effort；二次确认缺口属 Backlog |

### 3.5 PSG 自身（L1–L5 / Registry / Runbook / Pin）

| 面 | Class | 说明 |
|----|-------|------|
| Active Registry pin | **VALID** | CAND-V2 · `652bbab5` |
| Candidate Release Identity | **VALID** | 同上 |
| L1–L4 STATUS | **VALID（诚实）** | READY / journey · **`equals_l*_pass=false`** |
| L5 preflight | **VALID（诚实）** | ≠ L5 Final / PASS |
| `WEB3-CANDIDATE-V2-CODE-FREEZE-LATEST.json` / README 旧叙事 | **EVIDENCE_DRIFT** | 仍夹带 clean/`09c72b93` ACTIVE 语气 |
| `TT-PSG-DOC-VS-DEPLOY-FRESHNESS-AUDIT-LATEST.md` | **EVIDENCE_DRIFT** | 仍写 HEAD=`09c72b93`（需日后文档批 · 非本轮改） |
| FG-15-A Archive | **VALID** | ARCHIVED_HISTORICAL |

---

## 4 · 分类汇总（执行向）

### VALID
- Local HEAD = Registry active = Candidate Release Identity（`652bbab5`）  
- Timelock 地址与 Candidate 重叠  
- L1–L5 STATUS **未假称 PASS**  
- Auth/CMS WAIT_ETA / Delta Auth dry-run = REPORT_ONLY  

### OLD_RUNTIME
- Staging API/Web Fly 镜像与 `/meta` git_sha ≠ Candidate tip  
- Staging contracts **未承载** Candidate EscrowFactoryV2 / SettlementRouter / Candidate FeeRouter  
- Indexer checkpoint 0（相对观察轨弱）  

### EVIDENCE_DRIFT
- Candidate CODE-FREEZE / README 旧 ACTIVE 叙事  
- DOC-VS-DEPLOY 等活文仍钉 `09c72b93` 为「当前」  
- CMS SG Content QA LATEST 污染  

### REGISTRY_DRIFT
- 见 Hygiene：`active_baseline_key=clean` 命名债等（**非** active pin 指错 Candidate）  
- Master matrix FactoryV2 FUTURE vs Candidate 地址（文档债）  

### NEEDS_RECERTIFY（仅当 Owner **另闸**对齐部署后）
- Staging 烟测：health/meta · Auth OTP 外发（若接）· CMS bake · Money Path 读 `/meta` 合约  
- **禁止**在 WAIT_ETA / FG-15-B 窗内自动 redeploy  
- **不等于**现在重跑 S7 / 宣称 PSG Complete  

### MISMATCH（当下）
- Candidate Money Path 地址集 vs Staging `/meta` contracts（除 timelock）  

---

## 5 · 「以前修过又因旧部署出现」矩阵

| 主题 | 以前优化？ | 旧部署会否「装没修过」？ | 结论 |
|------|:---------:|:----------------------:|------|
| Auth OTP 本地能力 | 有 | **基本不会**（auth tip ⊆ staging） | 问题是**未达生产级**，非镜像过旧 |
| Auth 生产邮件 / Reset | 基建有、路由 stub | N/A | 假完成风险在**代码层** |
| CMS Ambient / JP LOCK | 有 | FE 回退可造成「像没修」 | **假绿** · 非 SHA 主因 |
| Web3 Candidate Money Path | 有（Sepolia + 证据） | **会** — staging `/meta` 仍旧厂地址 / V2 null | **OLD_RUNTIME + MISMATCH** |
| PSG L 层 PASS | 未宣称 PASS | N/A | 证据诚实 · 勿用 staging 冒充 L PASS |

---

## 6 · 建议（等窗 · 不执行）

```text
WAIT_ETA 现在
  ├─ 维持 FG-15-B Maintain
  ├─ 本报告归档
  └─ 禁止 redeploy / S7 / Hard Gate

ETA + Formal Baseline 后（另闸 · Owner）
  1) Staging redeploy → tip 652bbab5 + Candidate 合约 env
  2) /meta 对拍 Release Identity + FactoryV2/SR/FeeRouter
  3) 烟测清单 → 关闭 OLD_RUNTIME
  4) 文档批清 EVIDENCE_DRIFT（Hygiene PCR）
  5) 再谈 NEEDS_RECERTIFY 模块烟测（仍 ≠ 自动 PSG Complete）
```

---

## 7 · 机读

[`TT-RELEASE-RUNTIME-DRIFT-AUDIT-DRY-RUN-LATEST.json`](./TT-RELEASE-RUNTIME-DRIFT-AUDIT-DRY-RUN-LATEST.json)

```text
running_is_latest_candidate: false
psg_proves_same_version: partial  # pin yes · staging runtime no · layers not PASS
regressions_from_old_deploy: true  # primarily Web3 contract env / meta projection
auto_deploy: forbidden
eta_impact: none
```
