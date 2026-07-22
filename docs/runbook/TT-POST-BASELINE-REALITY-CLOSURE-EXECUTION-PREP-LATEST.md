# TT · Post-Baseline Reality Closure · Execution Prep（绑定 · 非新框架）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> tip `652bbab5` / RUNNING / wait-window wording below = **SUPERSEDED_SNAPSHOT** · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`.


**Machine:** `TT_POST_BASELINE_REALITY_CLOSURE_EXECUTION_PREP`  
**Status:** `SUPERSEDED_SNAPSHOT` · `EXECUTION_PREP_FROZEN` · `GOVERNANCE_CLOSED` · `NO_CODE` · `NO_DEPLOY` · `NO_CANDIDATE_MUTATION` · `NO_NEW_FRAMEWORK` · `NO_NEW_PROCESS_DOCS`  
**Recorded:** `2026-07-20` · **Governance close:** `2026-07-21`  
**Pin（冻结）：** `PSG-REL-20260720-WEB3-CAND-V2` · tip `652bbab5…`  

```text
【运营口令 · LOCKED · Owner 2026-07-21】
  等窗：
    Maintain = 保持稳定 · 防止漂移
    并行 = Content QA + 明确 Owner 决策
    禁止 = 新增流程 · 重构治理 · 扩文档 · 改码/deploy/finalize
  时间窗结束后：
    不新增流程 · 不重构治理
    直接切换 → Project A
    然后严格串行既定工程主线：
      Reality-W0 → W1 → W2 → Reality-W3 → W4 → Reality-W5 → W6 → W7
      → Delta Recertify → Readiness → Staging-grade GO
  ≠ ③ Mainnet Production GO（另闸）
```

**父 SSOT（唯一梯子）：** [TT-POST-PSG-REALITY-CLOSURE-PLANNING-LATEST](./TT-POST-PSG-REALITY-CLOSURE-PLANNING-LATEST.md)  
**输入清单：** [TT-POST-ETA-ORDER-PSG-RESIDUAL-RISK-LATEST](./TT-POST-ETA-ORDER-PSG-RESIDUAL-RISK-LATEST.md)（R1–R11）  
**Wave 验收：** [TT-REALITY-CLOSURE-WAVE-ACCEPTANCE-LATEST](./TT-REALITY-CLOSURE-WAVE-ACCEPTANCE-LATEST.md)  
**成熟度流（入 W3/W4/W6 · 非新闸）：** [TT-POST-BASELINE-ENTERPRISE-MATURITY-PLANNING-LATEST](./TT-POST-BASELINE-ENTERPRISE-MATURITY-PLANNING-LATEST.md)

```text
本文件只做一件事
  把 Residual Risk + 已发现生产债
  按 P0 / P1 / P2 钉进既定梯子
  Project A → Reality-W0–W7 → Delta → Reality Closure Gate → PSG Recalculate
  → Readiness → Staging-grade GO（≠ ③ Mainnet Production GO）

禁止
  ❌ 新增 Gate / Framework / 平行路线
  ❌ 改 Candidate / ETA / L5 / S7（等窗）
  ❌ 等窗改码 · redeploy · 假 PASS
  ❌ 把本准备冒充已执行 / Reality PASS / Staging-grade GO / ③ Production GO
  ❌ 用 P0–P4 影响序替代串行执行序
```

---

## 0 · 简化闭环（LOCKED · 与用户图同源）

```text
现在
  Maintain + 等窗

满窗
  Settlement → L5 Final → S7 Recalculate #1 → Formal Baseline

之后（Reality Closure · **固定串行序** · 禁止按 P 级跳 Wave）
  Reality-W0 版本对齐（Runtime Alignment · 架构抬分起点）
    ↓ W1 Auth
    ↓ W2 CMS（工程治理 · ≠ 多国 Content QA 清零）
    ↓ Reality-W3 Security / User / Admin（+ Security Governance · ≠ C-09）
    ↓ W4 DB / Ops / SRE
    ↓ Reality-W5 UI/UX Closure（≠ PSG-W5 Owner Time-Separated Review）
    ↓ W6 文档治理（+ BizOps 文书）
    ↓ W7 Delta Recertify

最终
  Reality Closure PASS
  → PSG Recalculate #2（仅当层证据支持才可能 psg_complete=true）
  → Production Readiness（**确认 · 非返工**）
  → Gap Register（A-02/03/04 禁 TBD）
  → PSG-W5 Owner Time-Separated Review → Owner Sign-off
  → Staging-grade / Testnet Production GO
  → ③ Public/Mainnet Production GO（另闸）
```

### 0.1 · Readiness = 确认 · 非返工（LOCKED · Owner 2026-07-20）

```text
理想路径（写死）
  Reality Closure PASS → PSG Recalculate → Production Readiness
    → PSG-W5 Owner Time-Separated Review → Owner Sign-off
    → Staging-grade / Testnet Production GO
    → （另闸）③ Public/Mainnet Production GO

禁止路径
  Reality Closure PASS → 又修几十个核心问题 → 再跑一遍

Reality Closure 的价值
  尽可能清完：历史漂移 · 版本不一致 · 运行时遗留 · 证据缺失 · 功能 NOT_READY
  → 让 Readiness 主要做确认（清单/签字/生产入口核对）
  → 而不是大规模技术返工

若 Readiness / Sign-off 前仍不断冒出核心 Blocking 问题
  ⇒ 判定 = Closure 未真正完成（或漏纳入 W0–W6）
  ⇒ 处置 = 退回 Reality Closure / 开 PCR 补进对应 Wave + 必要时重跑 W7 Delta
  ⇒ 禁止 = 在 Production Readiness 里当「边确认边修债」
  ⇒ 禁止 = 把未闭核心债伪装成 Non-blocking 硬闯 GO

可留在 Readiness/GO 另闸（非 Closure 漏项）的例子
  · 主网 OWNER_INPUT（vesting 参数 · 钱包激活）— **主网前**；Staging 周期可不挡 Closure
  · 第三方实审/赏金上线等已书面分期项
  · 品牌自定义域名（本周期 **ACCEPT Staging fly.dev** · 品牌域 DEFERRED）
  · 生产 PSP live / 主网 TLS 品牌域 — 主网另闸

### 0.2 · Owner 范围绑定（LOCKED · 2026-07-20 · 非新框架）

**统一签字人（全流程）：** Sebastian Ward（塞巴斯蒂安·沃德）  
**适用：** Self Review · Formal Baseline · Wave Evidence 戳 · Reality Closure · Recalculate 接受 · Production Readiness · **PSG-W5 Owner Time-Separated Review** · Owner Sign-off · **Staging-grade GO**（及另闸 ③ Mainnet Production GO）  
**≠** **Reality-W5 UI/UX Closure** · **≠** 持牌法务替换 08-4 对外口径前的法律意见。  
**禁：** 只说「W5 完成」（[Uplift §5](./TT-PROJECT-SCORE-UPLIFT-PLAN-LATEST.md)）。

**本周期运营域名：**

| 面 | URL | 裁决 |
|----|-----|------|
| Web | `https://tt-web-staging.fly.dev/` | **ACCEPT · 本周期生产准备表面** |
| API | `https://tt-api-staging.fly.dev` | **ACCEPT** |
| **品牌自定义域** | — | **DEFERRED** · 不挡梯子 |
| **结算货币** | **USDC + TTG** | **LOCKED** · 交易/托管 USDC · 治理 TTG · **非法币** |
| **KYC** | **NOT_REQUIRED** | **LOCKED** · 不进 PSG/Reality 必闭 · 不挡 GO |

#### 原「流程外」项 → 落点（合理挂载 · 不扩 Gate）

| 项 | 挂到哪里 | 说明 |
|----|----------|------|
| Staging 域名 ACCEPT | **Readiness 确认项** + Owner Input | 已决 · 勾选即可 |
| 统一签字 Sebastian Ward | **PSG Solo · 全阶签字栏** | Formal Baseline / W7 / Readiness / Sign-off / GO |
| Vesting 参数 · 钱包主网激活 | **主网 / Genesis 另闸**（③） | 不塞 W0–W6；**不挡** Staging Reality |
| PSP **test** 模式确认 | **Readiness** | **USDC-only：** 确认无非法币收款路径；法币 PSP live = Out of Scope |
| Threat/PenTest/**实审计划** | **W3** | 已在 Enterprise Maturity |
| 实审执行 · 赏金上线 · 渗透实战 | **Post-GO 分期**（Owner 书面） | 计划在 W3 · 执行不挡 Staging GO |
| Evidence Retention | **W4 + W6** | 已挂 |
| 93 / 96-20 全叶穷举 | **并行可选轨**（Reality **后**或并行） | **不替代** Closure；不塞 Candidate |
| CMS Content QA / 多国 CLOSED | **CMS Operation 并行主线** | ≠ PSG Reality；Country CLOSED 自轨 |
| OAuth / 用户 2FA（若未本版承诺） | **Backlog / ADR** · 非 Closure 必闭 | Owner 写入本版才进 W3 |
| 持牌法律意见 | **对外募资/监管前另聘** | Solo 工程自证保留诚实边界 |

```text
本周期目标口径（写死）
  Reality → Recalc → Readiness（确认 Staging 面 + 签字）
  → Sign-off（Sebastian Ward · 时间分离）
  → Staging-grade / Testnet Production GO（运营面 = fly.dev Staging）
  ≠ 自动主网 GO ≠ 品牌域已上 ≠ 资金轨已激活
```

### 0.3 · 其余生产级缺口 · 挂载裁决（LOCKED · 建议已采纳口径 · 非新框架）

**总原则（总设计师）：**

| 放法 | 何时用 |
|------|--------|
| **挂进 Reality Wave** | 工程可修 · 会影响十维同钉 / 功能 NOT_READY |
| **挂进 Readiness / OA（人控）** | 必须 Owner 账号/真机/密钥 · **不进** PSG L1–L5 层公式 |
| **保持并行轨** | CMS Content QA / Ambient · **不替代** PSG · Readiness **记实** · **生产级内容宣称**走 [轨 B](./TT-CMS-CONTENT-QA-IN-PROCESS-LATEST.md) |
| **Post-GO / ③ 另闸** | 主网 · live PSP · 法务 · 实审执行 · 品牌域 |
| **禁止** | 塞进 Candidate / FG-15-B / S7 分子 · 新开 Gate · 用 Content QA 冒充 PSG Complete |

#### A · 建议挂进流程（不进 PSG 认证核）

| 项 | 挂载 | 挡 Staging-grade GO？ |
|----|------|----------------------|
| **真邮件外发**（Resend/SES · 非 log） | **W1**（Auth 生命周期已含）· Readiness 抽验一封 | **是**（Auth 生产闭环需要） |
| **OA-01 WC Project ID** | **Readiness / OA 人控**（绑 `tt-web-staging.fly.dev`） | **由本周期 Release Scope 决定**（见 §0.3.1） |
| **OA-02 真机四卡** | **Readiness → Sign-off 前**（锁 OA-01） | **同上 · Scope 驱动** |
| **PSP test 模式确认** | **Readiness** | **USDC-only：** 确认无非法币路径 · 法币 live Out of Scope |
| **Incident Runbook 非 DRAFT** | **W4**（SRE 已挂） | **是**（sre_lifecycle） |
| **Evidence Retention** | **W4+W6** | 已挂 |
| **Staging Patch 纪律** | **W0 Dual-track**（禁裸塞认证 Staging） | 纪律项 · 非单独产品债 |

#### 0.3.1 · Release Scope → GO Blocking（LOCKED · Owner 2026-07-20）

```text
原则（写死）
  GO Blocking 由「本次 Release Scope」决定
  ≠ 由「仓库里有没有这个功能」决定

  未纳入本次发布范围的能力
    → Owner Accepted Gap（书面）
    → 不进 PSG L1–L5 分子
    → 不污染 Reality Closure 必闭集
    → 扩大范围时只加 Scope + 对应 Blocking · 不推翻梯子
```

| 本周期 Release Scope（二选一 · Owner 勾选） | OA-01 Project ID | OA-02 真机 WC | Staging-grade GO |
|--------------------------------------------|------------------|---------------|------------------|
| **A · Injected Wallet Only**（MetaMask 等浏览器扩展 · **不宣称** WC/移动钱包登录或支付） | **Owner Accepted Gap** · 不挡 | **Owner Accepted Gap** · 不挡 | 可过（其余闸仍过） |
| **B · 宣称 WalletConnect / 移动钱包**（登录或支付） | **GO Blocking** | **GO Blocking** | 未过 OA-01/02 ⇒ **禁 GO** |

**纪律：**

- Scope **A** 时：对外文案 / Readiness / GO 包 **禁止**写「支持 WalletConnect / 扫码移动钱包」；UI 可保留入口但须标 **不可用/未配置** 或隐藏 · **禁假绿**。
- Scope **B** 时：OA-01 → OA-02 为人控硬链；仍 **不**写入 PSG L1–L5 公式（属 Readiness/GO 发布范围闸 · 非认证层）。
- 切换 A→B：只更新本表 + Owner 签字 · **重跑 OA** · **不**重开 Candidate / 不推翻 W0–W7。
- **本周期当前勾选：** **`A · Injected Wallet Only`**（LOCKED · Owner 2026-07-20 · Sebastian Ward）  
  - WalletConnect / 移动钱包 = **Owner Accepted Gap**（OA-01 / OA-02 不挡本次 Staging-grade GO）  
  - 下一阶段（Mainnet / **Scope B**）再完成 WC 激活与真机验证  
  - 对外文案 **禁止**宣称本次已交付 WalletConnect / 扫码移动钱包

#### B · 建议保持并行 · Readiness 只「状态确认」

| 项 | 挂载 | 挡 Staging-grade GO？ |
|----|------|----------------------|
| CMS 多国 Content QA / Country CLOSED | **CMS Operation 并行** | **默认否** · Readiness 记「哪些国 OPEN」· Owner 可升为挡板 |
| Ambient SLA / Owner accept | **并行 HOLD** | **默认否** · 同上 |
| Hotel/Transport/Video 波次 | **CMS 资产流水线** | **否** |
| 93 / 96-20 全叶 | **并行可选** | **否** |

#### C · 不进 PSG 层 · 不进 Closure 修债 · 另闸

| 项 | 挂载 |
|----|------|
| OA-04 生产密钥 / DNS / R2 / **法币 PSP live** | **Out of Scope（USDC-only）** · 若未来改接法币再开 ③ |
| Vesting · 钱包激活 · 真 ETH | **③ Genesis** |
| 实审执行 · 赏金上线 · 渗透实战 | **Post-GO 分期**（计划仍在 W3） |
| 持牌法务 · OFAC 真名单工程化 | **对外募资/监管前** |
| GitHub Actions 计费恢复 | **工程旁路** · 本地 §6.5 已替代 · **不挡** GO |
| 生产 Pager | **OWNER_DEFERRED** · W4 可记 Non-blocking ACCEPT |
| OAuth / 用户 2FA | **ADR/Backlog** · Owner 写入本版才进 W3 |
| **KYC 厂商核身** | **NOT_REQUIRED LOCKED**（USDC+TTG · 非法币）· **禁止**写入 PSG Complete / Reality PASS 条件 |

```text
推荐形状（写死）
  PSG 核：只做 Candidate · Baseline · L1–L5 · Recalc（别塞 WC/CMS国/法务）
  Reality：工程债 + 真邮件 + SRE Runbook（WC 不进必闭集 · 除非 Scope B 另轨人控）
  Readiness：域名已 ACCEPT · USDC-only 确认 · Release Scope A → OA-01/02 Accepted Gap
  并行：Content QA 继续跑 · 不挡也不冒充 Complete
  ③/Post-GO：live 密钥 · 主网 · 法务 · 实审执行

  GO Blocking = f(Release Scope) · 非 f(功能是否存在)
```

### 0.4 · Production Gap Register（LOCKED · 文档 · 非 Gate）

**SSOT：** [TT-PRODUCTION-GAP-REGISTER-LATEST](./TT-PRODUCTION-GAP-REGISTER-LATEST.md)

```text
Readiness
  → 维护 / 引用 Gap Register
       A Blocking（必须 0 OPEN）
       B Owner Accepted Gap（Sebastian Ward 签字）
       C Post-GO Commitments（有计划 · 不挡本次）
  → Sign-off（时间分离）
  → Staging-grade GO 声明：Blocking=0 · Accepted 已签 · Post-GO 已登记
```

**不进** PSG L1–L5 · **不进** Reality Closure 必闭集 · **不新开** Gate 脚本。  
「监控采购」= 以后要不要开 Sentry 等云账号（Solo 可 Post-GO 再定）· **≠** 公司采购流程 · **≠** 现在 GO 前提。  
**KYC 防脏：** [TT-KYC-PRODUCT-SCOPE-ALIGNMENT-LATEST](./TT-KYC-PRODUCT-SCOPE-ALIGNMENT-LATEST.md)（维 B 余项入 **W6 Hygiene**）。  
**CMS Content QA：** [TT-CMS-CONTENT-QA-IN-PROCESS-LATEST](./TT-CMS-CONTENT-QA-IN-PROCESS-LATEST.md)（QA=内容六维 · 生产级轨 B · ≠ W2  alone · ≠ Staging GO 假称多国已齐）。

### 0.5 · 评分提升挂载（LOCKED · 2026-07-21 · 非新 Gate）

**SSOT：** [TT-PROJECT-SCORE-UPLIFT-PLAN-LATEST](./TT-PROJECT-SCORE-UPLIFT-PLAN-LATEST.md)

| 抬分维 | 目标 | 流程位置 |
|--------|------|----------|
| 架构 ≥9.0 | Staging 同钉 | **Reality-W0**（≠ Formal Baseline） |
| 功能 ≥8.0 | Scope 内第8问 YES | **W1–Reality-W5 + W7** |
| 运营 ≥7.0 | RACI/SRE/Retention/仲裁 | **W2/W3/W4/W6** |
| 融资技术 ≥6.5 | W3=预案 · **主杠杆 C-09** | **Reality-W3 + C-09**（W3≠现实证明） |
| 市场 | **不设工程目标** | 商业另轨 |
| **加分补挂** | CDN/收费定论 · ToS · SBOM · Restore 演练 · 仲裁干跑 · Data Room · QA 并行 | **[Uplift SU-PLUS](./TT-PROJECT-SCORE-UPLIFT-PLAN-LATEST.md)** |

**纪律：** 真实完成才抬分 · 禁止文档刷分 · 市场验证不塞进 Reality。  
**Readiness：** A-02/03/04 **禁止 TBD 进 Sign-off**（SU-PLUS-01/02）。  

### 0.5b · 三误判防呆（LOCKED · 与 Uplift §5 同源）

| # | 禁止 | 正确 |
|---|------|------|
| 1 | Formal Baseline = 架构完成 | Baseline = Candidate 冻结/认证 · **架构抬分从 Reality-W0 起** |
| 2 | 只说「W5 完成」 | **PSG-W5 Owner Time-Separated Review** ≠ **Reality-W5 UI/UX Closure** |
| 3 | Reality-W3 = 融资现实证明 | W3 = Threat/PenTest Plan/SoW/Bounty Prep · **C-09** = 真审计+真渗透+整改+可披露证据 |

**SSOT：** [Score Uplift §5](./TT-PROJECT-SCORE-UPLIFT-PLAN-LATEST.md)

---

## 1 · 每修复微梯子（写死 · 已有 · 不另造）

```text
分类（PRG/PRC/R*）
  → PCR 修复（独立车辆 · 非污染 CAND-V2 Archive）
  → Version Gate
  →（W0 起）Deploy Identity / Runtime Certification
  → Evidence 更新（新证据根 · 禁用旧证冒充新 Runtime）
  →（全部 W0–W6 齐）W7 Delta Recertify
  → Reality Closure Gate
  →（层齐）PSG Recalculate #2
```

---

## 2 · Residual Risk → P0/P1/P2 → 落点

| ID | 残留命题 | Pri | 落点 | 处置（诚实） |
|----|----------|:---:|------|--------------|
| **R1** | Project A ≠ L1–L5 全 PASS / `psg_complete` | **P0** | Project A 叙事纪律 | 满窗只宣称 Baseline+L5 路径；Complete 留给 Reality 后 Recalc#2 |
| **R2** | Sole blockers：FG15B / L5 / FGCASE / **PSG-W5 ≠ Reality-W5** | **P0** | Project A + Solo Sign-off 另轨 | FGCASE 真证据；**禁止**只说「W5 完成」· 全称见 [Uplift §5](./TT-PROJECT-SCORE-UPLIFT-PLAN-LATEST.md) |
| **R3** | Candidate S3 与 W0 重叠 | **P0→P1** | Baseline 前 Identity 可引用 · Staging tip 对齐在 **W0** | 禁旧 Staging 冒充 L5 |
| **R4** | L5 证据环境 ≠ Staging Fly | **P1** | **W0** | Baseline 后立即 Alignment；禁「PSG 后立刻全站 UAT」跳过 W0 |
| **R5** | L3 Auth NEED_FIX 与 Complete 死锁 | **P1** | **W1** | Recalc 时 L3 未 PASS ⇒ `psg_complete` 保持 false |
| **R6** | L1 含 User_Journey · 不能只靠 W5 | **P1** | **W1**（主）+ W5 | Auth 未闭不刷 Market UI 当 L1 PASS |
| **R7** | W3/W6 在影响序中偏隐 | **P2** | **W3 · W6** | 全序保留；P 级≠删 Wave |
| **R8** | Dual-track Patch 急塞认证 Staging | **P1** | PCR + Dual-track 纪律 | 非金融 patch 须 PCR；Money Path 窗不污染 |
| **R9** | Vesting 参数仍 OWNER_INPUT | **P2**（③） | 主网/GO 另闸 | **不塞** Project A / W0 |
| **R10** | 修码后再漂移 tip | **P1** | 每 Wave Version Gate · **W7** | 禁改 CAND-V2 Archive；必要时新 Recertify 包 |
| **R11** | 执行分连续 vs Complete 二进制 | **P0** | 预期管理 | Execution↑ ≠ Complete；先 Baseline 再抬 L3 |

### Pri 定义（本包）

| Pri | 含义 | 何时动 |
|-----|------|--------|
| **P0** | ETA / L5 / Baseline 阶段硬闸与过宣称防护 | 满窗 **Project A**（现在仅 Maintain） |
| **P1** | 假绿地基 + Auth/Complete 死锁 + 每 Wave 同钉 | Formal Baseline 后 **W0→W1**（及微梯子）优先 |
| **P2** | Sec/GDPR/Admin · Hygiene · BizOps · 主网 Owner 输入 | **W2–W6** 按序；R9 可后置于 Readiness/GO |

---

## 3 · 问题类 → Wave（既有映射 · 再钉一次）

| 问题类 | Wave | 代表残留 / 输入 |
|--------|:----:|-----------------|
| OLD_RUNTIME / SHA 分裂 | **W0** | R3 · R4 · Staging `f8181b63` ≠ tip |
| Auth 生命周期 NOT_PRODUCTION_READY | **W1** | R5 · R6 · L3 NEED_FIX |
| CMS 运营 / 展示源 | **W2** | CMS Audit · Enterprise BIZ-01/02 |
| Sec / User / Admin / Threat / 仲裁 | **W3** | R7 · Enterprise Sec + BIZ-03/04 |
| DB Lifecycle · SRE Ops · **Evidence Retention（运维）** | **W4** | DB Audit · Enterprise SRE · Incident/Restore/Release 保留 |
| UI/UX 生产态 | **Reality-W5 UI/UX Closure** | Inventory UI · **≠ PSG-W5 Owner Time-Separated Review** |
| 文档 Hygiene · BizOps · **Evidence Retention（文档）** | **W6** | R7 · 发布/安全报告/审批记录可回指 |
| 复验十维 · 三成熟度布尔 | **W7** | R10 · Delta ≠ 治疗 |

---

## 4 · 满窗 / 窗后检查清单（执行时用 · 等窗不勾 PASS）

### 4.1 满窗 · Project A（P0）

- [ ] FG-15-B **ELAPSED**
- [ ] Settlement finalize
- [ ] L5 Final Evidence（真链/真路径 · 禁文档绿）
- [ ] S7 Recalculate **#1**（Baseline 前）
- [ ] Formal Baseline 成立（**≠** 架构完成 · 架构抬分看 **Reality-W0**）
- [ ] **不宣称** L1–L4 自动 PASS / `psg_complete=true`（R1）
- [ ] **PSG-W5 Owner Time-Separated Review** ≠ **Reality-W5 UI/UX Closure** · **禁**只说「W5 完成」（R2 · Uplift §5）
- [ ] Reality-W3 预案 ≠ **C-09** 融资现实证明（Uplift §5 误判 3）

### 4.2 Reality Closure（P1→P2 · 固定序）

| Wave | 最少闭环 | 微梯子 | 评分提升（[Uplift Plan](./TT-PROJECT-SCORE-UPLIFT-PLAN-LATEST.md)） |
|:----:|----------|--------|----------------------------------|
| W0 | tip = Staging Runtime · 合约投影对齐 | PCR → Version Gate → Deploy Identity → Runtime Cert → Evidence | **架构 →≥9.0**（**仅此** · ≠ Formal Baseline） |
| W1 | Auth 邮箱所有权 / reset / session | 同上（无裸 deploy） | **功能** Auth |
| W2 | Catalog 可证 · 无静默 Unsplash | 同上 | **功能** CMS + **运营** RACI 启动 |
| W3 | step-up · GDPR · Threat/SoW/PenTest/Bounty Prep · 仲裁 | 同上 | **功能** Sec + **融资预案**（**≠ C-09**） |
| W4 | 高风险表 · Outbox · Monitor→PM · Retention（运维） | 同上 | **功能** DB + **运营** SRE |
| **Reality-W5** | 生产态矩阵 · 不回流五主结构 | 同上 | **功能** UI/UX Closure（**≠ PSG-W5**） |
| W6 | ACTIVE→Candidate · RACI · Retention（发布/安全/审批）· KYC 治脏 · 不删 Archive | 同上 | **运营** Hygiene/BizOps |
| W7 | Delta · Inventory · Reality Gate · 三成熟度布尔 | **复验** · 非治疗 | **全维复测（须附证据 · 禁刷分）** |

### 4.3 最终闸

- [ ] `check-reality-closure-gate.sh` → **REALITY_CLOSURE_PASS**
- [ ] `check-production-feature-inventory-gate.sh` 武装后可 PASS（非仅 MATRIX_OK）
- [ ] PSG Recalculate **#2** — 仅层证据支持时讨论 `psg_complete=true`
- [ ] Production Readiness → **PSG-W5 Owner Time-Separated Review** → Owner Sign-off → **Staging-grade GO**（≠ ③ Mainnet）

---

## 5 · 等窗行为（现在）

| 做 | 不做 |
|----|------|
| Maintain · Integrity · Catalog · Freshness · ETA | ❌ 改 Candidate / L5 / S7 |
| 保持本 EXECUTION_PREP_FROZEN | ❌ 改码 · redeploy · 新 Gate |
| 对照 R1–R11 防过宣称话术 | ❌ 勾选 §4 为 PASS |

**诚实边界：** 执行准备 ≠ 已执行 ≠ Reality PASS ≠ `psg_complete` ≠ Staging-grade GO ≠ ③ Mainnet Production GO。  
**治理审计：** [TT-POST-ETA-PROCESS-ALIGNMENT-AUDIT-LATEST](./TT-POST-ETA-PROCESS-ALIGNMENT-AUDIT-LATEST.md)（工程 vs 治理分类）。

**机读：** [`TT-POST-BASELINE-REALITY-CLOSURE-EXECUTION-PREP-LATEST.json`](./TT-POST-BASELINE-REALITY-CLOSURE-EXECUTION-PREP-LATEST.json)
