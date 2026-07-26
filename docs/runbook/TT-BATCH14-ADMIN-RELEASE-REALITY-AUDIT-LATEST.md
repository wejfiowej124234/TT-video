# Batch-14 · ADMIN_RELEASE_REALITY_AUDIT · LATEST

**Machine:** `TT_ADMIN_BATCH14_ADMIN_RELEASE_REALITY_AUDIT`  
**Stamp:** `20260726T091500Z`  
**Verdict:** **`ADMIN_RELEASE_REALITY_AUDIT_NEED_FIX`** · **`RELEASE_GRADE: NO`** · **`Total: NEED_FIX`**  
**Patch:** `PATCH-STG-018`（审计入册 · **本口令不改产品代码**）  
**JSON:** [`TT-BATCH14-ADMIN-RELEASE-REALITY-AUDIT-LATEST.json`](./TT-BATCH14-ADMIN-RELEASE-REALITY-AUDIT-LATEST.json)  
**开录：** [`BATCH14-OPEN`](./TT-BATCH14-OPEN-RECORDING-LATEST.md) · Plan [`BATCH-14-PLAN`](./TT-PRE-MAINNET-HUMAN-UIUX-BATCH-14-PLAN-LATEST.md)  
**证据会话：** `evidence/manual-uat/sessions/20260726T091122Z-batch14/` · 复截 cite `…/20260726T081800Z-batch13-fp-e/batch13-screenshots/`  
**≠ tip 移动 · ≠ Hard Gate unlock · ≠ Cutover · ≠ Production GO · ≠ 假满分 · ≠ 重新设计 Web3**

---

## 0 · 阶段口径与诚实边界（写死）

**阶段：** ① 本地/代码真源 → ② Staging 真人复验 → ③ 公网/生产（须顺序 · **禁止跳阶**）

| 项 | 结论 |
|----|------|
| **有没有收口（发布级）** | **否** |
| **有没有 UI 冻结（全域 Admin）** | **否**（B12 走廊 FROZEN ≠ 全域发布冻结） |
| **本审计是否新增功能** | **否** — 只对照 Baseline 列缺口 |
| **可否宣称 Production GO** | **否** |
| **是否重设计 Web3** | **否** — 见 §0.1 对齐阶梯 |

**真源簇（唯一 · cite-only · 不平行）：**

| # | 锚 | 处置 |
|---|-----|------|
| 1 | Final Truth Baseline | tip `ea71c577` **IMMOBILE** |
| 2 | Candidate v2 | pin `PSG-REL-20260720-WEB3-CAND-V2` |
| 3 | V3.1.1 Final | profile `v311_fund_safety_candidate_v2` |
| 4 | PSG-EGM Final | 财务 **只读** · `FINANCE_WRITE` **FORBIDDEN** |
| 5 | Product / Release Baseline | **ACTIVE 修复面** · 本审计 |
| 6 | Engineering SSOT | Web bake `67a6ccba…` · API build `892c20c8…` |
| 7 | Feature Inventory | PASS cite **≠** 本审计发布级 YES |
| 8 | Reality Closure / PRR | Gate **NOT_ARMED / PREP** · **≠** GO |

### 0.1 · 修复对齐阶梯（集体改消费 · 非重设计）

```text
Candidate v2（Web3 协议唯一基线）
        ↓
API / Backend 实现对齐
        ↓
Runtime 数据真实
        ↓
Admin 展示真实
        ↓
Evidence 验证
        ↓
Final Truth Recertify
```

施工入口：[`COLLECTIVE-FIX`](./TT-BATCH14-COLLECTIVE-FIX-IN-PROGRESS-LATEST.md) · `PATCH-STG-019`

```text
① 有页面/API ≠ ② Staging 发布级真实能力签收 ≠ ③ Production GO
灰灯 /「暂无统计」≠ 假数字 —— 但仍 ≠「发布级全真数」
「代码里有审批」≠「发布级具备真实审批闭环」
B13 叶分 13～24/40 · 能力 21/30 · 本包五维发布分见 §F —— 禁止把任一分写成 40/40
```

---

## 1 · 取证范围（真证据 · 非估）

| 源 | 内容 |
|----|------|
| **Staging Web bake** | `67a6ccba716d…` · `build_time=2026-07-26T08:29:47Z` · pin Candidate v2 |
| **Staging API `/meta`** | build `892c20c8…` · `treasury_address: null` · chain_id `11155111` · `database.connected: true` |
| **Web≠API SHA** | **EXPECTED Divergence（部署不同步）** · 发布级挡板（数据面风险） |
| **SuperAdmin 登录** | `adm-10x4-…` → `role=super_admin` · **PASS**（≠ Business GO） |
| **C2 权限** | `tourist@test.com` → `GET /api/v1/admin/users` **403 `admin_required`** |
| **Admin 列表 API** | users / orders / guide-applications / provider-applications / steward-applications **200**（有 items） |
| **争议 API** | `applied_filters.source="memory"` · `total=0` · **非正式库** |
| **UI 复截（B13 FP-E）** | workbench→config · 多页 `meta_source=""` fail-closed · finance-suite 只读禁写文案 |
| **B13 叶审计包** | 工作台 24 · 用户 17 · 订单 17 · 争议 16 · 入驻 17 · 内容 21 · 官方 19 · 增长 20 · 财务 **13** · 设置 20（/40） |
| **B13 能力审计** | **21/30** · 向导审详 **memory 裂脑 P0** |

---

## 2 · 矩阵页总表（发布级）

| # | 域 / 路由 | UI/UX | 功能 | 数据诚实 | 发布级 | 主证据 |
|---|-----------|-------|------|----------|--------|--------|
| 1 | 工作台 `/admin` | 对比度/特权叙事弱 | 待办可点 | 用户/趋势正式库；订单/争议/库存常 memory | **NO** | 24/40 · B13-06p-workbench |
| 2 | 用户 `/admin/users` | 灰字贴底 P0 | 筛选可写闸混读 | `meta.source` 缺失 fail-closed | **NO** | 17/40 |
| 3 | 向导目录 `/admin/guides` | — | **≠** 入驻主审 | 台账/申请三角易混 | **NO** | guidesTriangleL5 |
| 4 | 订单 `/admin/orders` | 对比度 P0 | 只读列表 | UI 标缺失源；列表 API 有 items | **NO** | 17/40 · orders-q marker |
| 5 | 争议 `/admin/disputes` | 对比度 P0 | 只读裁决台 | **API `source=memory`** | **NO** | 16/40 · live probe |
| 6 | 入驻中心 `/admin/onboarding` | 对比度 P0 | FP-D 审卡+Stripe 壳 | Stripe 台账≠审闭环 | **NO** | 17/40 · B13-09p |
| 7 | 向导申请 `/admin/guide-applications` | — | 列表 OK；详/审 **裂脑风险** | 列表可 PG；详 memory-only | **NO** | HU-491 · 能力 Q1 |
| 8 | 商家申请 | — | ① 全链接近 | 须 ② 真人闭环复验 | **PARTIAL→NO** | 能力 Q4 4.5/5 |
| 9 | 主理人申请 | — | 审批有；材料弱 | 材料链弱于商家 | **PARTIAL→NO** | 能力 Q5 4.0/5 |
| 10 | 内容 `/admin/content` | 中 | Hub 瓷砖 | CMS↔官网氛围 PARTIAL | **NO** | 21/40 |
| 11 | 官方 `/admin/official` | 中 | 枢纽壳 / 子叶真写缺口 | KPI 样本上限 | **NO** | 19/40 |
| 12 | 增长 `/admin/growth` | 中 | 运营中心可进 | KPI 真 overview 未满分 | **NO** | 20/40 |
| 13 | 财务 `/admin/finance-suite` | **最差对比度** | 只读导航过载 | 头寸未部署 · Treasury null | **NO** | **13/40** |
| 14 | 平台设置 `/admin/config` | 对比度 P0 | 壳导航 | Final Truth PARTIAL cite | **NO** | 20/40 |

**全域发布级总判：** **`NO`**（0/14 叶达发布级 YES）

---

## A · Admin UI/UX 发布级检查

| 检查项 | 结论 | 严重度 | 定位 |
|--------|------|--------|------|
| 字体/背景对比度 | **FAIL** · 多叶 `text-ink-500/600` · `text-slate-300/400` 贴暗底 | **P0** | 财务/争议/入驻/用户/订单（B13 叶审计） |
| 暗色主题可读性 | **FAIL** · 二级说明易「消失」 | **P0** | 同左 |
| 二级文字消失 | **FAIL** | **P0** | finance 七步说明；users capability 副文 |
| 卡片密度 | **FAIL** · 财务/工作台过密 | **P1** | finance-suite · workbench chrome |
| 排版层级 | **PARTIAL** · CTA/预览簇抢主强调 | **P1** | shell 顶栏 |
| 空态/错误/加载 | **PARTIAL** · 加载「正在加载管理员权限」OK；空态词典不统一 | **P2** | 全域 |
| 响应式 | **未本轮全测** · 标 **OPEN** | **P2** | HU-568 待测 |
| CTA 层级 | **PARTIAL** | **P1** | 财务多套导航；工作台特权 CTA |
| 死按钮/假入口 | **PARTIAL** · 灰域可点但无 live KPI；财务多入口重复 | **P1** | workbench 域灯 · finance |

---

## B · 业务功能真实性（入驻三角 + 多身份）

### B1 向导申请

| 步 | 结论 | 证据 |
|----|------|------|
| 提交 | **① YES**（公开申请链存在） | 能力审计 |
| 列表审核入口 | **YES** | `GET …/guide-applications` 200 · items |
| 通过/拒绝/补件 | **PARTIAL** | PATCH 有；详单 memory 可裂脑 → **P0 HU-491** |
| 资质查看 | **PARTIAL** | 证件 URL；护照明文永不回传（哈希） |
| 审核历史 | **PARTIAL** | 有字段；跨源一致性未发布级 |
| 状态流转 | **PARTIAL** | 三角（申请/目录/CMS）易误用 |

### B2 商家申请

| 步 | 结论 |
|----|------|
| 企业/服务资料 | **① 接近 YES** |
| 审核链路 | **① YES**（列表 200 · 材料预览·准驳） |
| 权限边界 | **PERM_ONBOARDING_REVIEW** · C2 禁 Admin |
| 发布级 | **仍须 ② 真人端到端复验** → 本包 **不写 PASS** |

### B3 区域主理人

| 步 | 结论 |
|----|------|
| Seat/申请列表 | **YES**（API 200） |
| 材料查看 | **WEAK / PARTIAL**（弱于商家证照链） |
| 审批 | **YES 动作** |
| 状态真实性 | **PARTIAL** |

### B4 多身份

| 步 | 结论 |
|----|------|
| 一用户多身份 | **PARTIAL**（`multi-demo@test.com` 同现 provider+steward approved 样本） |
| 关系展示 / 归档 / 审核记录 | **未达发布级专页闭环** · **P1** |

---

## C · 数据真实性

| 检查 | 结论 | 严重度 |
|------|------|--------|
| 官网 ↔ Admin | **PARTIAL** · 内容/官方氛围未 Live 满分 | **P1** HU-489 系 |
| CMS ↔ Catalog | **PARTIAL** · PAGE_SURFACE_DRIFT（Unsplash）= ED · 非 FP 否决 | **P2** |
| Runtime ↔ Registry | **PARTIAL** | **P1** |
| Feature Inventory ↔ 实能力 | Inventory PASS **≠** Admin 发布级 YES | **P0（叙事）** |
| mock / memory 假绿 | **禁假绿大体做到**；但 **争议 API 明示 memory** · 工作台经营 memory | **P0** |
| Web bake ≠ API build | `67a6ccba` vs `892c20c8` | **P0**（部署对齐） |
| `meta.source` 空 | 多叶 UI fail-closed 诚实 · **仍挡发布** | **P0** |
| Treasury | `/meta` `treasury_address: null` · UI「链上未部署」 | **P1**（诚实空 · 非假零） |

---

## D · 财务域专项

| 检查 | 结论 |
|------|------|
| 入口是否过多 | **YES · 严重重复**（待办·三轨·七步·磁贴·模块目录并存） |
| 重复展示 | **YES** |
| 是否只读 | **YES** · UI「对账只读」· `FINANCE_WRITE` **FORBIDDEN** |
| 是否误导资金操作 | **风险 PARTIAL** · 「完整权限」类文案曾误导（B13） |
| USDC/TTG/Treasury/Escrow 一致 | **头寸未部署** · Treasury null · 与 PSG-EGM **只读叙事对齐** · **≠** 资金可发 |
| 禁止 FINANCE_WRITE | **遵守** |
| 叶分 | **13/40** · Admin 最低 |

---

## E · 权限与安全

| 角色 | 能看 Admin | 能改 | 能审批入驻 | 备注 |
|------|------------|------|------------|------|
| SuperAdmin | **YES**（探针） | 视 perm | YES | ephemeral ≠ Business GO |
| Admin / Operator | 设计有 console 视角 | 视 perm | 视 `ONBOARDING_REVIEW` | 本轮未逐角色矩阵打满 → **P1 缺口** |
| Provider / Guide / Steward | **业务面** · **非**超管台 | 否 Admin 列表 | 否 | C2 tourist **403** 已证 |
| 资金写 | **全角色 FORBIDDEN（本批）** | — | — | PSG-EGM |

**权限维发布级：** 边界硬闸 **部分 PASS** · **全角色交叉矩阵未闭** → 总分扣分。

---

## F · 发布评分（五维 × 40 · **真实分 · 禁止凑满**）

映射规则：每维 40 = 发布级可签；分数来自 **B13 已审计八维/能力/叶分 + 本轮 Staging 实探**，**不**发明新假分。

```text
Admin Release Audit Score

UI/UX         18/40   ← 对比度 P0 全域；财务最差；B12 走廊满分不可冒充全域
功能完整性     22/40   ← 商家接近；向导裂脑；主理人材料弱；多身份未闭环
数据一致性     14/40   ← memory 争议；meta.source 空；Web≠API SHA；经营 memory
权限安全       28/40   ← C2 403 PASS；FINANCE_WRITE FORBIDDEN；角色全矩阵未验满
业务闭环       19/40   ← 入驻三角/申请↔目录混用；官网↔Admin Live 未满分

Total: 101/200
PASS / NEED_FIX / BLOCKED  →  NEED_FIX
（发布级门闩：任一 P0 未关 → 不得 PASS；本包 P0 仍 OPEN → NEED_FIX）
```

| 叶页旁证（/40 · B13） | 分 |
|------------------------|-----|
| 工作台 | 24 |
| 用户 | 17 |
| 订单 | 17 |
| 争议 | 16 |
| 入驻 | 17 |
| 内容 | 21 |
| 官方 | 19 |
| 增长 | 20 |
| 财务 | **13** |
| 设置 | 20 |
| 能力六问 | **21/30** |

---

## ADMIN_RELEASE_REALITY_AUDIT · 最终产出

### 1 · 已通过项（真 PASS · 窄）

- tip / Hard Gate / Cutover / GO：**未触碰** · 仍 LOCKED / NO_GO  
- C2 → Admin API：**403 `admin_required`**  
- SuperAdmin 可进工作台与叶页（FP-E 复截）  
- 财务中心 UI 声明只读 · **未开放 `FINANCE_WRITE`**  
- 多叶对 `meta.source` 缺失采用 **fail-closed**（诚实 · 非假绿）  
- FP-A～D markers Staging **8/8**（bake `67a6ccba`）  
- Provider / Steward / Guide **列表 API 可达**（≠ 发布级闭环 PASS）  
- Batch-12 工作台/目录走廊 **40/40 CERT** 历史保留（**≠** 本全域发布）

### 2 · P0 / P1 / P2 / P3 问题

| ID | Sev | 问题 | 建议处置（只修不一致 · 不新开功能） | 关联 |
|----|-----|------|--------------------------------------|------|
| **HU-568** | **P0** | Web bake `67a6ccba` ≠ API `892c20c8` | PCR 对齐 API 部署或明示双 SHA 风险条 | 本审计 |
| **HU-569** | **P0** | 争议列表 **memory** 源 | 接正式库或全域禁经营签收 | live `source=memory` |
| **HU-491** | **P0** | 向导详/审 memory 与 PG 列表裂脑 | 统一读源（既有升级 · 不新功能） | B13 |
| **HU-570** | **P0** | 多叶 `meta.source` 空 + UI fail-closed | 后端补 source 标注 | users/orders UI |
| **对比度簇** | **P0** | 财务/争议/入驻/用户/订单灰字贴底 | FP-A 对比度修复未满分 | B13 叶 |
| **HU-495** | **P0** | 能力 21/30 未满分 | 另口令 · **禁止本会话关闭** | B13 |
| **HU-487** | **P0** | 工作台 24/40 | 另口令 · **禁止本会话关闭** | B13 |
| **HU-490** | **P0** | 发布级签收闸 | **禁止本会话签收** | B13 |
| **HU-571** | **P1** | 财务多套导航重复 | 合并为唯一主导航（既有 FN） | finance 13/40 |
| **HU-572** | **P1** | 申请/目录/CMS 三角误用 | 文案/入口收敛（既有） | guidesTriangle |
| **HU-573** | **P1** | 多身份关系展示/归档不足 | 补齐展示一致性（非新业务） | multi-demo 样本 |
| **HU-574** | **P1** | 全角色权限交叉矩阵未验满 | Super/Ops/CS/Risk/Finance/Auditor 探针表 | §E |
| **HU-575** | **P2** | 响应式/移动端未系统测 | 补测记入 B14 | §A |
| **HU-576** | **P2** | PAGE_SURFACE_DRIFT Unsplash | ED · 不挡 FP · 另轨 CMS | deploy post |
| **HU-577** | **P3** | 空态词典不统一 | 文案字典对齐 | 全域 |

### 3 · 缺失能力（相对发布级 · 非「代码零」）

- 向导：**统一正式库**详单/审核读路径  
- 争议/订单经营：**正式库 source** 与 KPI  
- 官网↔Admin **Live** 对照矩阵 100%  
- 财务：**合并后的只读作业面**（非再堆入口）  
- 全角色 **审批/只读** 交叉证明包  

### 4 · 多余能力 / 重复

- 财务：今日待办 + 三轨 + 七步 + 磁贴 + 模块目录 **重复导航墙**  
- 向导：**申请队列 vs 目录台账 vs CMS 攻略** 三入口认知多余  
- Shell：环境/预览/视角簇过密（B13 chrome）  

### 5 · 数据断链

- 争议：**memory**  
- 工作台经营订单/争议/向导库存：**memory / 暂无统计**  
- users/orders UI：**meta.source 空**  
- Web↔API：**SHA 分裂**  
- Treasury：**未部署 null**（诚实空）  
- 向导列表 PG ↔ 详情 memory  

### 6 · UI 问题截图定位

| 问题 | 截图 |
|------|------|
| 工作台特权/待办 | `…/batch13-screenshots/B13-06p-workbench.png` |
| 用户 meta 空 + 对比度 | `B13-06p-users.png` |
| 订单只读 + q marker | `B13-07p-orders.png` |
| 争议 | `B13-08p-disputes.png` |
| 入驻审卡+Stripe 壳 | `B13-09p-onboarding.png` |
| 内容/官方/增长 | `B13-10p`～`12p` |
| 财务只读+导航墙 | `B13-13p-finance.png` |
| 平台设置 | `B13-14p-config.png` |

### 7 · 修复优先级（只修 Baseline 不一致 · **不开新功能**）

1. **P0 数据诚实：** API/Web SHA 对齐说明或部署 · 争议/经营去 memory 或全域禁签收 · 向导读源统一 · `meta.source`  
2. **P0 对比度：** 财务优先 → 争议/入驻/用户/订单  
3. **P1 财务导航合并**（只读）· 三角入口收敛  
4. **P1 权限交叉矩阵** 探针入证  
5. **P2** 响应式 · CMS drift ED 分轨  
6. **另口令** 再评 HU-495/487；**另口令** 签收 HU-490  

### 8 · Release 前必须关闭项

| # | 必须关闭 | 状态 |
|---|----------|------|
| 1 | 全部 **P0**（本表 HU-568/569/570 + 491 + 对比度簇） | **OPEN** |
| 2 | HU-**495** 能力 30/30 | **OPEN** · 禁本会话关 |
| 3 | HU-**487** 工作台 40/40 | **OPEN** · 禁本会话关 |
| 4 | 财务叶 **≥ 发布只读满分门槛**（目标 40/40 只读） | **OPEN**（现 13） |
| 5 | 争议/订单 **非 memory 经营签收** | **OPEN** |
| 6 | HU-**490** Owner 发布级签收 | **OPEN** · **另口令** |
| 7 | Hard Gate / Cutover / tip / GO | **保持 LOCKED / immobile / NO_GO**（**不**用解锁凑分） |

---

## 机器摘要

```text
TT_ADMIN_BATCH14_ADMIN_RELEASE_REALITY_AUDIT: NEED_FIX
TT_ADMIN_BATCH14_RELEASE_GRADE: NO
TT_ADMIN_BATCH14_SCORE_UI_UX: 18/40
TT_ADMIN_BATCH14_SCORE_FUNCTION: 22/40
TT_ADMIN_BATCH14_SCORE_DATA: 14/40
TT_ADMIN_BATCH14_SCORE_AUTH: 28/40
TT_ADMIN_BATCH14_SCORE_LOOP: 19/40
TT_ADMIN_BATCH14_SCORE_TOTAL: 101/200
TT_ADMIN_BATCH14_VERDICT: NEED_FIX
TT_ADMIN_BATCH13_HU_495: OPEN
TT_ADMIN_BATCH13_HU_487: OPEN
TT_ADMIN_BATCH13_HU_490: OPEN
TT_FINANCE_WRITE: FORBIDDEN
TT_TIP_IMMOBILE: true
TT_HARD_GATE: LOCKED
TT_CUTOVER: LOCKED
TT_PRODUCTION_GO: NO_GO
```
