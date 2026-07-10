# FPC-100 · Quality Domain Matrix（质量域认证矩阵 · v1）

**Status:** **ACTIVE · Certification Content Extension**  
**Governance:** **FPC-100 v5 FROZEN** — 本文件 **不** 修改 Batch 顺序 · Dashboard Schema · Registry 批次定义  
**Parent:** [`FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md`](FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md)  
**Machine SSOT:** [`FPC-100/FPC-100-QUALITY-DOMAIN-MATRIX-LATEST.json`](FPC-100/FPC-100-QUALITY-DOMAIN-MATRIX-LATEST.json)  
**Batch SSOT（不变）:** [`registry/full-production-certification-checklist.v1.yaml`](../../../../registry/full-production-certification-checklist.v1.yaml)  
**Page cards（202）:** [`FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json`](FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json)

---

## 0.0 FPC 最高原则（写死 · 全文灵魂）

> **Certification never ends at finding problems.**  
> **Certification ends only when:** problems are resolved · evidence is regenerated · re-certification passes · and the release decision can be justified.

**中文：** 认证不是发现问题就结束，而是只有在 **问题修复 · 证据更新 · 重新认证通过 · 并能够支撑发布决策** 时，认证才算真正完成。

**Batch 完整生命周期**（优于「检查 → PASS」）：

```
Business Certification → Quality Certification → Findings → Severity
→ Remediation → Change Impact → Re-certification → Evidence Refresh
→ DoD → Batch CLOSED
```

Governance SSOT：[`FPC-CERTIFICATION-GOVERNANCE-v1.md`](FPC-CERTIFICATION-GOVERNANCE-v1.md) §0.1

**每 Batch 执行节奏（B12 起写死 · 标杆可复制）：**

```
Business Certification → Quality Certification → Findings → P0/P1/P2/P3
→ Remediation → Change Impact → Re-certification → Evidence Refresh
→ Dashboard Refresh → DoD → CLOSED
```

**禁止** 在本 Batch 内留下已知 P0/P1「以后再修」（P2 仅可通过 Accepted Risk · risk register）。

**B13 起：** 每批开始前运行 [`check-fpc-runtime-preflight.cjs`](../../../../scripts/dev/check-fpc-runtime-preflight.cjs)（见 Governance §0.2）。

---

## 0. 定位（Release Certification → Production Quality）

| 维度 | 当前 FPC v5 强项 | 本矩阵补全的视角 |
|------|------------------|------------------|
| **发布治理** | Batch 顺序 · DoD · Burn-down · Change Impact · Freeze | **不变** |
| **发布认证（Release）** | Gate PASS · 证据链 · 202 页卡壳 · BFM · API Parity | **已有骨架** |
| **产品质量（Product）** | L2 UI/UX · L2.5 CX · 五主冻结 · 页面功能 | **深度检查项**（本矩阵 §3） |
| **运营质量（Operations）** | L5 Content/Ops/Recovery/Truth · Admin RBAC | **运营体验**（非仅 API） |
| **工程质量（Engineering）** | B11 · B16 · B17 · B19 · B24 | **架构/可维护性/代码质量深度** |

**诚实边界：** 本矩阵 **不** 新增 Batch ID（B42+）；所有质量域 **映射到现有 B00–B41** 与 **202 页卡字段**。深度不足处标注 **「批次内深度补充」**，在对应 Batch 证据中展开，**不** 改 v5 治理。

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产；各域验收须标明落在哪一阶（与 FPC 批次 `phase` 同源）。

### 0.1 企业级发布标准（≠ 所有发现归零）

**全量认证覆盖（100% Coverage）** 指 **每个质量域、每页、每批次都跑过检查** — 不是指 **所有发现项 = 0**。

企业级发布门槛 = **阻断问题关闭** + **剩余风险明确接受** + **证据链完整**：

```
TT_FULL_PRODUCTION_CERTIFICATION = PASS
AND P0 = 0
AND P1 = 0
AND Critical Risk = 0          （OPEN_BLOCKING_RISKS = 0 · 见 alignment policy）
AND Staging Diff = PASS        （② · Environment Diff）
AND Production Entry Review = PASS
```

| 严重度 | 含义 | 发布影响 | 处置 |
|--------|------|----------|------|
| **P0** | 数据泄漏 · 权限绕过 · 资金安全 · 核心流程不可完成 · 严重生产崩溃 | **阻断** | **必须 FIX** · P0=0 才可考虑发布 |
| **P1** | 重要功能异常 · 大量用户受影响 · 核心体验严重下降 | **通常阻断** | **必须 FIX** · P1=0 |
| **P2** | 小范围 UI · 文案 · 非关键体验 | **可评估** | FIX **或** 登记 **Accepted Risk**（Owner 书面 · risk register） |
| **P3 / Enhancement** | 新功能建议 · 体验优化 | **不阻断** | Backlog · 不影响发布 |

**P2 接受条件：** 写入 [`registry/fpc-100-risk-register.v1.yaml`](../../../../registry/fpc-100-risk-register.v1.yaml) · Dashboard **Accepted Risks** 可见 · **禁止** 将 P0/P1/Critical 登记为 Risk。

### 0.2 FPC 认证闭环（发现机器 + 修复证明机器）

FPC-100 的目标不是「检查结束」，而是 **风险收敛至发布门槛**：

```
认证检查（Batch / 页卡 / Gate）
        ↓
    发现问题（写入 evidence · severity）
        ↓
    问题分级（P0 / P1 / P2 / P3）
        ↓
  修复阻断项（P0 · P1 · Critical Risk）
        ↓
    重新认证（同 Batch invalidation → re-run）
        ↓
      循环
        ↓
  达到发布门槛（§0.1 六条 AND）
        ↓
       发布
```

**示例轨迹：**

| 轮次 | P0 | P1 | P2 | 动作 |
|------|----|----|-----|------|
| 第一次认证 | 5 | 20 | 50 | 开 Defect · 修 P0/P1 |
| 修复后 | 0 | 0 | 10 | P2：修 40 · Accept 10 |
| 再认证（回归） | 0 | 2 | 8 | 新增 P1 → 继续修 |
| 最终 | **0** | **0** | ≤Accepted | Evidence 完整 · Gate PASS → PER → 发布 |

**B00–B10 已证明：** 该闭环可运行（Anchor → … → Business Flow Certification）。**B11–B41** 继续对 API · 页面 · 性能 · 安全 · 运维 · 体验 · 运营 **全量跑一遍** — 最后不是「我们觉得能上线」，而是 **证据链证明达到生产发布标准**。

### 0.3 Change Impact · 不全量重跑 · Quality Supplement

**原则：** 新增认证项 **不** 默认推翻 B00–B41 已 PASS 批次。按 **变更影响（Change Impact）** 决定重跑范围 — 与 [`FPC-CERTIFICATION-GOVERNANCE-v1.md`](FPC-CERTIFICATION-GOVERNANCE-v1.md) §1 Freeze · [`registry/fpc-100-change-impact-map.v1.json`](../../../../registry/fpc-100-change-impact-map.v1.json) · `check-fpc-change-impact.cjs` 同源。

#### 三种情形

| # | 情形 | 是否重跑已 PASS 批次 | 示例 |
|---|------|---------------------|------|
| **① 不重跑** | 仅扩展 **认证能力**（清单/域定义/验收标准/证据模板），**尚未执行**新检查 | ❌ | **Quality Domain Matrix v1** — 能力扩展，**不是**认证结果改变 |
| **② Quality Supplement** | 对已 PASS 批次 **执行** 新增质量域检查 | ⚠️ **只跑增量** | B04 Business PASS → 补 Performance · UX · Architecture 深度清单 → 写 Evidence → 再 DoD |
| **③ 全量失效** | **治理规则**改变（Batch 顺序 · Dashboard Schema · DoD 定义 · Release Decision） | ✅ 全部重认证 | **FPC v5 Governance Freeze** — **当前不存在** |

**禁止：** 每增加一项 UX/性能/代码质量检查就把 B00–B41 **全部重跑** — 认证成本失控 · 打乱 Burn-down。

#### 双层批次模型（证据扩展 · 不改 v5 Dashboard Schema）

**写死：** **Overall PASS 的前提是 Business PASS + Quality PASS**（Quality 为 **N/A** 的批次除外 · 须 documented 理由）。

每个 Batch 证据 JSON 可扩展（**认证内容** · 非治理 Schema）：

| 字段 | 允许状态 | 说明 |
|------|----------|------|
| `business_certification.verdict` | NOT_STARTED · IN_PROGRESS · **PASS** · FAIL | 原 Batch Gate/DoD · 已 PASS 的 **继续有效** |
| `quality_supplement.verdict` | **PENDING** · **IN_PROGRESS** · **PASS** · PASS_WITH_WARN · FAIL · N/A | 新增质量域增量认证 |
| `overall_verdict` | **IN_PROGRESS** · PASS · PASS_WITH_WARN · FAIL | **派生字段** · 见下表 |

**Overall 派生规则（固定）：**

| Business | Quality | Overall | Dashboard 读法 |
|----------|---------|---------|----------------|
| PASS | PENDING | **IN_PROGRESS** | 业务已过 · **质量认证尚未开始** |
| PASS | IN_PROGRESS | **IN_PROGRESS** | 业务已过 · **质量认证进行中** |
| PASS | PASS | **PASS** | 双层均完成 |
| PASS | PASS_WITH_WARN | **PASS_WITH_WARN** | P2 已登记 Accepted Risk |
| PASS | FAIL | **FAIL** | 质量阻断 · 修后只重跑 Quality 增量 |
| FAIL | * | **FAIL** | 业务未过 · Quality 不单独 Overall PASS |
| PASS | N/A | **PASS** | 须 documented · 该批无映射质量域 |

**示例 B04（进行中）：**

```
Business:  PASS
Quality:   IN_PROGRESS
Overall:   IN_PROGRESS    ← 不是业务没过，是质量还没补完
```

**示例 B04（完成）：**

```
Business:  PASS
Quality:   PASS
Overall:   PASS
```

**三层 Coverage（最终 Dashboard 旁证 · ② Staging 前须全 100%）：**

| 指标 | 公式 | 目标 |
|------|------|------|
| **Business Coverage** | Business PASS 批次数 / 41 | **100%** |
| **Quality Coverage** | Quality PASS（或 documented N/A）批次数 / 41 | **100%** |
| **Overall Certification** | Overall PASS 批次数 / 41 | **100%** → `TT_FULL_PRODUCTION_CERTIFICATION` |

**Burn-down 纪律：** B00–B10 的 **Business PASS 不被推翻** · Readiness 历史 **不回零**；Overall 在 Quality Supplement 完成前为 IN_PROGRESS · **不** 因此 retroactive 撤销已记录的 Business 证据链。

#### Quality Supplement 流程（以 B04 为例）

```
B04  Business Certification     PASS（已冻结 · 不推翻）
        ↓
Quality Checklist（本矩阵 §3 · 该批映射域）
        ↓
Performance / UX / Architecture …（仅新增域对应检查）
        ↓
Evidence → FPC-100/B04-*/quality-supplement/
        ↓
Re-certify（只跑增量 · 非全 Batch 重跑）
        ↓
finalize-fpc-batch-dod.cjs --batch B04  （quality 柱更新）
        ↓
B04  FINAL PASS（Business + Quality）
```

#### 执行纪律（写死）

| 阶段 | 动作 |
|------|------|
| **现在** | **不** 回头重跑 B00–B10；Quality Matrix v1 = ① 能力扩展 |
| **下一步** | **B11 → DoD 收口**（Burn-down 纪律不变） |
| **B12 → B41** | 每批 **Business + Quality 一并**执行 → 该批 Overall PASS 后进入下一批 |
| **B41 完成后** | **回头** B00 → B01 → … → B10 **Quality Supplement**（仅增量 · 不推翻 Business） |
| **② Staging 前** | Business Coverage **100%** · Quality Coverage **100%** · Overall Certification **PASS** |
| **代码变更** | 仍走 Change Impact — 只 **失效** 受影响批次，非全量 |

```
B11 DoD
  ↓
B12  Business + Quality  →  Overall PASS
  ↓
…
  ↓
B41  Business + Quality  →  Overall PASS
  ↓
B00 Quality Supplement  →  Overall PASS
  ↓
B01 Quality Supplement  →  Overall PASS
  ↓
…
  ↓
B10 Quality Supplement  →  Overall PASS
  ↓
Dashboard: Business 100% · Quality 100% · Overall PASS
```

**Re-certification** 在此指 **只跑新增质量域对应检查** — **不是** 全部重跑。

---

## 1. 与五层认证模型对齐

```
L1  页面覆盖 100%           → 产品功能（表面枚举）     B23
L2  UI/UX L5                → UI 一致性 · 页面功能深度  B25-C* · B02
L2.5 Customer Experience    → UX · 引导 · CTA · 迷路   B26
L3  业务流程                → 产品功能（闭环）         B10 · B05 · B08
L4  企业横切                → 性能 · 安全 · a11y · SEO  B13–B20 · B17
L5  运营与真实              → 运营 · 数据 · 恢复 · 真实 B30–B36 · B33
横切  架构/代码/可维护性     → 工程质量（深度）         B11 · B16 · B24 · 页卡 + 本矩阵 §3.8–3.9
```

---

## 2. 一级质量域总表

| # | 一级域 | 已有覆盖 | 深度缺口 | 主批次 | 辅批次 |
|---|--------|----------|----------|--------|--------|
| Q1 | **产品功能** | ✅ | 202 页逐页 Function 分 | B23 · B25-C* · B24 | B10 · B05 |
| Q2 | **UI 一致性** | ✅ | 设计 token · 跨页组件 | B02 · B25-C* | B01 · B18 |
| Q3 | **UX / 客户体验** | ⚠️ | 首访路径 · ≤3 点击 · 认知负荷 | **B26** · B25 | B14 |
| Q4 | **页面性能** | ⚠️ | 首屏 · 路由切换 · Bundle | **B16** | B25 · 页卡 D7 |
| Q5 | **前端架构** | ❌ | 组件粒度 · 状态 · 循环依赖 | **批次内深度** | B23 · B24 · B25 |
| Q6 | **后端架构** | ⚠️ | 模块边界 · 分层 · 事务 | **B11** · B32 | B19 · B24 |
| Q7 | **运维能力** | ⚠️ | Admin **运营体验**（非 API） | **B33** · B25-C6 | B09 · B30 |
| Q8 | **可维护性** | ❌ | 文档 · 耦合 · 技术债登记 | **批次内深度** | B24 · B00 |
| Q9 | **数据质量** | ⚠️ | Null · 孤儿 · 漂移 · 血缘 | **B31** · B12 | B34 · B36 |
| Q10 | **可观测性** | ⚠️ | 指标 · 追踪 · 告警 | **B19** | B17 · B40 |
| Q11 | **安全** | ⚠️ | Session · CSP · 上传 · Webhook | **B17** | B09 · B03 |
| Q12 | **商业准备** | ⚠️ | 法务 · 支持 · Analytics | **B41** | B13 · B36 |
| Q13 | **国际化 i18n** | ⚠️ | 文案完整 · 格式 · 货币 | **B13** | B14 · B30 |
| Q14 | **可靠性 / 恢复** | ⚠️ | 断网 · RPC · Session 过期 | **B35** | B20 · B05 |
| Q15 | **Web3** | ⚠️ | 钱包 · 轮询 · RPC fallback | **B20** | B05 · B35 |
| Q16 | **SEO / 增长** | ⚠️ | Schema · 分享预览 · Sitemap | **B13** · B41 | B01 |
| Q17 | **代码质量** | ❌ | FE/BE 复杂度 · Dead code | **批次内深度** | B24 · B16 |

---

## 3. 二级检查项 · 批次映射 · 验收 · 证据

### Q1 · 产品功能（Product Function）

| 二级项 | 映射批次 | 验收标准（① 本地） | 证据要求 |
|--------|----------|-------------------|----------|
| 202 路由枚举 | B23 | `layer1_surface_coverage` 全 PASS | 页矩阵 JSON · forensic log |
| 每页 Function 分 | B25-C1～C6 | `layer2_l5_scores.function_flow` ≥8 或 CONDITIONAL+理由 | 页卡 · 截图 · API 烟测 |
| 业务闭环 | B10 | BFM 全 step PASS（Business Flow Certification） | `BFM-*` · human step |
| 域回归 | B24 | 93 矩阵执行集 PASS；禁止假 GO | `report.json` + README 边界说明 |
| 走廊烟测 | B05 · B08 · B03 | 金路径 script exit 0 | smoke `*.sh` log |

### Q2 · UI 一致性（UI Consistency）

| 二级项 | 映射批次 | 验收标准 | 证据要求 |
|--------|----------|----------|----------|
| 五主 UI 冻结 | B02 | FIVE-MAIN 绿集 exit 0；无 layout 回流 | vitest contract |
| 设计 token / L5 视觉 | B25 | `layer2_ui_dimensions.*` PASS；D9_tokens | 页卡 · 96-16 维度 |
| 生产壳卫生 | B18 | 无 DevTools/mock chrome | production-ui-hygiene gate |
| 公共面一致性 | B01 | PER spot patterns PASS | PER evidence |

### Q3 · UX / Customer Experience ★★★★★

| 二级项 | 映射批次 | 验收标准 | 证据要求 |
|--------|----------|----------|----------|
| 用户目标 · 主 CTA | **B26** | 202 页 `user_goal` + `primary_cta` 非空 | 页卡 L2.5 |
| ≤3 次点击完成核心任务 | B26 | `time_to_complete` · journey score 记录 | 人工走查录像/步骤表 |
| Loading / Skeleton / Empty | B25 · B26 | `layer2_ux_states.*` PASS | 页卡 + 截图 |
| Error Recovery · Retry | B35 · B26 | error 态可行动；非死胡同 | 页卡 recovery 字段 |
| 深链接 · Browser History · Back | B25 | `back_navigation` · 路由实测 | 人工 + E2E 片段 |
| 首次使用引导 | B26 | 新用户 5 分钟内知「下一步」 | CX 走查表（C2 等 persona） |
| 信息架构 | B25 | `ux_certification.ia_*` PASS | 页卡 |

### Q4 · 页面性能（Performance）★★★★★

| 二级项 | 映射批次 | 验收标准 | 证据要求 |
|--------|----------|----------|----------|
| `next build` | B16 | build gate PASS | CI log |
| 首屏 / LCP  spot | B16 · B25 | 五主 + 公共走廊 LCP 记录；无劣化 | Lighthouse/trace JSON |
| 路由切换延迟 | B25 | D7_performance 页卡 PASS | Performance API 采样 |
| JS/CSS Bundle | B16 | 与 baseline 对比 documented | build analyzer 输出 |
| 图片 Lazy · Prefetch | B25 · B16 | 关键页资源策略记录 | 页卡 notes |
| API latency p95 | B16 · B19 | 公共 GET smoke + 延迟上限（① 本地基线） | curl/hyperfine log |
| Web3 RPC / 轮询 | B20 · B35 | 超时降级路径 documented | B35 recovery 证据 |

### Q5 · 前端架构 ★★★★★（批次内深度 · 无新 Batch）

| 二级项 | 映射批次 | 验收标准 | 证据要求 |
|--------|----------|----------|----------|
| 组件粒度 · Props 长度 | B25 · B24 | 关键页 README + 无 God 组件 P1 | 代码审查清单 §FE-ARCH |
| Hooks 复用 · Context 边界 | 批次内深度 | 重复 state ≤ 阈值；无跨层 Context 泄漏 | `FPC-100/B25-*/arch-review.md` |
| 循环依赖 · Dead code | B24 · B23 | `madge`/eslint 无 P1 环 | gate log 或 manual rg 证据 |
| Presentation 分层 | B25 | 页面不直连 DB；经 apiClient/hooks | 页卡 `api_data_chain` |

**执行说明：** 在 **B25-C*** 收口时附加 **Frontend Architecture Depth Checklist**（本矩阵 JSON `depth_checklists.frontend_architecture`），写入该 cluster 的 `FPC-100/B25-C*/` 证据目录。

### Q6 · 后端架构 ★★★★★

| 二级项 | 映射批次 | 验收标准 | 证据要求 |
|--------|----------|----------|----------|
| 04 ↔ mod.rs ↔ api.ts | **B11** | API Parity 四维 PASS | B11 LATEST.json |
| Module 边界 · Service 拆分 | B11 · B32 | 无跨 domain 直接 SQL 于 handler（spot） | arch review §BE-ARCH |
| Error handling · Retry · Tx | B32 · B24 | 写路径 POST→GET 一致 | B11 write-read smoke |
| Trait / 分层违规 | 批次内深度 | 无 Infrastructure→Presentation 反向依赖 P1 | cargo + 审查表 |

### Q7 · 运维能力（Operational Excellence）★★★★★

| 二级项 | 映射批次 | 验收标准 | 证据要求 |
|--------|----------|----------|----------|
| Admin 一日运营 | **B33** · **B25-C6** | E1/E2 **人工**：发公告·下架·审核·封禁·看日志 | human_verified + 录屏 |
| CMS 发布闭环 | B30 · B12 | Upload→Publish→Verify→Live | CMS ops evidence |
| RBAC 四中心 | B09 | 114 路由矩阵 PASS | admin-rbac smoke |
| 批量 · 导出 · 审计 | B33 | 关键 ops 路径 ≤N 步；audit log 可读 | Admin journey 证据（B25-C6） |
| 搜索 · 回滚 | B33 | 有 documented 路径或 N/A+理由 | ops checklist |

### Q8 · 可维护性（Maintainability）★★★★★

| 二级项 | 映射批次 | 验收标准 | 证据要求 |
|--------|----------|----------|----------|
| 路由/README 对拍 | B00 · B23 | 每 cluster README 可解析 | owner_files |
| 配置集中化 | B17 · B00 | .env.example 与 meta 一致 | meta smoke |
| Feature flag 边界 | B18 | 生产无 debug flag 泄漏 | hygiene gate |
| 技术债登记 | 批次内深度 | `fpc-100-risk-register` 或 defects 表有 OPEN 项 | risk register YAML |
| 模块耦合 spot | B24 | 变更影响 map 可解释 | change-impact-map |

### Q9 · 数据质量（Data Quality）

| 二级项 | 映射批次 | 验收标准 | 证据要求 |
|--------|----------|----------|----------|
| 展示治理 DDG | B12 · B04 | DDG gate PASS | registry + gate log |
| 血缘 DB→UI | **B31** | 每页 `data_lineage` 链 documented | 页卡 layer5 |
| Null · 重复 · 孤儿 | B34 · B31 | 生命周期实体 spot 无 P1 脏数据 | SQL/脚本输出 |
| 一致性 · 漂移 | B11 · B36 | API Read/Write Parity；无 mock 冒充真值 | B11 + truthfulness |
| CMS vs API 来源 | B12 · B30 | 首页读 catalog 非 fallback（Live 国） | CMS ops board |

### Q10 · 可观测性（Observability）

| 二级项 | 映射批次 | 验收标准 | 证据要求 |
|--------|----------|----------|----------|
| /health · /meta · /metrics | B19 · B00 | smoke PASS；meta 机读键完整 | smoke-api-public-routes |
| 结构化日志 · 无 PII 泄漏 | B19 | spot 检查 error 路径 | log snippet 审查 |
| 指标 · 追踪 · 告警 | B19 · B40 | ① baseline；② staging 告警探针 | B40 deployment 证据 |
| 前端 observability | B25 | D11_observability 页卡 | 页卡 |

### Q11 · 安全（Security）

| 二级项 | 映射批次 | 验收标准 | 证据要求 |
|--------|----------|----------|----------|
| RBAC · Admin deny | B09 · B17 | 矩阵探针 PASS | admin-rbac |
| Secrets · internal 403 | B17 | invariants + audit-deps | gate log |
| Session · Token 生命周期 | B03 · B17 | auth gate；STRICT_SESSION 行为 documented | auth smoke |
| CSP · XSS · 上传 · Webhook 验签 | B17 · B07 | community media guard；Stripe ② | 专项 spot |
| Rate limit | B19 · B11 | meta rate_limits 与实现一致 | /meta smoke |

### Q12 · 商业准备（Business Readiness）

| 二级项 | 映射批次 | 验收标准 | 证据要求 |
|--------|----------|----------|----------|
| Terms · Privacy · Contact | **B41** | 页面可访问 · 链接有效 | human_verified |
| FAQ · Support · 邮件模板 | B41 | 清单逐项 PASS 或 N/A | B41 evidence |
| Sitemap · Robots · Analytics | B41 · B13 | 可抓取 · 无 localhost canonical | B13 gate |
| 错误页 · 法律声明 | B41 · B25 | 404/500 品牌一致 | 页卡 |

### Q13 · 国际化（i18n）

| 二级项 | 映射批次 | 验收标准 | 证据要求 |
|--------|----------|----------|----------|
| zh/en 文案 | B13 | 公共走廊 parity | locale diff |
| 时间 · 货币 · 数字 | B13 · B25 | D5_i18n 页卡 PASS | 页卡 |
| CMS i18n | B30 | 资产 multilingual 字段 | CMS QA JSON |
| a11y 与 i18n 叠加 | B14 | 96-13 清单 | axe/keyboard log |

### Q14 · 可靠性 / Recovery

| 二级项 | 映射批次 | 验收标准 | 证据要求 |
|--------|----------|----------|----------|
| API 500 · 断网 | **B35** | 页仍可导航；retry 可用 | fault injection log |
| CDN / 缺图 | B35 | 占位不裂 layout | 页卡 recovery |
| Wallet 超时 · 断开 | B35 · B20 | 重连路径 | web3 smoke |
| Session 过期 | B03 · B35 | 回登录可恢复上下文 | auth 走查 |

### Q15 · Web3

| 二级项 | 映射批次 | 验收标准 | 证据要求 |
|--------|----------|----------|----------|
| 金路径 itinerary→escrow | B05 | full-chain smoke PASS | smoke log |
| Sepolia / deployment truth | B20 | web3 gates PASS；不跳阶 | phase2 gates |
| Escrow 体验冻结 | B05 | draft 暖色壳；无默认 FeeRouter 外露 | vitest + freeze doc |
| Event latency · finality | B20 · B19 | meta indexer 字段一致 | /meta smoke |

### Q16 · SEO / Growth

| 二级项 | 映射批次 | 验收标准 | 证据要求 |
|--------|----------|----------|----------|
| Canonical · OG · Twitter | B13 | 无 localhost | siteMetadata test |
| Schema.org | B13 · B41 | 关键页 structured data 或 N/A | 审查表 |
| 分享预览 | B13 | 社交卡片 spot | 截图 |

### Q17 · 代码质量（Code Quality）

| 二级项 | 映射批次 | 验收标准 | 证据要求 |
|--------|----------|----------|----------|
| FE lint/test 绿集 | B02 · B24 | 受影响 corridor vitest/cargo exit 0 | gate log |
| BE `cargo test -p traveltrust-api` | B11 · B24 | ≥1000 tests PASS | B11 证据 |
| 复杂度 · 重复代码 spot | 批次内深度 | 无 P1 重复块（>50 行×3） | review checklist |
| 测试覆盖（关键域） | B24 | 93 + BFM 覆盖声明 | matrix README |

---

## 4. 批次 → 质量域反向索引（B00–B41）

| Batch | 标题 | 主质量域 | 层 |
|-------|------|----------|-----|
| B00 | Anchor · meta · page matrix | Q8 · Q10 | L1 scaffold |
| B01 | Public surface | Q2 · Q12 · Q16 | L4 |
| B02 | Five-main | Q1 · Q2 · Q4 | L2 |
| B03 | Auth / onboarding | Q1 · Q11 · Q14 | L3 |
| B04 | Market / DDG | Q1 · Q9 | L3 |
| B05 | Web3 itinerary | Q1 · Q14 · Q15 | L3 |
| B06 | Governance / trust | Q1 · Q2 | L3 |
| B07 | Community | Q1 · Q11 | L3 |
| B08 | Me / acquisition | Q1 · Q3 | L3 |
| B09 | Admin RBAC | Q7 · Q11 | L4 |
| B10 | Business Flow Certification | Q1 | **L3** |
| B11 | API Parity Certification | Q6 · Q9 · Q17 | L4/L5 |
| B12 | Data governance / CMS | Q9 · Q7 | L5 |
| B13 | SEO / i18n | Q13 · Q16 · Q12 | L4 |
| B14 | a11y | Q3 · Q13 | L4 |
| B15 | Mobile 375 | Q2 · Q3 | L4 |
| B16 | Performance | **Q4** · Q17 | L4 |
| B17 | Security | **Q11** | L4 |
| B18 | Production build | Q2 · Q8 | L4 |
| B19 | Observability | **Q10** · Q4 | L4 |
| B20 | Web3 alignment | **Q15** | L4 |
| B21 | Stripe / PSP | Q11 · Q12 | ② |
| B22 | DR / infra | Q10 · Q14 | ② |
| B23 | L1 202/202 coverage | **Q1** | L1 |
| B24 | Domain regression | Q1 · Q17 · Q8 | L4 |
| B25-C1～C6 | L2 page clusters | Q1 · Q2 · Q3 · Q4 · Q5 | L2 |
| B26 | Customer Experience | **Q3** | **L2.5** |
| B30 | Content Operations | Q7 · Q9 · Q13 | L5 |
| B31 | Data Lineage | **Q9** | L5 |
| B32 | API Contract (methods) | Q6 · Q9 | L5 |
| B33 | Operations (human) | **Q7** | L5 |
| B34 | Data Lifecycle | Q9 | L5 |
| B35 | Recovery | **Q14** | L5 |
| B36 | Truthfulness | Q9 · Q12 | L5 |
| B40 | Deployment | Q10 · Q14 | Deploy |
| B41 | Business Readiness | **Q12** · Q16 | Business |

---

## 5. 202 页卡字段 ↔ 质量域

| 页卡 JSON 路径 | 质量域 |
|----------------|--------|
| `layer1_surface_coverage.*` | Q1 |
| `layer2_l5_scores.ui/ux/content/function_flow` | Q1 · Q2 · Q3 |
| `layer2_ux_states.*` | Q3 · Q14 |
| `layer2_ui_dimensions.*` | Q2 |
| `layer2_5_customer_experience.*` | Q3 |
| `ux_certification.*` | Q3 |
| `l5_dimensions_96_16.D1–D12` | Q2–Q4 · Q11–Q16 |
| `layer4_enterprise.*` | Q4 · Q10 · Q11 · Q13 · Q16 |
| `layer5_operations_truth_per_page.*` | Q7 · Q9 · Q14 · Q12 |
| `layer3_business_flow_refs[]` | Q1 · L3 |

**企业级全量认证覆盖** = 202 页 × 上表字段 **全部执行检查** + 全 Batch DoD PASS + 17 质量域深度清单触达。  
**发布门槛** 见 **§0.1** — **不要求** P2/P3 发现归零；要求 **P0=0 · P1=0 · Critical Risk=0** + P2 已 FIX 或 **Accepted Risk** + Evidence 完整。

---

## 6. 验收口径（与 FPC 统一）

| Verdict | 质量域 / 批次含义 | 能否进入下一批 |
|---------|-------------------|----------------|
| **PASS** | 该域检查已执行 · **无 OPEN P0/P1** | ✅ |
| **PASS_WITH_WARN** | 仅 **P2/P3** · Owner 书面接受并登记 risk register | ✅ |
| **FAIL** | 存在 **OPEN P0/P1** 或 Critical Risk | ❌ 修复 → 再认证 |
| **PARTIAL** | 检查未触达或深度清单未填满 — **Coverage 未完成** | ❌ 继续认证 |
| **NOT_STARTED** | 页卡或深度清单未触达 | ❌ |

**区分两个「100%」：**

| 概念 | 含义 | 发布是否要求 |
|------|------|--------------|
| **Coverage 100%** | 202 页 + B00–B41 + 17 域 **全部跑过** | ✅（`TT_FULL_PRODUCTION_CERTIFICATION`） |
| **Findings 100% = 0** | 所有发现清零 | ❌ **不是**发布标准 |
| **Blocking 100% = 0** | P0=0 · P1=0 · Critical Risk=0 | ✅ |

**Release Readiness %（Burn-down）** 仍 = 连续 **Overall PASS** 前缀 / 41（B00–B10 在 Quality 补完前 Overall=IN_PROGRESS · Business 证据 **保留**）。  
**Business Coverage %** = Business PASS / 41 · **Quality Coverage %** = Quality PASS|N/A / 41 — Owner 旁证 · **不** 替代 Burn-down。

---

## 7. 本轮交付物与下一步

| 交付 | 路径 | 状态 |
|------|------|------|
| 质量域认证矩阵（本文） | `FPC-100-QUALITY-DOMAIN-MATRIX-v1.md` | ✅ 本轮 |
| 机读矩阵 | `FPC-100/FPC-100-QUALITY-DOMAIN-MATRIX-LATEST.json` | ✅ 本轮 |
| 改 Batch / Dashboard Schema | — | ❌ 禁止（v5 Freeze） |
| 改业务代码 | — | ❌ 本轮不做 |

**建议执行顺序（与 §0.3 一致 · 不回头重跑）：**

1. **B11 DoD 收口** → Readiness 前进  
2. **B12–B41** — 每批 Business + Quality → Overall PASS  
3. **B41 完成后** — B00→…→B10 Quality Supplement（增量 only）  
4. **② Staging 前** — Business / Quality Coverage 均 **100%** · Overall Certification **PASS**

---

## 8. 术语（与 B10/B11 对齐）

| 旧口语 | 统一认证用语 |
|--------|--------------|
| Guide PASS | **Business Flow Certification**（B10） |
| API smoke | **API Parity Certification**（B11 · 四维） |
| 页面绿集 | **Page Certification**（B25 · L2） |
| 走查 | **Certification**（须 verdict + evidence） |
| 全量重跑 | **Change Impact 失效** 或 **Quality Supplement 增量**（§0.3） |

---

**Version:** 1.0.4 · **2026-07-10**  
**Maintainer discipline:** 单维护者自检 · 与 [`FPC-GOVERNANCE-FREEZE-v5.md`](FPC-GOVERNANCE-FREEZE-v5.md) · [`FPC-CERTIFICATION-GOVERNANCE-v1.md`](FPC-CERTIFICATION-GOVERNANCE-v1.md) §2 Accepted Risks 同源
