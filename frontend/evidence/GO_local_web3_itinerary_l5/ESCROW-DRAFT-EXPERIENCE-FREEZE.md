# `/escrow/[id]` · 草稿 Experience · ① 本地 UI 冻结（2026-05-28 · 暖金暗壳 · 硬闸）

**阶段：① 本地** — **预链上托管**（`isPreEscrowProtocol && !hasEscrow`）订单详情为 **Experience 暖色壳 SSOT**；**不**表示 ② 测试网真付、③ 主网 Escrow / Production GO。

**互指：** [**订单页收口声明**](./ESCROW-ORDER-PAGE-PHASE1-CLOSURE.md) · [本目录 README](./README.md) · [`app/escrow/[id]/README.md`](../../app/escrow/[id]/README.md) · [`components/escrow/EscrowDetail/README.md`](../../components/escrow/EscrowDetail/README.md) · [五主路由冻结](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · [Phase ① Freeze](../GO_local_phase1/PHASE1-FREEZE-ONBOARDING-HUB.md)

---

## 冻结结论

| 项 | 状态 |
|----|------|
| **路由** | `/escrow/[id]`（**仅**草稿 Experience 态；见下「激活条件」） |
| **视觉族** | `TT_ESCROW_EXPERIENCE_*` · `order-experience-zone` 暖金暗壳 |
| **冻结日** | **2026-05-28** |
| **已上链 / 争议 / 评价** | **未冻结** — 仍为协议 DID 深色壳（`variantDid`） |

**激活条件（Experience 壳）：** `EscrowDetail` 内 `experienceDraft === true`（`isPreEscrowProtocol && !hasEscrow`）。

**产品口径（写死）：** 旅行者草稿主路径 **UI 已封口**；默认 **仅** 数据链路 / i18n / a11y·错误态 / 门闸字段；**禁止** 把 FeeRouter、青色 DID、聊天块、协议风险栈 **默认外露** 给旅行者。

---

## 读序（禁止文档分叉）

| 顺序 | 真源 |
|------|------|
| ① | **本文件** |
| ② | [`app/escrow/[id]/README.md`](../../app/escrow/[id]/README.md) |
| ③ | [`components/escrow/EscrowDetail/README.md`](../../components/escrow/EscrowDetail/README.md) |
| ④ | 代码 + 下文 **① 机读绿集** |

**非 SSOT：** `archive/ui-v1`、旧 cyan `order-protocol-zone` 截图、未加 `NEXT_PUBLIC_ESCROW_DEV_TOOLS` 却展示高级协议区的 `.env.local`。

---

## 页面结构锁（Experience · 自上而下 · 不得重排主块）

`components/escrow/EscrowDetail/index.tsx`（`data-zone="order-protocol"` · `data-tt-escrow-draft-experience-ui-frozen="1"`）：

1. **Header** — `EscrowDetailHeader` · `variantExperience`
2. **步骤条** — `OrderFlowSteps` · `variant="experience"` · `draftStep2Phase`（发布待选向导）
3. **下一步条**（可选）— `EscrowDraftNextStepStrip`；**发布横幅可见时隐藏**（`hideWhenPublishedBanner`）
4. **发布 / 向导** — `EscrowDraftPublishedBanner` **或** `EscrowDraftGuideEmptyCard` / `EscrowDraftGuideAssignedCard`
5. **付款步**（锁定后）— `EscrowDraftPayStepCard`
6. **行程区** — Tab（城市 | 每日说明 | 预览）· 列表 `UnifiedItineraryList` · `richCollapsedPreview`
7. **右侧报价** — `QuoteSummaryCard` · `ConfirmFinalPlanBlock`
8. **页脚** — `EscrowDraftExperienceFooter`（打印 / 复制 / 返回 · **更多** 取消/删除）
9. **高级区（默认无）** — 仅 `NEXT_PUBLIC_ESCROW_DEV_TOOLS=1` → `EscrowDraftAdvancedProtocolFold`

**默认禁止出现在旅行者主路径：** `ChatBlock`、`EscrowRiskNotice`、`FeeRouterWiringNotice`（无 dev 工具时）、`DisputeResolutionFundBlock`、青色 `border-cyan-*` 主壳。

---

## 文件边界（Experience 专用 · 增删须同批更新契约）

| 文件 | 角色 |
|------|------|
| `EscrowDetail/index.tsx` | 组合与 `experienceDraft` 分支 |
| `EscrowDraft*.tsx`（12 个） | 草稿 UX 块 |
| `lib/escrowExperienceUi.ts` | 暖色 token |
| `lib/escrowExperienceDevTools.ts` | dev 开关 · 预览截断 |
| `lib/escrowExperienceUi.contract.test.ts` | 链路契约 |
| `lib/escrowDraftExperienceUiFreeze.contract.test.ts` | **UI 冻结契约** |
| `components/itinerary/UnifiedItineraryList.tsx` | `richCollapsedPreview` / `expandDayLabelMode="experience"` |

**路由：** `app/escrow/[id]/page.tsx` · `EscrowDetailSection.tsx` · `EscrowDetailLoadErrorView.tsx`（错误态须 `TT_ESCROW_EXPERIENCE_ZONE`）。

---

## 后续变更边界

| 允许（链路 / 合规） | 禁止（UI 回流） |
|---------------------|-----------------|
| PATCH 行程 / guide · `published_to_market` · confirm / mock-pay 门闸 | 删除 `EscrowDraftPublishedBanner` 或改回双 CTA 重复条 |
| i18n、错误态、`aria-*`、44px 触控 | 旅行者默认展示 `EscrowDraftAdvancedProtocolFold`（无 env） |
| `GET /orders` 字段诚实化（非改布局） | 恢复 cyan DID 主壳到 `experienceDraft` 分支 |
| Contract **对齐真值**（不放宽冻结断言） | 预览 Tab 改回「展开协议摘要」口径 |
| Bugfix（须绿集 exit 0） | 在页脚 **更多** 外再挂删除/取消主按钮 |

**开发者调试：** 仅 `.env` / `.env.local` 中 **`NEXT_PUBLIC_ESCROW_DEV_TOOLS=1|true|yes`**；**禁止**提交到仓库默认配置。

---

## ① 机读绿集（提交前 · `exit 0`）

```bash
bash scripts/dev/run-web3-itinerary-l5-green.sh
```

**动到 `EscrowDetail/index.tsx`、`EscrowDraft*`、`lib/escrowExperienceUi.ts`、`lib/escrowExperienceDevTools.ts`、Experience 分支的 `UnifiedItineraryList` 时：** 默认须上命令全绿。

**全链 API（可选 · 需 API+seed）：**

```bash
bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh
```

---

## 机读锚点（grep）

| 锚点 | 含义 |
|------|------|
| `data-tt-escrow-draft-experience-ui-frozen="1"` | Experience 协议区已声明 UI 冻结 |
| `experienceDraft` | 暖色壳激活 |
| `isEscrowExperienceDevToolsEnabled()` | 高级折叠区门闸 |
| `TT_ESCROW_EXPERIENCE_ZONE` | 暖色 zone class |
| `richCollapsedPreview` | 预览缩略图 + 折叠摘要 |
| `hideWhenPublishedBanner` | 避免与发布横幅重复提示 |

**Vitest：** `lib/escrowDraftExperienceUiFreeze.contract.test.ts` · `lib/escrowExperienceUi.contract.test.ts` · `lib/escrowExperienceDevTools.test.ts`

---

## 人工 30s（① 目视）

1. 硬刷新 `/escrow/{draft-order-id}`（`Ctrl+Shift+R`）
2. 暖金步骤条 + 单一发布 CTA；预览有缩略图；**无** FeeRouter / 青色 DID 条
3. `.env.local` **未**设 `NEXT_PUBLIC_ESCROW_DEV_TOOLS=1`
4. 页脚 **更多** 可取消（已发布）或删除（未发布草稿）

---

## 诚实边界

| 可宣称（①） | 禁止冒充 |
|-------------|----------|
| 创新行程 → 草稿 Escrow Experience UI 已冻结 | ② staging `release_gate=GO` |
| 绿集 + `smoke-web3-itinerary-full-chain-local` | 真 USDC / 链上 deposit 已验 |
| mock-pay 本地占位 | ③ 主网 Escrow GO |

**未冻结：** 已创建链上托管、争议、释放、评价 — 仍为协议 DID UI；Phase ② 见 [PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md)。

---

## 文档同步清单（2026-05-28）

| 文档 | 要点 |
|------|------|
| **本文** | Escrow 草稿 Experience UI 冻结 SSOT |
| [`GO_local_web3_itinerary_l5/README.md`](./README.md) | 走廊 L5 证据 |
| [`EscrowDetail/README.md`](../../components/escrow/EscrowDetail/README.md) | 组件索引 |
| [`ESCROW-ORDER-PAGE-PHASE1-CLOSURE.md`](./ESCROW-ORDER-PAGE-PHASE1-CLOSURE.md) | 订单页 Phase ① 收口（多维） |
| [`docs/spec/80 §0.2.2`](../../../docs/spec/80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md) | 行程系统路由表 · Experience SSOT 表 |
| [`62-补充-03 §3.1`](../../../docs/spec/code-maps/62-补充-03-Escrow路由逐文件代码映射-20260306.md) | Escrow 逐文件映射 |
| [`20-B-订单机制`](../../../docs/handbook/engineering/20-B-订单机制.md) | 后端导读互指 |
| [`AGENTS.md`](../../../AGENTS.md) | Agent 硬闸一句 |
| [`.cursor/rules/traveltrust-ai-collab.mdc`](../../../.cursor/rules/traveltrust-ai-collab.mdc) | Cursor 硬闸 |

**未改：** `docs/spec/04` / `07` 版本表（非「台账同批」）。
