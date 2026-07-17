# PSG Phase B · Public Surface System Certification（升级版）

**STATUS:** `ACTIVE`  
**Hierarchy:** [Constitution v1](../governance/TT-ARCHITECTURE-CONSTITUTION-v1.md) → L0 → **PSG Phase B** → PF  
**Phase:** ② Staging · **≠** ③ Production GO  
**Production GO:** `NO_GO`  
**PF Step 5:** **FROZEN**（本 Phase **不得**解冻）  
**Machine key:** `TT_PSG_PHASE_B_PUBLIC_SURFACE_CERT`  
**Final gate:** `TT_PSG_PRODUCTION_CERT`  
**Parent:** [TT-PUBLIC-SURFACE-GOVERNANCE.md](./TT-PUBLIC-SURFACE-GOVERNANCE.md)  
**Board:** [TT-PUBLIC-SURFACE-GOVERNANCE-BOARD.md](./TT-PUBLIC-SURFACE-GOVERNANCE-BOARD.md)  
**Registry:** [registry/psg-phase-b-production-cert.v1.yaml](../../registry/psg-phase-b-production-cert.v1.yaml)  
**Matrix:** [registry/psg-public-surface-matrix.v1.yaml](../../registry/psg-public-surface-matrix.v1.yaml)

---

## 0 · 一句话

Phase B **不是修页面、不是修 Bug**，而是证明**整个公开面系统**具备长期稳定性：  
同一套治理在任意新增页面 / CMS / 媒体 / 国家站上可重复执行、可验证、可审计。

从「修问题」→「建立企业级发布与数据治理机制」——**本文件是 PSG 最后一块关键拼图**。

---

## 1 · 前置 P0

| P0 | 状态 | Phase B |
|----|------|---------|
| P0① Deploy / Runtime | **CLOSED** | 保持；并入 B4 |
| P0② OCS / UPSERT | **CLOSED** | 保持；并入 Double Bootstrap |
| P0③ CMS | **FOUNDATION_READY** | **B1–B5 + 破坏性全 PASS 后 → CLOSED** |
| P0④ COS | **CLOSED** | 保持；并入 B3 + 媒体破坏性不回退 |
| P0⑤ Public Data | **FOUNDATION_READY** | **B1–B5 + 破坏性全 PASS 后 → CLOSED** |

**禁止** P0③ / P0⑤ 未 CLOSED 时解冻 PF。  
**禁止** `PASS_RUNTIME_SAMPLE` 冒充 Phase B Exit。

---

## 2 · 五认证域（写死 · 每域全过才可关 P0③/P0⑤）

| Domain | 认证内容 | 目标 |
|--------|----------|------|
| **B1 Public Data** | Published · Production 隔离 · Guest Contract · DTO · 国家/语言过滤 | 数据不会再混乱 |
| **B2 CMS Governance** | 生命周期 · 版本 · 发布 · 回滚 · 审计 | CMS 永远是真源 |
| **B3 COS Governance** | Asset → Object → CDN → Guest 全链路 | 媒体不会再丢 |
| **B4 Runtime Governance** | Deploy · Machine Replacement · Bootstrap · Cache | 重启不会回退 |
| **B5 Public Surface** | Home · Guides · Community · Campaign · Hero · Banner · Ambient · Pulse · Official Guide · Provider · Acquisition | 用户看到的页面始终一致 |

任一域 FAIL → **禁止**标 P0③/P0⑤ CLOSED · **禁止** `TT_PSG_PRODUCTION_CERT=PASS`。

---

## 3 · 破坏性认证套件（写死）

已有：P0④ **媒体破坏性认证**（clean restart · 禁 sftp · broken=0）。  
**再补**下列五项（全部 PASS 才算破坏性套件绿）：

### 3.1 Machine Replacement

连续替换 Machine **多次**（≥2）：

- 页面数量一致  
- DTO 一致  
- 媒体一致  
- Guest 一致  

### 3.2 Double Bootstrap

```text
Bootstrap → Bootstrap
```

验证：不新增数据 · UUID 不变 · canonical key 不变。

### 3.3 Clean Deploy

```text
API → Web → API → Web
```

（连续两轮；Owner 闸）验证：Matrix / Guest / CMS **不变化**。

### 3.4 Cache Flush

主动清 CDN / Runtime Cache 后，Hero · Ambient · Banner · Guide **全部可恢复**。

### 3.5 Runtime Restart

重启 API + Web 后，**所有公开面**一致（与替换前快照对拍）。

| 规则 | |
|------|--|
| 禁止 sftp / 人工补图 | 破坏性窗内 |
| 禁止改 CMS 内容掩盖 | 破坏性窗内 |
| 禁止前端 fallback 冒充绿 | 永久 |
| 证据脱敏 | 无长期凭据进 Git / Board |

---

## 4 · 发布准入三闸（Gate 全绿仍可能线上翻车时的补强）

### 4.1 SSOT Drift · `TT_PSG_SSOT_DRIFT`

每次认证自动比较：Registry · Runbook · Board · Cockpit（若在仓）· Runtime · API Contract · DB Schema / Migration · Environment 声明。

```text
任一不一致 → TT_PSG_SSOT_DRIFT = FAIL
否则         → TT_PSG_SSOT_DRIFT = PASS
```

```bash
node scripts/gates/check-psg-ssot-drift.cjs
STAGING_API_BASE=https://tt-api-staging.fly.dev node scripts/gates/check-psg-ssot-drift.cjs
```

### 4.2 Release Reproducibility · `TT_PSG_REPRODUCIBLE_BUILD`

同一 Git SHA 连续三次 deploy，必须得到：相同 Runtime SHA · Matrix · Guest · DTO · CMS · COS。

```text
否则 → TT_PSG_REPRODUCIBLE_BUILD = FAIL
```

证据目录：`evidence/GO_psg_foundation/production_cert/repro/*.json`（三次部署后指纹）。

```bash
node scripts/gates/check-psg-reproducible-build.cjs
```

### 4.3 Environment Alignment · `TT_PSG_ENVIRONMENT_ALIGNMENT`

```text
Local → Staging → Production Candidate
```

API Contract · DTO · CMS 生命周期 · COS Backend · Object Key · Migration · Registry **必须一致**。

```text
否则 → TT_PSG_ENVIRONMENT_ALIGNMENT = FAIL
```

```bash
STAGING_API_BASE=https://tt-api-staging.fly.dev \
  PRODUCTION_CANDIDATE_API_BASE=<readonly-candidate> \
  node scripts/gates/check-psg-environment-alignment.cjs
```

---

## 5 · 最终 Gate · `TT_PSG_PRODUCTION_CERT`

```text
TT_PSG_PRODUCTION_CERT
├── B1 Public Data
├── B2 CMS
├── B3 COS
├── B4 Runtime
├── B5 Public Surface
│
├── SSOT Drift              → TT_PSG_SSOT_DRIFT
├── Reproducible Build     → TT_PSG_REPRODUCIBLE_BUILD
├── Environment Alignment  → TT_PSG_ENVIRONMENT_ALIGNMENT
│
├── Machine Replacement
├── Double Bootstrap
├── Clean Deploy
├── Cache Flush
├── Runtime Restart
├── Media Destructive
│
└── PASS（任一子项失败 → FAIL）
```

```bash
bash scripts/gates/run-psg-production-cert.sh

PSG_ALLOW_DESTRUCTIVE_CERT=1 PSG_ALLOW_BOOTSTRAP_WRITE=1 \
  STAGING_API_BASE=https://tt-api-staging.fly.dev \
  STAGING_WEB_BASE=https://tt-web-staging.fly.dev \
  PRODUCTION_CANDIDATE_API_BASE=<readonly-candidate> \
  bash scripts/gates/run-psg-production-cert.sh
```

证据：`evidence/GO_psg_foundation/production_cert/PSG-PRODUCTION-CERT-LATEST.json`

---

## 6 · Phase B Exit → 关闭 P0③ / P0⑤

1. **B1–B5** 全部 PASS  
2. **`TT_PSG_SSOT_DRIFT=PASS`**  
3. **`TT_PSG_REPRODUCIBLE_BUILD=PASS`**  
4. **`TT_PSG_ENVIRONMENT_ALIGNMENT=PASS`**  
5. **破坏性套件**全部 PASS  
6. **`TT_PSG_PRODUCTION_CERT=PASS`**  
7. **才**将 P0③、P0⑤ 标 **CLOSED**  
8. **仍禁止**解冻 PF，直到满足 §7

---

## 7 · PF Step 5 解冻条件（写死 · 唯一入口 · 终式）

```text
PF Step 5 解冻
  =
    P0①～P0⑤ 全部 CLOSED
  ∧ TT_PSG_PRODUCTION_CERT = PASS
  ∧ TT_PSG_SSOT_DRIFT = PASS
  ∧ TT_PSG_REPRODUCIBLE_BUILD = PASS
  ∧ TT_PSG_ENVIRONMENT_ALIGNMENT = PASS
  ∧ Public Surface Matrix PASS
  ∧ 全部破坏性认证 PASS
```

仍 **≠** Staging Batch PASS · **≠** Production GO · **≠** 主网真链。  
PF **不再依赖人工判断**，只依赖可重复、可审计、可验证的发布认证体系。

| 禁止冒充解冻 | |
|--------------|--|
| 「感觉稳定」/ Gate 碰巧全绿一次 | ✗ |
| 单页修好 | ✗ |
| Local+Staging 绿但 Prod Candidate 未对齐 | ✗ |
| 跳过 SSOT / Repro / Env 任一闸 | ✗ |
| 跳过任一破坏性项 | ✗ |

---

## 8 · 诚实边界

① 本地绿 ≠ ② `TT_PSG_PRODUCTION_CERT` ≠ ③ Production GO。  
Phase B ACTIVE：**禁止**按单页回流修 UI；**禁止**提前进 PF。  
本层通过后：新增页面 / CMS / 媒体 / 国家站 / 部署流程 **必须**复用同一套发布准入规范。
