# Batch-13 · 能力满分升级方案（必须具备 · 每问 5.0 · 细致执行）

**Machine:** `TT_ADMIN_BATCH13_CAPABILITY_FULL_SCORE_UPGRADE_PLAN`  
**Stamp:** `20260726T071500Z`  
**Status:** **TARGET_PLAN · FP-B_CODE_LANDED（①）** · Q1-A/B + Q6-A/B/D 已落码 · **≠ Q1/Q6=5.0**（须 ② Staging） · 见 [`FP-B-CAPABILITY`](./TT-BATCH13-FP-B-CAPABILITY-BLOCKERS-LATEST.md)  
**Owner 硬要求：**

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

```text
必须满分 · 必须具备：
  审批向导 · 查看向导提交资料 · 与申请页资料对齐
  商家入驻 · 区域主理人审核
  系统概况全部真实数据（禁止假数/假占位充绿）
不允许 PARTIAL 冒充「具备」· 不允许 4.x 冒充 5.0 · DEFER ≠ 满分
```

**基线：** [`SYSTEM-CAPABILITY-AUDIT`](./TT-BATCH13-SYSTEM-CAPABILITY-RELEASE-AUDIT-LATEST.md) · **21/30** · 发布级 **NO**  
**八维并行：** [`L5-FULL-SCORE-PATH`](./TT-BATCH13-L5-RELEASE-GRADE-FULL-SCORE-PATH-LATEST.md) · **24/40**  
**未满分总账：** [`NOT-FULL-SCORE-BACKLOG`](./TT-BATCH13-NOT-FULL-SCORE-BACKLOG-AND-UPGRADE-LATEST.md) · 能力 **0/6** 问达 5.0  
**双满分硬闸（写死）：**

| 闸 | 目标 | HU |
|----|------|-----|
| 八维 L5 | **40/40**（每维 5.0） | **487** |
| 能力六问 | **30/30**（每问 5.0） | **495** |
| 发布级签收（②） | 两闸皆 PASS + 材料 | **490** |

**JSON：** [`TT-BATCH13-CAPABILITY-FULL-SCORE-UPGRADE-PLAN-LATEST.json`](./TT-BATCH13-CAPABILITY-FULL-SCORE-UPGRADE-PLAN-LATEST.json)  
**Patch：** `PATCH-STG-017` · **≠ Production GO · ≠ Hard Gate unlock · ≠ Cutover**

---

## 0 · 「必须具备」验收定义（不许降级）

对每一问，**5.0 = 必须同时满足**：

1. **代码 SSOT 单一**（有 PG 时读/写一致 · 无 memory 裂脑）  
2. **Admin UI 可完成完整动作**（列表→详情→材料→批准/驳回/补件）  
3. **与公网提交面对齐**（字段/材料矩阵 100% 可勾）  
4. **Staging 真人证据**（截图 + 可选烟测 · ②）  
5. **机读契约**（动到的 vitest / admin L5 绿集 exit 0）  
6. **运营可读**（非工程师墙 · 空态为设计空态非脏空）

```text
① 有页面 ≠ 5.0
① PARTIAL ≠ 「具备」
② 真人复验未证 ≠ 发布级满分
③ Production GO 另闸 · 本方案不宣称
```

| 问 | 现分 | **满分目标** | 现结论 | 满分后必须宣称 |
|----|------|--------------|--------|----------------|
| Q1 审批向导 | 3.0 | **5.0** | PARTIAL | **具备** |
| Q2 查看资料 | 3.5 | **5.0** | PARTIAL | **具备** |
| Q3 字段对齐 | 3.5 | **5.0** | PARTIAL | **对齐** |
| Q4 商家入驻 | 4.5 | **5.0** | YES① | **具备（②证）** |
| Q5 主理人审核 | 4.0 | **5.0** | PARTIAL 材料 | **具备** |
| Q6 概况全真数 | 2.5 | **5.0** | NO | **全真或签收设计空** |
| **合计** | **21** | **30** | — | **RELEASE YES（②）** |

---

## 1 · Q1 · 审批向导（3.0 → 5.0）· HU-491 · HU-492

### 1.1 目标能力（必须）

Admin 可对任意 Staging 申请行：**打开详情 → 看齐材料 → 标审中 / 补件 / 批准 / 驳回 → 角色升 `guide`（批准时）→ 列表状态同步**，且 **重启 API / 多实例读 PG 不丢**。

### 1.2 根因

| # | 根因 | 证据 |
|---|------|------|
| R1 | `GET …/users/:id/guide-application` **只读 memory** | `get_guide_application_for_user_admin_impl` |
| R2 | 列表可走 PG · 详情/审核可裂脑 | `list_guide_applications_admin_impl` vs detail |
| R3 | 双审面：`/admin/guide-applications` vs `/admin/guides/[id]` | 权限/副作用不一致 |

### 1.3 细致步骤

| 步 | 动作（文件锚） | 完成定义 |
|----|----------------|----------|
| **Q1-A** | 详情 GET：有 `db_pool` 时从 `role_applications`（kind=guide）+ `role_documents` / guides 表拼出与 FE 卡同形 payload；无池才 fallback memory | Staging 列表有行 → 详情 **永非** `application:null`（除非真删除） |
| **Q1-B** | 审核 PATCH：先写 PG SSOT（状态/驳回码/升角色）再同步 memory；失败 **fail-closed**（非 silent best-effort only） | 批准后 `users.role=guide` 在 PG 可查 |
| **Q1-C** | 提交路径双写校验：`/guide/register` → `role_applications` 行必存在 | 新提交 100% 可被 Admin 列表+详情命中 |
| **Q1-D** | **唯一主审面** = `/admin/guide-applications/[id]`；`/admin/guides/[id]` 注册审卡改为「监管态」并文案禁止当入驻主审（或深链到申请队列） | HU-492 · 三角条文案更新 |
| **Q1-E** | 状态词统一：队列 filter ↔ 审卡 ↔ PG enum 一张表（pending_review / reviewing / needs_more_info / active / rejected） | 无「列表 active / 卡 pending」错位 |
| **Q1-F** | 契约测试：PG fixture 列表→详情→PATCH→再 GET | `cargo test` 相关 + FE contract |
| **Q1-G** | Staging：C 账号提交向导 → Admin 批准 → 截图入 `batch13-capability/` | ② 证据 |

**5.0 验收句：** 「发布环境有 PG 时，向导入驻审批端到端可证，无裂脑。」

---

## 2 · Q2 · 查看向导提交资料（3.5 → 5.0）· 随 HU-491 + 材料卡增强

### 2.1 目标能力（必须）

审卡上运营可核对申请人提交的**全部运营可见材料**（含预览），并明确哪些字段因合规**故意不可见**。

### 2.2 细致步骤

| 步 | 动作 | 完成定义 |
|----|------|----------|
| **Q2-A** | 审卡渲染矩阵与 API 对齐：city · country · languages · service_types · bio · wallet · real_name · 三证 URL · submitted_at · status | 有值必显 |
| **Q2-B** | `avatar_url`：有则显示缩略图；无则隐藏（禁止空白占位块） | 无死字段 |
| **Q2-C** | 护照/证件号：**不回传明文**（合规）· UI 增加诚实行「证件号已哈希存证 · 请以证件照片核对」+ 可选 `passport_hash_present: true` | 运营不误以为漏传 |
| **Q2-D** | 三证全部走 `AdminAuthDocPreviewLink` · 破链有错误态（非静默） | 可点开预览 |
| **Q2-E** | 列表行保持摘要；详情为材料 SSOT（HU-362 不回流） | 列表不堆材料 |

**5.0 验收句：** 「详情页材料可审 · 合规不可见字段有诚实说明 · 无假占位。」

---

## 3 · Q3 · 与 `/guide/register` 对齐（3.5 → 5.0）

### 3.1 字段对齐母表（满分必须 100% 勾完）

| 申请页字段 | 落库 | Admin 展示 | 满分动作 |
|------------|------|------------|----------|
| city | ✅ | ✅ | 保持 |
| country_code | ✅ | ✅ | 保持 |
| languages[] | ✅ | ✅ | 保持 |
| service_types[] | ✅ | ✅ | 保持 |
| bio | ✅ | ✅ | 保持 |
| wallet_address | ✅ | ✅ | 保持 |
| real_name | ✅ | ✅ | 保持 |
| passport / idNumber | hash only | 诚实说明行 | **Q2-C** |
| idType（草稿） | ❌ 未落库 | — | **Q3-A：落库或从申请页移除草稿**（二选一 · 禁止幽灵字段） |
| id_photo_url | ✅ | ✅ 预览 | 保持 |
| language_cert_url | ✅ optional | ✅ | 保持 |
| guide_license_url | ✅ optional | ✅ | 保持 |
| hourly_rate | 申请页不采 | 审卡可显 | **Q3-B：申请页不采则审卡标注「入驻后/档案字段」或隐藏** |
| avatar | 申请页不采 | 类型有 | **Q2-B** |

| 步 | 动作 | 完成定义 |
|----|------|----------|
| **Q3-A** | `idType`：要么写入 `role_applications`/guides payload 并 Admin 展示，要么从 register draft UI 删除 | 无幽灵 |
| **Q3-B** | 审卡字段分组：「入驻提交」vs「档案扩展」 | 运营不混淆 |
| **Q3-C** | 机读：`guideRegisterSubmit` 字段表 ↔ `AdminGuideApplicationReviewCard` 断言同集 | contract test |
| **Q3-D** | Staging 对照截图：申请页最后一步 vs Admin 详情 | 入册 |

**5.0 验收句：** 「对齐母表 100% · 无幽灵字段 · Staging 对照可证。」

---

## 4 · Q4 · 商家入驻（4.5 → 5.0）· HU-490 证据轨

### 4.1 目标能力（必须）

公网 `/provider/register` → Admin `/admin/provider-applications` → 材料预览 → 批准/驳回/补件 → `users.role=provider` · **Staging 可重复演示**。

### 4.2 细致步骤（代码已基本 YES · 冲满分差证据与打磨）

| 步 | 动作 | 完成定义 |
|----|------|----------|
| **Q4-A** | 复跑 `smoke-provider-onboarding-local.sh` exit 0（①） | 本地绿 |
| **Q4-B** | Staging：提交→审→角色 · 截图 4 张（申请页 / 列表 / 详情材料 / 批准后） | ② |
| **Q4-C** | 驳回码 i18n 运营可读 · 默认码不造成假「已填原因」错觉 | 文案检 |
| **Q4-D** | Inbox / 工作台「商家入驻」队列深链落点正确且计数=真 | 与概况联动 |
| **Q4-E** | PG unavailable 时 503 fail-closed（保持）· UI 诚实错误 | 禁假空列表当 0 |

**5.0 验收句：** 「商家入驻全链 Staging 可证 · 材料可审 · 角色生效。」

---

## 5 · Q5 · 区域主理人审核（4.0 → 5.0）· HU-494

### 5.1 目标能力（必须）

`/steward/register` → `/admin/steward-applications` → 详情可审**全部申请人提交字段/材料** → 批准/驳回/补件 → `region_steward`。

### 5.2 细致步骤

| 步 | 动作 | 完成定义 |
|----|------|----------|
| **Q5-A** | 盘点 `steward/register` 提交 payload 全字段 → 建对齐母表（同 Q3 格式） | 表入册 |
| **Q5-B** | `AdminStewardApplicationReviewCard`：凡申请侧有 URL/文件 → `AdminAuthDocPreviewLink`；文本字段全显 | 材料深度对齐商家卡 |
| **Q5-C** | 若申请侧本无证照：UI 诚实「本角色无上传件 · 以文本/质押为准」 | 非假材料区 |
| **Q5-D** | 审核 API 已有 → 确认 PG 双写 + Staging 批准升角色截图 | ② |
| **Q5-E** | 状态枚举与列表 filter 统一（stake_pending / under_review / …） | 无错位 |
| **Q5-F** | 契约测试 + Staging 截图 | 入 `batch13-capability/` |

**5.0 验收句：** 「主理人审核具备 · 材料/字段与申请页对齐 · Staging 可证。」

---

## 6 · Q6 · 系统概况全真数（2.5 → 5.0）· HU-493 · HU-478 · HU-480 · HU-481

### 6.1 Owner 标准（写死）

```text
系统概况每一个「数字 / 域灯 / 库存」=
  (A) real_db 真源 + source 徽章
  或 (B) 产品设计空态（文案=未接入/未部署 · 可一键去中心）——须 Owner 可签收
禁止：假数字 · 假绿健康 · 用 items.length 冒充 total · 无说明的脏空
```

### 6.2 逐块升级

| 块 | 现况 | 满分动作 | HU |
|----|------|----------|-----|
| 用户总数 / 7 日 | PG 真 · 有标签 | 保持 · Staging 证 source=postgres | 493 |
| 四通道待办 | 真计数 | 保持 · 与队列 total 对拍 | 493 |
| 链 · 滞后 | 真 observability | 文案「网络名 + chain_id」 | 483 |
| 订单 / 争议 KPI | 常 memory | **改 PG 聚合 total** 或明示「样本/内存」且**不得**在发布签收时用 memory 充「全库」 | **493** |
| 向导目录库存 | total null→暂无统计 | **`COUNT(*)` from guides/PG** 写入 list `meta.total`+`meta.source=postgres`；0=设计空「暂无向导」≠「暂无统计」 | **481** |
| 域灯 入驻/经营/社区 | 部分真 | 经营灯仅 `real_db` 可绿（HU-449 保持） | 480 |
| 域灯 内容/官方/增长 | 固定 unknown | **产品态**：接入 live KPI **或**「未部署·打开中心」设计卡（文案/图标/CTA）· 禁止整墙死灰无语义 | **480** |
| 财务/治理 | neutral | 保持诚实无假余额 · 文案「池未部署/交叉核对入口」发布级打磨 | 480 |
| 特权比 | 真计数脏种子 | 清洗测试 SuperAdmin **或**「演示数据」条 + 周复核关闭 | **478** |
| 趋势图 | PG/memory | memory 时 unavailable 诚实 · 发布签收要求 PG | 493 |

### 6.3 细致步骤

| 步 | 动作 | 完成定义 |
|----|------|----------|
| **Q6-A** | `GET /admin/guides?limit=1` 返回可靠 `total` + `meta.source`（FE `fetchAdminQueueList` 可读） | 库存有数或 0 设计空 |
| **Q6-B** | orders/disputes 同构：PG count 或禁止在概况「全库」文案下展示 | source 诚实 |
| **Q6-C** | Domain health：三 unknown 域改为「设计未部署」组件（非假绿） | 截图完整感 |
| **Q6-D** | 概况页脚诚实句保留 · 增加「本页数值源」折叠一行（运营可读） | 可审计 |
| **Q6-E** | 特权比：脚本/手册清洗或演示条 | HU-478 |
| **Q6-F** | Staging 概况截图：无「暂无统计」脏感 · 无假绿 · source 可见 | ② |
| **Q6-G** | 机读：禁假绿契约不回归 + 新 total/source 契约 | exit 0 |

**5.0 验收句：** 「概况无假数 · 每块真源或签收设计空 · Staging 可证。」

---

## 7 · 执行波次（能力满分 · 写入 Batch-13）

```text
CAP-W0  本方案入册（当前）· FIX_NOT_STARTED
CAP-W1  Q1 裂脑消除          HU-491          → Q1=5.0 代码
CAP-W2  Q6 真数闸             HU-493·481·480  → Q6→4.5+
CAP-W3  Q2+Q3 材料/对齐       随 491 + Q3-*   → Q2=Q3=5.0
CAP-W4  Q5 主理人材料         HU-494          → Q5=5.0
CAP-W5  Q4+Q1 Staging 证     HU-490 材料      → Q4=5.0 · Q1 ②
CAP-W6  特权叙事              HU-478          → 发布可信
CAP-W7  双审面收敛            HU-492          → 运营不迷路
CAP-W8  能力总闸+八维总闸     HU-495 · 487 · 490
```

**与八维/叶页合流序：** **cite** [`NOT-FULL-SCORE` §4](./TT-BATCH13-NOT-FULL-SCORE-BACKLOG-AND-UPGRADE-LATEST.md)（能力段在前 · 叶页在中 · 495→487→490 仅总闸）。下列为能力局部序 · **非**省略叶页的全局唯一序：

```text
491 → 493 → 481 → 480 → 478 → 492 → 494
→（材料/对齐打磨 Q2·Q3）
→ 479 → 485 → 486 → 483 → 482 → 484
→ 489 → 488
→ 495 → 487 → 490
```

---

## 8 · Staging 证据清单（能力满分必交）

目录建议：`evidence/manual-uat/sessions/<stamp>-batch13-capability/`

| ID | 截图/产物 | 覆盖 |
|----|-----------|------|
| C-01 | 向导申请页提交成功 | Q3 |
| C-02 | Admin 向导队列有行 | Q1 |
| C-03 | Admin 向导详情·材料预览 | Q2 |
| C-04 | Admin 批准后 role=guide | Q1 |
| C-05 | 商家提交→批准 | Q4 |
| C-06 | 主理人提交→批准·材料 | Q5 |
| C-07 | 系统概况·source/库存/域灯 | Q6 |
| C-08 | 特权比治理后或演示条 | Q6/478 |

**缺任一张 ⇒ HU-495 / HU-490 不得 PASS。**

---

## 9 · 机读与本地命令（集体改时）

| 触点 | 命令 |
|------|------|
| Admin L5 | `node scripts/dev/run-admin-l5-green.mjs` |
| 商家烟测 | `bash scripts/dev/smoke-provider-onboarding-local.sh` |
| API | `cargo test -p traveltrust-api`（相关 guide/provider/steward/metrics） |
| 向导 FE 契约 | 既有 `meGuideProfileSettings` / batch guide application contracts |

---

## 10 · 禁止项（写死）

| 禁止 | 原因 |
|------|------|
| 用假绿 / 硬编码 KPI 凑 Q6=5 | 违反诚实与 Owner「真实数据」 |
| DEFER HU-491/493/495 仍宣称满分 | DEFER ≠ 满分 |
| 护照明文回传 Admin | 合规红线（用哈希存证说明代替） |
| 回流 Batch-12 FINAL 走廊改分 | FROZEN |
| 本方案完成 = Production GO | 另闸 |

---

## 11 · Owner 口令

| 步 | 口令 |
|----|------|
| 现 | 能力满分细致方案 **已入 Batch-13** · 只记不改 |
| 开修 | **「开始第 13 批集体改」** → 按合流序执行 |
| 能力满分复验 | 「验 Batch-13 能力满分」→ HU-495 |
| 双满分 | 「验 Batch-13 发布级满分」→ HU-487 + HU-495 |
| 签收 | 「Batch-13 发布级签收（②）」→ HU-490 · **≠** Production GO |

```text
TT_ADMIN_BATCH13_CAPABILITY_FULL_SCORE_UPGRADE_PLAN: ACTIVE
TT_ADMIN_BATCH13_CAPABILITY_SCORE_NOW: 21/30
TT_ADMIN_BATCH13_CAPABILITY_SCORE_TARGET: 30/30
TT_ADMIN_BATCH13_CAPABILITY_DIM_TARGET: 5.0_EACH_QUESTION
TT_ADMIN_BATCH13_MUST_HAVE_GUIDE_APPROVE: REQUIRED
TT_ADMIN_BATCH13_MUST_HAVE_GUIDE_MATERIALS: REQUIRED
TT_ADMIN_BATCH13_MUST_HAVE_GUIDE_ALIGN: REQUIRED
TT_ADMIN_BATCH13_MUST_HAVE_PROVIDER: REQUIRED
TT_ADMIN_BATCH13_MUST_HAVE_STEWARD: REQUIRED
TT_ADMIN_BATCH13_MUST_HAVE_OVERVIEW_REAL: REQUIRED
TT_ADMIN_BATCH13_GATE_495: OPEN
TT_ADMIN_BATCH13_GATE_487: OPEN
TT_ADMIN_BATCH13_FIX: NOT_STARTED
TT_HARD_GATE_LOCKED: true
TT_CUTOVER_LOCKED: true
TT_PRODUCTION_GO: NO_GO
必须具备 · 必须每问 5.0 · 不许 DEFER 冒充满分
```
