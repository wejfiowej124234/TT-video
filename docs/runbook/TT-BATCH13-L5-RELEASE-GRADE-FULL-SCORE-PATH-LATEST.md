# Batch-13 · L5 发布级满分路径（每维必须 5.0）

**Machine:** `TT_ADMIN_BATCH13_L5_RELEASE_GRADE_FULL_SCORE_PATH`  
**Stamp:** `20260726T090000Z`  
**Status:** **TARGET_PATH · FIX_NOT_STARTED**（方案已入册 · 等「开始第 13 批集体改」）  
**Owner 要求：** 目标 **必须满分** · 八维每维 **5.0** · 能力六问每问 **5.0** · **叶页各 40/40** · **必须具备**入驻/概况真能力 · L5 发布级  
**当前基线：** 八维 [`RELEASE-GRADE-AUDIT`](./TT-BATCH13-WORKBENCH-RELEASE-GRADE-ENTERPRISE-AUDIT-LATEST.md) · **24/40** · 能力 [`SYSTEM-CAPABILITY`](./TT-BATCH13-SYSTEM-CAPABILITY-RELEASE-AUDIT-LATEST.md) · **21/30** · 发布级 **NO** · OPEN **90**  
**能力细致方案：** [`CAPABILITY-FULL-SCORE-UPGRADE`](./TT-BATCH13-CAPABILITY-FULL-SCORE-UPGRADE-PLAN-LATEST.md) · **TARGET_PLAN**  
**未满分总账：** [`NOT-FULL-SCORE-BACKLOG`](./TT-BATCH13-NOT-FULL-SCORE-BACKLOG-AND-UPGRADE-LATEST.md) · 八维 **0/8** 达 5.0  
**覆盖核对（100% 已审计面）：** [`FULL-SCORE-COVERAGE`](./TT-BATCH13-FULL-SCORE-COVERAGE-GAP-CLOSURE-LATEST.md)  
**范围：** 工作台 · 目录 · 顶栏 · 系统概况 · 经营明细 · 向导/商家/主理人入驻 · Admin↔官网 · **用户/订单/争议/入驻中心/内容/官方/增长/财务/平台设置**  
**Patch：** `PATCH-STG-017`  
**JSON：** [`TT-BATCH13-L5-RELEASE-GRADE-FULL-SCORE-PATH-LATEST.json`](./TT-BATCH13-L5-RELEASE-GRADE-FULL-SCORE-PATH-LATEST.json)  
**OPEN：** [`TT-BATCH13-OPEN-RECORDING-LATEST`](./TT-BATCH13-OPEN-RECORDING-LATEST.md)  
**≠ Production GO · ≠ Hard Gate unlock · ≠ Cutover · 资金禁写 · tip immobile**

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · 「满分 / L5 发布级」写死（不许降级）

```text
L5 发布级满分（② Staging 宣称）=
  工作台八维全部 5.0（40/40）
  + 能力六问全部 5.0（30/30）
  + 已审计叶页各 40/40（用户·订单·争议·入驻·内容·官方·增长·财务只读·平台设置）
  + 各功能清单 PASS（F/FO/FD/OH/CC/OO/GH/FN/CF）
  + OPEN P0/P1/P2 = 0            ← 满分不许 DEFER
  + 性能 SLA PASS（实测）
  + Admin↔官网关键路径可指证
  + Staging 复验截图 PASS
  + Owner「发布级签收（②）」

仍 ≠ Hard Gate PASS ≠ Cutover ≠ Production GO ≠ 主网已部署
Batch-12 走廊 CERT ≠ 本批 L5 发布级满分
覆盖证明 → FULL-SCORE-COVERAGE-GAP-CLOSURE
```

| 项 | 当前 | **满分目标（硬）** |
|----|------|-------------------|
| 工作台八维 | **24 / 40** | **40 / 40** |
| 能力六问 | **21 / 30** | **30 / 30** |
| 叶页（最低财务） | **13～21 / 40** | **各 40 / 40** |
| OPEN HU | **90** | **0** |
| 发布级（Owner） | **NO** | **YES（② Staging）** |
| Production GO | **NO_GO** | 仍 **NO_GO** |

**总闸：** **487**（工作台）+ **495**（能力）+ 叶页闸 **502～567** + 签收 **490**。  
**DEFER ≠ 满分。**

---

## 1 · 八维 · 每维 5.0 验收尺子（升级目标）

| # | 维 | 现分 | **5.0 验收句（必须同时满足）** | 现状缺口 → 升级动作 | 闭合 HU |
|---|-----|------|-------------------------------|---------------------|---------|
| 1 | **视觉 / Brand** | 3 | 暖金为**唯一主强调**；Inbox CTA 为次级（不压 TravelTrust/工作台 H1）；卡片/条半径/描边同源；顶栏不抢戏 | 降级橙条视觉权重 · 品牌词标稳定在首屏视线内 | **485** · **479** |
| 2 | **字体 / 颜色** | 3 | H1→正文→meta 三级；关键诚实信息不用「极小灰」；域态绿/黄/灰对比清晰且**有运营语义**（非整墙灰） | 域态色板 + 字阶锁定 · 灰态改「就绪空态」设计 | **480** · **482** |
| 3 | **排版 / IA** | 4 | 首屏一件事=待办指挥；顶栏三枢纽与侧栏五组**认知同构**（入驻可发现）；推荐序不挤；Chrome 控件簇收敛 | 顶栏瘦身 · 入驻发现性 · 推荐序改条/步进 | **479** · **486** · **442-style** |
| 4 | **文案 / 诚实** | 4 | 运营向短句；「链」显示网络名+chain_id 注解；经营明细 ≤3 行产品句；工程师细节折入手册/高级 | 改写明细盒 · 折叠条文案 · 空态词典统一 | **482** · **483** · **484** |
| 5 | **功能畅通** | 3 | 五队列速览空态统一（0/设计空）；库存有数或设计空态；域灯可点且落点正确；双控/举报可解释 | 空态统一 · 库存 API/空态 · 域深链 | **481** · **484** · **480** |
| 6 | **性能** | 3 | Inbox 首包与概况展开有 **SLA 实测 PASS**（写进证据）；写后三钩齐刷；无明显长任务阻塞首屏 | 加测探针 · 概况懒加载/分段 · 证据入册 | **488**（新） |
| 7 | **官网功能对应** | 2 | **对照表 100%** 关键族有 Admin 入口+状态+Staging Live 截图；灰仅允许「信号未推·设计说明」且可一键打开官网/中心 | 建对照矩阵 · Live 复截图 · 域态升级 | **489**（新）· **480** |
| 8 | **发布就绪感** | 2 | 特权比叙事可信（种子清洗或「演示数据」明示+周复核可关）；资金池设计空态（未部署≠故障感）；Chrome 像运营台；Owner 可签「发布级②」 | 特权治理 · 空态升级 · 顶栏运营化 | **478** · **479** · **490**（新闸叙事） |

**金样板口诀（发布级写死）：**  
先 **可信待办** → 再 **可信真数（一处）** → 域态**有语义** → 官网路径**可指证** → 资金**诚实空态** → Chrome**不抢戏**。

---

## 2 · 现分 → 5.0 · 逐维优化升级方案（细则）

### 维 1 · 视觉 / Brand（3 → 5）

| 步骤 | 动作 | 验收 |
|------|------|------|
| 1.1 | Inbox 顶条改为**次级条**（描边金/中性底 · 取消高饱和橙满宽，或降为待办卡内主 CTA） | 首屏品牌/H1 不被橙条压过 |
| 1.2 | TravelTrust 词标在二级栏保持稳定字重；「管理后台」降为环境前缀或合并文案 | Brand test：去导航后仍像 TravelTrust |
| 1.3 | 卡片/折叠条圆角、边框、玻璃同源 token | 无混用半径/双描边 |

**闭合：** HU-485 · HU-479（Chrome 视觉）

### 维 2 · 字体 / 颜色（3 → 5）

| 步骤 | 动作 | 验收 |
|------|------|------|
| 2.1 | 锁定字阶：H1 工作台 · 节题 · 正文 · meta | 截图字阶不乱 |
| 2.2 | 域态：有待办=黄 · 健康有信号=绿 · **无信号=设计灰文案「待接入信号」**（非整墙死灰） | 不再「整页未就绪」感 |
| 2.3 | 特权告警红保留，但与脏数治理联动（维 8） | 告警可读且可信 |

**闭合：** HU-480 · HU-482（字阶/可读）

### 维 3 · 排版 / IA（4 → 5）

| 步骤 | 动作 | 验收 |
|------|------|------|
| 3.1 | 顶栏：环境/预览合并一 pill；角色与视角次级化；运营默认不露工程「控制台视角」（或维护者折叠） | Chrome 控件 ≤3 主可见 |
| 3.2 | 顶栏枢纽与侧栏：书面同构图（经营⊃用户/订单… · 入驻可从顶栏「经营」或工作台到达） | HU-486 闭合说明入册 |
| 3.3 | 推荐顺序：改为横向步进或「当前=1」高亮，避免 5 pill 挤满 | 不换行破碎 |

**闭合：** HU-479 · HU-486

### 维 4 · 文案 / 诚实（4 → 5）

| 步骤 | 动作 | 验收 |
|------|------|------|
| 4.1 | 折叠条：`网络 Sepolia（chain_id 11155111）` · 禁裸「链 11155111」 | HU-483 |
| 4.2 | 经营明细信息盒 → **≤3 行运营句** +「详见操作手册」链 | HU-482 |
| 4.3 | 速览空态词典：统一 `0` 或统一「暂无」· 禁止混用「—」无说明 | HU-484 |
| 4.4 | 保留诚实：API 上限 · 禁资金写 · 灰≠故障 · **改写为运营短句** | 不删诚实 · 只改可读 |

### 维 5 · 功能畅通（3 → 5）

| 步骤 | 动作 | 验收 |
|------|------|------|
| 5.1 | 向导库存：接统计 API **或** L5 设计空态（插画/一句产品空态 · 非「暂无统计」工程句） | HU-481 |
| 5.2 | 双控/举报：0 与深链可点；无权限则产品句说明 | HU-484 · 功能测 |
| 5.3 | 全站域按钮：一键进中心；黄=需处理可复现 | HU-480 |
| 5.4 | 待办 13 多点一致（条/卡/速览/概况）回归测 | 契约/烟测 |

### 维 6 · 性能（3 → 5）

| 步骤 | 动作 | 验收 |
|------|------|------|
| 6.1 | 新增探针：工作台首屏 / Inbox 打开 / 概况展开 · 记 p75 | **HU-488** 证据 PASS |
| 6.2 | 概况重块懒渲染或默认折叠保持；展开不卡交互 | SLA 表勾选 |
| 6.3 | 写后刷新不依赖整页硬刷（沿用 B12 软刷新纪律） | 无陈旧待办 |

**SLA（写死 · ② Staging）：** 首屏可交互 ≤ 目标阈值（入 HU-488 证据包；集体改时锁定数字）。

### 维 7 · 官网功能对应（2 → 5）

| 步骤 | 动作 | 验收 |
|------|------|------|
| 7.1 | 建立 **Admin↔官网对照矩阵**（内容/发布/增长/国家/入驻/订单/官方/财务观测） | **HU-489** 表 100% 行 |
| 7.2 | 每行：Admin 路由 · 官网路由 · 状态芯片 · Staging 截图路径 | Live 复截图 |
| 7.3 | 灰态仅允许「信号未推」+ CTA「打开中心/打开官网」 | 无死链 |
| 7.4 | 财务：未部署保持诚实空态 · **同时**官网/财务中心只读路径可指证 | 不假绿 |

### 维 8 · 发布就绪感（2 → 5）

| 步骤 | 动作 | 验收 |
|------|------|------|
| 8.1 | **P0** 特权比：Staging 种子清洗 **或** UI「演示/联调账号含测试超管」明示 + 周复核可关闭告警误读 | **HU-478** |
| 8.2 | 资金池：升级为设计空态（插画/「主网未部署 · 非故障」产品句 · 禁「录假零」工程感） | 与 Hard Gate 诚实并存 |
| 8.3 | Chrome 运营化（维 1+3） | HU-479 |
| 8.4 | Owner「发布级签收（②）」检查单勾满 | **HU-490** + 另口令签收 |

---

## 3 · 十四锚 · 升到「发布级可用」的方案（Admin 产品面）

| Anchor | 发布级目标态 | Batch-13 动作 |
|--------|--------------|---------------|
| Final Truth / Candidate / V3.1.1 / EGM | cite-only · tip 不动 | **禁止**平行真源 |
| PSG Governance | PARTIAL→**PASS（Admin）** | HU-478 特权叙事可信 + 双控路径可演示 |
| Product / Release Baseline | FAIL→**PASS（②）** | 本路径 40/40 + Owner 签收 |
| Engineering SSOT | PARTIAL→**PASS** | 构建信息可展开验 bake · 证据入册 |
| Release Integrity | PARTIAL→**PASS（预发布走廊）** | 预览/Sepolia 标签保留 · 无平行版本 |
| Delta Recertify | 集体改后 dry-run | 改码波次后跑 |
| Feature Inventory | PARTIAL→**PASS（Admin 切片）** | HU-489 对照 + 域态 |
| Reality Closure | PARTIAL→**PASS（②）** | 特权/空态/口径可信 |
| PRR | NOT_READY→**PREP_PASS（Admin）** | 发布级签收清单 |
| Hard Gate / Cutover | **保持 LOCKED** | UI 诚实未部署 · **禁止**本批解锁 |

---

## 4 · 执行波次（集体改序 · 满分不许跳）

```text
W13-0  能力轨     491 · 493 · 492 · 494
W13-1～5 工作台   478 → … → 488 · 489
W13-6a 叶页满分   用户496～503 → 订单504～511 → 争议 → 入驻 → 内容 → 官方 → 增长
W13-6b 财务只读   552～559（禁资金写）
W13-6c 平台设置   560～567（禁 HG 解锁）
W13-7  总闸签收   495 · 487 · 490
```

| 波 | HU | 目标 |
|----|-----|------|
| **W13-0** | **491 · 493 · 492 · 494** | 能力真审/真数 |
| W13-1～5 | 478～489 | 工作台八维起势 |
| **W13-6a** | **496～551** | 用户→增长各 **40/40**（**含订单 510·511**） |
| **W13-6b** | **552～559** | 财务 **40/40 只读** |
| **W13-6c** | **560～567** | 平台设置 **40/40** · CF1～CF12 |
| **W13-7** | **495 · 487 · 490** | 能力+工作台总闸+签收② |

**开修序 SSOT：** [`FAST-PATH`](./TT-BATCH13-FAST-PATH-REMEDIATION-PLAN-LATEST.md) **FP-A→E**（本文件 W13-* 仅为导读）。  
清单：[`NOT-FULL-SCORE`](./TT-BATCH13-NOT-FULL-SCORE-BACKLOG-AND-UPGRADE-LATEST.md) · 真源 cite：[`BATCH13-FINAL-TRUTH-CITE`](./TT-BATCH13-FINAL-TRUTH-BASELINE-CITE-LATEST.md)。  
细则见各 `*-FULL-SCORE-UPGRADE` · 覆盖 [`COVERAGE`](./TT-BATCH13-FULL-SCORE-COVERAGE-GAP-CLOSURE-LATEST.md)。

---

## 5 · 闸号索引（工作台 + 叶页）

| HU | P | 角色 |
|----|---|------|
| **487** | P0 | 工作台 L5 八维总闸 |
| **488** | P1 | 性能 SLA |
| **489** | P1 | 官网对应 |
| **490** | P1 | 发布级签收② |
| **495** | P0 | 能力 30/30 |
| **502·503** | P0 | 用户 40 + F1～F12 |
| **510·511** | P0 | **订单 40 + FO1～FO10（必须）** |
| **518·519** | P0 | 争议 |
| **526·527** | P0 | 入驻 |
| **534·535** | P0 | 内容 |
| **542·543** | P0 | 官方运营 |
| **550·551** | P0 | 增长 |
| **558·559** | P0 | 财务只读 |
| **566·567** | P0 | **平台设置 + CF1～CF12** |

**OPEN：** **90**（478～567）· 下一号 **HU-568**

---

## 6 · 验收清单（集体改完成后勾）

- [ ] 工作台八维 **40/40** · HU-487  
- [ ] 能力 **30/30** · HU-495  
- [ ] 用户/订单/争议/入驻/内容/官方/增长/财务/平台设置 **各 40/40**  
- [ ] **订单 FO1～FO10** · **平台设置 CF1～CF12**  
- [ ] P0/P1/P2 = 0 · OPEN=0  
- [ ] 财务无资金写 · 平台设置无 HG 解锁 CTA  
- [ ] HU-490 Owner「发布级签收（②）」  
- [ ] Hard Gate LOCKED · Cutover LOCKED · `TT_PRODUCTION_GO: NO_GO`

---

## 7 · Owner 口令

| 步 | 口令 |
|----|------|
| 现 | 方案已入 Batch-13 · **只记不改** · 覆盖 **100%** |
| 开修 | **「开始第 13 批集体改」** |
| 满分复验 | 「验 Batch-13 发布级满分」 |
| 签收 | 「Batch-13 发布级签收（②）」· **≠** Production GO |

```text
TT_ADMIN_BATCH13_L5_RELEASE_GRADE_FULL_SCORE_PATH: ACTIVE
TT_ADMIN_BATCH13_SCORE_NOW: 24/40
TT_ADMIN_BATCH13_SCORE_TARGET: 40/40
TT_ADMIN_BATCH13_LEAF_PAGES_IN_PATH: YES
TT_ADMIN_BATCH13_COVERAGE_PACK: ACTIVE
TT_ADMIN_BATCH13_SYSTEM_CAPABILITY_SCORE: 21/30
TT_ADMIN_BATCH13_SYSTEM_CAPABILITY_TARGET: 30/30
TT_ADMIN_BATCH13_RELEASE_GRADE: NO
TT_ADMIN_BATCH13_RELEASE_GRADE_TARGET: YES_②
TT_ADMIN_BATCH13_GATE_487: OPEN
TT_ADMIN_BATCH13_GATE_495: OPEN
TT_ADMIN_BATCH13_GATE_566: OPEN
TT_ADMIN_BATCH13_GATE_567: OPEN
TT_ADMIN_BATCH13_OPEN_COUNT: 90
TT_ADMIN_BATCH13_NEXT_HU: 568
TT_ADMIN_BATCH13_FIX: NOT_STARTED
TT_HARD_GATE_LOCKED: true
TT_CUTOVER_LOCKED: true
TT_PRODUCTION_GO: NO_GO
叶页+工作台+能力可满分（②）· ≠ Production GO
```
