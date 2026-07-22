# TT · Post-PSG Reality Closure Planning（FROZEN · 执行准备）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> **Reality W0–W7 is NOT Final Release mainline** until after FREEZE cert · **cert suite FORBIDDEN now**。  
> tip `652bbab5` below = **SUPERSEDED_SNAPSHOT**（historical planning pin · ≠ current tip `97289a71`）。  
> SSOT：[TT-FINAL-RELEASE-BASELINE-LATEST](./TT-FINAL-RELEASE-BASELINE-LATEST.md) · [TT-WEB3-CANDIDATE-V2-LATEST](./TT-WEB3-CANDIDATE-V2-LATEST.md)

**Machine:** `TT_POST_PSG_REALITY_CLOSURE_PLANNING`  
**Status:** `SUPERSEDED_SNAPSHOT` · `EXECUTION_PREP_FROZEN` · `WAIT_ETA_PREP_CLOSED` · **GOVERNANCE_SURFACE_FROZEN** · **RELEASE_ENGINEERING_FREEZE** · **STEADY_MAINTAIN_ONLY** · **GOVERNANCE_CLOSED_20260721**  
**Recorded:** `2026-07-20`  
**Candidate pin（冻结 · 不改 · 历史规划钉）：** `PSG-REL-20260720-WEB3-CAND-V2` · tip `652bbab5…`（**≠** living tip `97289a71`）  

```text
【运营口令 · LOCKED · Owner 2026-07-21】
  等窗：Maintain 防漂移 · 并行 Content QA + Owner 决策
  禁：新增流程 · 重构治理 · 扩文档
  满窗：直接 Project A → Reality W0→W7 → Delta → Readiness → Staging-grade GO
```

```text
阶段判断（LOCKED）
  已从「继续找问题」→「冻结 · 守窗 · 准备执行」
  = 发布工程冻结 · ≠ 开发阶段
  两日审计 = 找原因 + 设计解决路线 · 已够
  下一步最高价值 = 守住 Candidate · 满窗严格执行梯子
  ≠ 继续修改 / 继续扩审计框架
```

```text
现在 WAIT_ETA ──Maintain──► Settlement/FG 满窗
  → Project A → Formal Baseline
  → Reality Closure: Reality-W0→W1→W2→Reality-W3→W4→Reality-W5→W6→W7 Delta
  → Reality Closure PASS → Production Readiness
  → Staging-grade / Testnet Production GO（fly.dev · Scope A）
  → ③ Public/Mainnet Production GO（另闸 · 禁与上式混称）
```

**三原则（LOCKED）**

1. **不再扩大范围** — OLD_RUNTIME→W0 · Auth→W1 · CMS→W2 · Sec/User/Admin→W3 · DB/Ops→W4 · UI→W5 · 文档→W6 · Delta→W7；再加审计框架收益低  
2. **不在等窗改生产债** — 否则修复版 A / 认证版 B / 部署版 C 再分裂  
3. **Maintain = 护候选** — Integrity·Catalog·Freshness·ETA·Snapshot → 满窗时 Candidate=冻结证据=无漂移 · **不抬** Complete%

**等待期状态（LOCKED）**

| 项 | 状态 |
|----|------|
| PSG Candidate | **Frozen** |
| ETA | **Waiting** |
| Maintain | **Running** |
| Reality Closure | **Prepared** |
| Feature Inventory | **Prepared** |
| DB Audit | **Prepared** |
| Auth/CMS 修复 | **Waiting** |
| Delta Recertify | **Waiting** |

**已冻结闸面（够用 · 禁止再增 Gate / Framework）：**  
PSG · [Reality Closure Gate](./TT-REALITY-CLOSURE-GATE-LATEST.md) · [Feature Inventory Gate](./TT-PRODUCTION-FEATURE-INVENTORY-GATE-LATEST.md) · Delta=W7 · DB Audit / Wave Acceptance = 清单非新闸

```text
成熟版满窗路线（LOCKED · Stage 0–7）

阶段0  WAIT_ETA · Maintain（现在）

阶段1  Project A
       Settlement finalize → Bridge/Manifest（若适用）
       → L5 Final Evidence
       → S7 Recalculate（#1 · Baseline 前 · Candidate 梯已写死）
       → Formal Candidate Release Baseline
       产出：Baseline 成立 · 仍可能 psg_complete=false

阶段2  PSG 五层状态检查（Attest / 读矩阵 · 非假装全绿）
       若 L1–L5 已全 PASS → 可跳阶段3修债（罕见）
       若仍有 L1/L2/L3/L4 residual → 必须进阶段3
       （诚实：Baseline 后 L3 Auth 等常仍 NEED_FIX）

阶段3  Reality Closure 修复
       Reality-W0 Runtime → W1 Auth → W2 CMS → Reality-W3 Sec/User/Admin（+ Security Governance）
       → W4 DB/Ops（+ SRE Lifecycle）→ **Reality-W5 UI/UX Closure** → W6 Hygiene（+ BizOps 文书）
       （执行必须串行 · P0–P4 只是影响优先级叙事 · 禁止跟 P 序跳 Wave）

阶段4  W7 Delta Recertify
       + Feature Inventory Gate + Reality Closure Gate

阶段5  PSG Recalculate（#2 · Post-Reality）
       仅当十维/层证据支持时 → 才可能 psg_complete=true
       禁止：未修 L3 却文档翻 Complete

阶段6  Production Readiness Review
       **确认 · 非返工**（核心 Blocking 应已在 Reality Closure 清完）
       若仍不断发现核心问题 ⇒ Closure 未完成 · 退回 Wave/PCR · 禁边确认边修债
       + Owner Sign-off（**PSG-W5 Owner Time-Separated Review** · ≠ **Reality-W5 UI/UX Closure**）

阶段7  **Staging-grade / Testnet Production GO**（fly.dev · Scope A）
       ≠ ③ Public/Mainnet Production GO（另闸）
```

**相对你草案的修正（成熟度关键）：**

| 点 | 裁决 |
|----|------|
| 总序 Project A → Reality → Delta → Recalculate → Readiness → GO | **正确** |
| Formal Baseline **之后**才查 L1–L5 residual | **正确** |
| Project A **内**已有 S7 Recalculate（在 Baseline **前**） | **必须保留** · 见 FG15B Standby |
| 阶段2 | = **状态检查/鉴证** · 不是第二次完整 Recalculate |
| 阶段5 | = **Post-Reality Recalculate** · Complete 翻转点 |
| Baseline 当天 `psg_complete=true` | **通常错误** |
| 再加 Gate/框架 | **不需要 · 已成熟** |

```text
等窗 · STEADY_MAINTAIN_ONLY
  ❌ 不改码 · 不部署 · 不扩流程/审计
  ✅ Maintain 护 Candidate
```

**总闸脚本：** `check-reality-closure-gate.sh` · `check-production-feature-inventory-gate.sh`

**禁止本阶段：** 改 Candidate · 部署 · 修 Auth/CMS/DB · 插队 L5/S7 · 把 Reality 修塞进 Final Closure · 武装假 PASS · **再发明新 Gate**。  
**允许本阶段：** Maintain · 上述「最多还可做」三项 · 然后停。

**输入审计（只读）：**  
[Implementation Reality Mapping](./TT-PRODUCTION-IMPLEMENTATION-REALITY-MAPPING-AUDIT-DRY-RUN-LATEST.md) ·  
[Production Reality Consistency](./TT-PSG-PRODUCTION-REALITY-CONSISTENCY-AUDIT-DRY-RUN-LATEST.md) ·  
[Discovery Freeze](./TT-WAIT-ETA-DISCOVERY-FREEZE-LATEST.md)

**等窗高价值准备（只读 · 已冻结预备）：**  
[Feature Inventory · Deep](./TT-PRODUCTION-FEATURE-INVENTORY-LATEST.md) ·  
[Feature Inventory Gate](./TT-PRODUCTION-FEATURE-INVENTORY-GATE-LATEST.md) ·  
[DB Production Audit · P0/P1 LOCK](./TT-DATABASE-PRODUCTION-READINESS-AUDIT-LATEST.md) ·  
[Wave 0–7 Acceptance](./TT-REALITY-CLOSURE-WAVE-ACCEPTANCE-LATEST.md) ·  
[Hygiene Classification Plan](./TT-DOCUMENT-HYGIENE-CLASSIFICATION-PLAN-LATEST.md) ·  
[Auth Design Prep](./TT-AUTH-PRODUCTION-DESIGN-PREP-LATEST.md) ·  
[CMS Design Prep](./TT-CMS-PRODUCTION-GOVERNANCE-DESIGN-PREP-LATEST.md) ·  
[UI Checklist](./TT-UI-UX-PRODUCTION-AUDIT-CHECKLIST-LATEST.md) ·  
[**Staging Old-Runtime Multi-Dim Checklist**](./TT-STAGING-OLD-RUNTIME-MULTI-DIM-CHECKLIST-LATEST.md)（测试网旧态全表 · 只读） ·  
[**W0 Alignment Checklist**](./TT-W0-RUNTIME-ALIGNMENT-CHECKLIST-LATEST.md)（对拍表 · PREP · 不 deploy） ·  
[Owner Input Confirm](./TT-OWNER-INPUT-CONFIRM-WAIT-ETA-LATEST.md)（已收集 · 不激活） ·  
[**Order×PSG Residual Risk**](./TT-POST-ETA-ORDER-PSG-RESIDUAL-RISK-LATEST.md)（满窗过宣称防护） ·  
[**Post-Baseline Enterprise Maturity**](./TT-POST-BASELINE-ENTERPRISE-MATURITY-PLANNING-LATEST.md)（Sec/SRE/BizOps · PLAN_FROZEN · 入 W3/W4/W6） ·  
[**Reality Closure Execution Prep**](./TT-POST-BASELINE-REALITY-CLOSURE-EXECUTION-PREP-LATEST.md)（R1–R11 → P0/P1/P2 → 既定梯子 · **非新框架** · **§0.2 Owner 域名 ACCEPT + 统一签字** · **§0.4 Gap Register**） ·  
[**Production Gap Register**](./TT-PRODUCTION-GAP-REGISTER-LATEST.md)（A Blocking / B Accepted / C Post-GO · **文档非 Gate** · 签字 Sebastian Ward） ·  
[**KYC Product Scope Alignment**](./TT-KYC-PRODUCT-SCOPE-ALIGNMENT-LATEST.md)（USDC+TTG · KYC NOT_REQUIRED · 防脏口径 · W6 治脏队列） ·  
[**Project Score Uplift Plan**](./TT-PROJECT-SCORE-UPLIFT-PLAN-LATEST.md)（可补全维 → W0–W7/Post-GO · 真实完成抬分 · 市场另轨） ·  
[**CMS Content QA In-Process**](./TT-CMS-CONTENT-QA-IN-PROCESS-LATEST.md)（QA=用户可见 L5 内容六维 · 生产级轨 B · 多国未齐须诚实）


**Candidate Evidence = Frozen Truth** — 等窗禁止修 Auth/CMS/schema、Fly deploy、Staging SHA、S7、Registry PASS。

---

## 0 · 最终模型说明（与「是否覆盖一切」）

| 轨 | 负责 | 不负责 |
|----|------|--------|
| **PSG** | 认证版本成立（Formal Baseline / L1–L5 定义） | 单独宣布 **Staging-grade GO** 或 ③ Mainnet GO |
| **Reality Closure** | 系统一致性（十维同钉 · 认证=运行） | 93 叶穷举 |
| **Feature Inventory** | 功能真实性（八问 · 九域） | 每路由弹窗权限交叉 |
| **DB Audit / Wave Acceptance** | 执行清单与验收四件套 | 新 Gate |
| **93 / 96-20 / R-002** | 全站矩阵 / 页面对齐 / 回归准入（**并行真源**） | 被 Reality 替代 |

```text
本规划 = 生产真实闭环梯子
≠ 全站功能穷举
≠ PSG Complete% 自动拉满（仍看 L1–L5 定义）
≠ Production GO
```

---

## 0.1 · 根因机制（为什么「修过又出现」· LOCKED）

**不是单一 bug**，而是过去缺 **多维同钉**：

```text
旧习惯                         企业生产标准（本规划）
代码修复                         PSG版本
  ↓                              = 代码版本
测试通过                         = Migration版本
  ↓                              = 数据库状态
部分文档更新                     = 部署版本
  ↓                              = Runtime状态
认为完成                         = 文档状态
                                 = Evidence状态
                                 = 用户体验
                                 = 运维能力
```

过去缺的是**最后这条等式** → 于是「认证 A、运行 B」「代码在、闭环无」「表在、生命周期无」会反复冒充完成。

### 四类问题（已清 · 对号入座）

| 类 | 本质 | 例 | 处置 |
|----|------|-----|------|
| **1 · OLD_RUNTIME** | Local/Candidate **X** Staging | SHA 不一致 · Web/Worker 未证 · FactoryV2=null · SR 缺 · FeeRouter≠ · Treasury null · Indexer=0 | **不是重做** → Formal Baseline → **W0** Alignment → Version Gate → Deploy Identity → Runtime Certification |
| **2 · NOT_PRODUCTION_READY** | 代码/模块在 · **生产闭环无** | Auth：tokens/Resend/Reset 在，但 Register→Send→Verify→Activate→Audit 未闭（**已排除「仅因 Staging 旧」**） | **W1** |
| **3 · 运营/数据生命周期** | 有数据展示 ≠ 运营系统 | CMS 缺 Review→Approve→Publish→Version→Rollback→Audit · fallback 假绿 · 错键 | **W2** |
| **4 · DB 三层** | migration 在 ≠ 系统完成 | Schema / **真调用** / lifecycle（soft-delete·audit·backup·idempotency·concurrency） | **W4**（先 W0 attest） |

**清单真源（不新开闸）：** [Staging Multi-Dim](./TT-STAGING-OLD-RUNTIME-MULTI-DIM-CHECKLIST-LATEST.md) · [Feature Inventory](./TT-PRODUCTION-FEATURE-INVENTORY-LATEST.md) · [DB Audit](./TT-DATABASE-PRODUCTION-READINESS-AUDIT-LATEST.md)

### Delta Recertify 位置（LOCKED · 不是「重新认证一下就好」）

```text
发现问题
  → 分类（OLD_RUNTIME / TRUE_FEATURE_GAP·NOT_READY / DATA / DOC / OPS）
  → 对应 Wave 修复（W0–W6）
  → Version Gate
  → Runtime 验证
  → Delta Recertify（= W7 · 证明修复后仍十维一致）
  → Feature Inventory Gate + Reality Closure PASS
  → Production Readiness
  → Staging-grade / Testnet Production GO
  → （另闸）③ Public/Mainnet Production GO
```

| Delta 是 | Delta 不是 |
|----------|------------|
| 修复后的**复查** | 治疗 / 替代 W0–W6 |
| 证明「改完后等式还在」 | dry-run 一跑就 ALL_READY |
| W7 固定台阶 | 发现问题后的第一反应 |

**当前最关键 = W0（地基）：** tip `652bbab5` ≠ Staging `f8181b63`。不先 W0，任何 Auth/CMS/DB「绿」都可能测的是旧 API → **假绿**。

**Auth 单排 W1：** 已排除「仅 Staging 旧」；现行 Generate→log→verified ≠ Pending→Token→Email→Verify→Activate→Audit→Session。  
**CMS 抬 W2：** 运营系统，不是「表里有 N 条 = 完成」。  
**DB Audit：** Schema ≠ Behavior ≠ Lifecycle ≠ Reliability ≠ Concurrency。

### 关键生产风险（已锁定）

| Pri | 项 | 要点 |
|:---:|-----|------|
| **P0** | **W0 Runtime Alignment** | tip `652bbab5` ≠ Staging `f8181b63` → UI/API/Money Path 易假绿 · **Reality Closure 入口** |
| **P1** | **Auth（W1）** | 非「redeploy 即可」· 须 Pending→OTP→邮件→验证→Activate→Audit→Session · 并补 Reset/Email Change/revoke/Rate Limit/Audit |
| **P1** | **DB（W4）** | 禁「migration 有了=完成」· Schema→Behavior→Lifecycle→Reliability→Concurrency |
| **P2** | **CMS（W2）** | **Content Operation System** · Create→Review→Approve→Publish→Version→Rollback→Audit |

### 等待期（写死 · 停止扩展）

| 只做 | 禁止 |
|------|------|
| Maintain（Integrity · Catalog · Freshness · ETA） | ❌ 新 Gate / Framework / Registry |
| 完善已有清单备注（Inventory · DB · W0 对拍字段） | ❌ 大量文档重写 · 改代码 · redeploy |
| 心里固定满窗梯子（下节） | ❌ 破坏 Candidate Frozen Truth · ❌ 拿 Delta dry-run 冒充已修 |

---

## 1 · ETA 后正确顺序（两阶段 · LOCKED）

### 第一阶段 · 完成当前 PSG（Project A）

```text
Settlement finalize
  → Bridge A
  → Manifest
  → Baseline Gate
  → FG Capture
  → L5 Final
  → S7
  → Formal Baseline
```

**本阶段验收：** Candidate Formal Baseline 成立 · **仍允许** Staging/Auth/CMS Reality 未对齐（已知 · 不假装齐）。

### 第二阶段 · Reality Closure（≠ 马上 Production GO）

```text
W0 Runtime Alignment          ← 地基 · 先消旧系统
  → W1 Auth                   ← 真改生产闭环
  → W2 CMS                    ← 运营生命周期
  → W3 Security / User / Admin
  → W4 DB + Ops
  → W5 UI/UX
  → W6 Hygiene
  → W7 Delta Recertify        ← 仅复验 · 非治疗
  → Inventory Gate + Reality Closure PASS
  → Production Readiness
  → Staging-grade / Testnet Production GO
  → （另闸）③ Public/Mainnet Production GO
```

**每 Wave 微梯子（写死）：** 分类 → PCR 修复 → Version Gate → Runtime 验证 →（全部 W0–W6 齐后）才进 W7 Delta。

**第二阶段验收：** 十维同钉（§3）+ Inventory 第 8 问可武装 + **`REALITY_CLOSURE_PASS`** → Readiness（另闸 · ≠ GO）。

---

## 2 · 发现项 → Post-Baseline PCR 映射

| Wave | Stream | Reality 主类（Mapping） | 代表 PCR |
|:----:|--------|-------------------------|----------|
| **0** | Runtime Alignment | OLD_RUNTIME · tip≠Staging · Web3 投影 | `PCR-STAGING-ALIGN-CAND-V2` · `PCR-WEB3-RUNTIME-IDENTITY` · Schema attest 附录 |
| **1** | Auth Harden | NOT_PRODUCTION_READY · NOT_REGISTERED · orphan | `PCR-AUTH-*` · `PCR-SEC-SESSION-REVOKE` |
| **2** | CMS Governance | OLD_DATA · CMS 运营闭环 | `PCR-CMS-GOV-*` |
| **3** | Sec / User / Admin | TRUE_MISSING / NOT_READY | `PCR-SEC-*` · `PCR-USER-GDPR-*` · `PCR-ADM-*` |
| **4** | DB + Ops（Ops 抬升） | lifecycle · Outbox · Incident/Recovery/Release | `PCR-DATA-*` · `PCR-OPS-RUNTIME\|INCIDENT\|RECOVERY\|RELEASE` · `PCR-ONB-*` |
| **5** | UI/UX Production | 闭环 · 非重设计 | `PCR-UI-PROD-CLOSURE` · Pay/Escrow UX |
| **6** | Hygiene | DOCUMENT_DRIFT | `PCR-HY-*` |
| **7** | Delta Recertify | 复验十维同钉（**非治疗**） | 独立 Recertify 包 · ≠ 改写 CAND-V2 Archive · ≠ 跳过 W0–W6 |

**车辆（每 Wave 0–6）：** 分类 → PCR 修复 → Version Gate →（W0）Deploy Identity → Runtime 验证 → **新** Evidence 根。  
**W7：** 仅在 W0–W6 齐后 · 证明修复后仍一致 · 再武装双闸。  
**禁止：** 裸 `fly deploy` · 污染 `PSG-REL-20260720-WEB3-CAND-V2` 冻结 Archive · **发现问题就先跑 Delta**。

详表：[Post-Baseline Backlog](./TT-POST-BASELINE-INDEPENDENT-BACKLOG-LATEST.md)

---

## 3 · 一致性验收清单（Code=…=PSG=Ops）

Formal Baseline **之后**、宣称 Reality Closure / 生产准备前，须逐项可证：

| # | 维 | 验收问题 | 通过标准（摘要） |
|---|-----|----------|------------------|
| 1 | **PSG Certification** | Active pin / Formal Baseline 证据？ | CAND-V2 Formal Baseline 已钉 · 未假 Complete |
| 2 | **Code** | Local/Release SHA？ | = Formal Baseline / 对齐后 tip |
| 3 | **Migration** | checksum / 已应用？ | 与 Code tip 一致 |
| 4 | **Database** | Schema+行为生命周期？ | 表被真路径使用 · Outbox/idempotency/backup 武装策略明确 |
| 5 | **Deploy** | Fly/Image SHA？ | = Code tip（经 Version Gate） |
| 6 | **Runtime** | `/meta` · 合约投影 · Indexer？ | = Candidate Identity · 非旧 Factory |
| 7 | **Document** | 活 Runbook/Registry？ | ACTIVE= tip · 无 `09c72b93` 冒充当前 |
| 8 | **Evidence** | 证据根引用 SHA？ | 新 Reality 证据 · 非旧 Evidence 证新 Runtime |
| 9 | **User Experience** | Auth/CMS/UI 生产闭环？ | 无 Generate→log→verified 假闭环 · 无静默假绿 |
| 10 | **Operations** | Runtime+Incident+Recovery+Release+Governance？ | 非仅 Owner 字段 · 可观测+可恢复+可审计 |

```text
任一维 FAIL ⇒ Reality Closure 未完成 ⇒ 禁止宣称「认证=运行」
全部 PASS ⇒ 可进入 Production Readiness 另闸（仍 ≠ 自动 Production GO）
```

---

## 3a · Production Feature Inventory Gate {#production-feature-inventory-gate}

**为何单开闸：** 这两天最大发现是 **「代码存在 ≠ 功能完成」**。十维同钉之外，必须有一张 **Feature Reality Matrix**，避免再次出现「这个功能不是以前做过吗？」。

**SPEC：** [TT-PRODUCTION-FEATURE-INVENTORY-GATE-LATEST](./TT-PRODUCTION-FEATURE-INVENTORY-GATE-LATEST.md)  
**Matrix：** [TT-PRODUCTION-FEATURE-INVENTORY-LATEST](./TT-PRODUCTION-FEATURE-INVENTORY-LATEST.md)  
**脚本：** `bash scripts/gates/check-production-feature-inventory-gate.sh`

### Feature Reality Matrix · 八问（每功能必答）

| # | 问 | 否决假完成 |
|---|-----|------------|
| 1 | **Code exists?** | 有文件 ≠ 热路径 |
| 2 | **Migration exists?** | 有 SQL ≠ 已应用于 Staging tip |
| 3 | **DB used?** | 有表 ≠ 路由真读写（反孤儿） |
| 4 | **API closed?** | 有 handler ≠ 生产闭环 |
| 5 | **UI closed?** | 有页 ≠ 无 stub/假按钮 |
| 6 | **Test exists?** | 有测 ≠ 生产探针 |
| 7 | **Evidence exists?** | 有旧证据 ≠ 证当前 Runtime |
| 8 | **Production Ready?** | 仅当 1–7 生产级全真 |

### 必覆盖域

`Auth` · `CMS` · `Market` · `Order` · `Escrow` · `Payment` · `Settlement` · `Admin` · `Governance`

### 闸位

```text
Formal Baseline
  → W0–W7（并行：系统同钉证据 + Matrix 八问）
  → Delta Recertify
  → check-production-feature-inventory-gate.sh   （功能真实性）
  → check-reality-closure-gate.sh                （系统一致性）
  → Production Readiness Review → Staging-grade GO（≠ ③ Mainnet）
```

**禁止再增 Gate。** Inventory 与 Reality 为 Formal Baseline 下双轨，在 Delta 汇合。

等窗预期：`MATRIX_OK` + `NOT_ALL_READY`（exit 0）· **禁止**把第 8 问全部改 true 冒充 PASS。

---

## 4 · 等窗行为（现在 · 唯一建议 · STEADY STATE）

```text
WAIT_ETA 低频 Maintain
  · Integrity · Catalog · Freshness · ETA Gate
  · 不改 Candidate · 不修 Auth/CMS/DB · 不 redeploy
        ↓（满窗）
Project A
  Settlement finalize → Bridge A → Manifest → Baseline Gate
  → FG Capture → L5 Final → S7 → Formal Baseline
        ↓
Reality Closure（已冻结清单 · 不提前执行）
  Wave 0 Runtime Alignment   ← 必须先做（消「认证 A / 运行 B」）
  → Wave 1 Auth
  → Wave 2 CMS
  → Wave 3 Sec/User/Admin（+ Security Governance）
  → Wave 4 DB + Ops（+ SRE Lifecycle）
  → Reality-W5 UI/UX Closure
  → Wave 6 Hygiene（+ BizOps 文书）
  → Wave 7 Delta Recertify（+ 三成熟度布尔）
  → check-production-feature-inventory-gate.sh
  → check-reality-closure-gate.sh → REALITY_CLOSURE_PASS
  → Production Readiness Review（另闸）
```

| 做 | 不做 |
|----|------|
| **Maintain** + Integrity + Catalog + Freshness + **ETA Gate** | ❌ 修 Auth |
| 保留已冻结 Reality Closure Gate + Wave 0–7 PCR + **Feature Inventory Gate** | ❌ 修 CMS |
| `check-reality-closure-gate.sh` → 预期 **NOT_ARMED** | ❌ 改 DB |
| `check-production-feature-inventory-gate.sh` → **MATRIX_OK** + **NOT_ALL_READY** | ❌ 第 8 问假 READY |
| | ❌ 重新部署 / 改 Candidate pin |
| | ❌ 提前 L5/S7 / 假武装 PASS |
| | ❌ Formal Baseline 前跳过 Wave 0 |
| | ❌ **再发明新 Gate** |

**原因：** 等窗修复会造成「修复版本没有认证」；须 Formal Baseline → Independent PCR → Delta Recertify → **总闸**。  
**Wave 0 优先：** 未 Alignment 前，任何 Staging 修复/测试可能仍是假绿。

---

## 5 · 诚实边界

```text
Formal Baseline ≠ Reality Closure ≠ REALITY_CLOSURE_PASS ≠ Production Readiness ≠ Staging-grade GO ≠ ③ Mainnet Production GO
**Readiness = 确认非返工** · Closure 后大规模修债 = Closure 未完成（退回 W0–W7）· 见 [Execution Prep §0.1](./TT-POST-BASELINE-REALITY-CLOSURE-EXECUTION-PREP-LATEST.md)
PSG PASS ≠ 十维同钉 ≠ Feature Inventory 第 8 问 YES
代码存在 ≠ 功能完成
本规划 ≠ 93/96 穷举 ≠ PSG Complete% 自动满
禁止文档假装完成 · 禁止再发明新 Gate
```

---

## 6 · 93 / 96-20 / R-002 映射（轻量 · 非新闸 · 然后停止）

**目的：** 标明 Reality/Inventory **不替代**全站矩阵；需要穷举时走既有真源。

| 真源 | 管什么 | 与本规划关系 |
|------|--------|----------------|
| **[93](../spec/93-全站功能验证矩阵-域别回归清单.md)** | 域能力与回归用例（叶批次） | Inventory 九域 ⊆ 高信号子集；全站叶仍按 93 tracker |
| **[96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)** | 路由/页面对齐盘点 | W5 UI 抽验指针；≠ 每页已在 Wave 穷举 |
| **[R-002](../spec/R-002-回归执行闭环与发布准入.md)** | 回归执行与发布准入 | Readiness/GO 前回归包；`report.json` 窄切片 ≠ 全矩阵 GO |
| **[TT-9628 §0.0](./TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary)** | 覆盖边界（矩阵≠穷举） | 与本 §0「不负责穷举」同键 |

```text
等窗：只保留本映射表 · 不新开 93 工程 · 不新开 Gate
满窗后若要全站穷举：在 Reality Closure 之外另开 93/R-003 轨 · 勿塞进 Candidate Final Closure
```

---

**机读：** [`TT-POST-PSG-REALITY-CLOSURE-PLANNING-LATEST.json`](./TT-POST-PSG-REALITY-CLOSURE-PLANNING-LATEST.json)  
**总闸脚本：** `scripts/gates/check-reality-closure-gate.sh`  
**功能闸脚本：** `scripts/gates/check-production-feature-inventory-gate.sh`
