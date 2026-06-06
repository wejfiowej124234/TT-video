# `/escrow/[id]` 订单页 · Phase ① 收口声明（2026-05-28）

**阶段：① 本地** — **创新行程解锁后的草稿订单详情页**（Experience 壳）**产品 + 文档 + 机读** 一并收口；**不**表示 ② 测试网 / ③ 生产 Escrow GO。

**代码真源：** `frontend/components/escrow/EscrowDetail/index.tsx` · `useEscrowDetail.ts` · `EscrowDraft*.tsx`

---

## 收口结论（ACTIVE）

| 维度 | 状态 | 真源 |
|------|------|------|
| **产品 UI（草稿）** | **已封口** | [`ESCROW-DRAFT-EXPERIENCE-FREEZE.md`](./ESCROW-DRAFT-EXPERIENCE-FREEZE.md) |
| **组件编排** | **已与代码对拍** | [`EscrowDetail/README.md`](../../components/escrow/EscrowDetail/README.md) |
| **路由读序** | **已建** | [`app/escrow/[id]/README.md`](../../app/escrow/[id]/README.md) |
| **走廊 L5** | **绿集 exit 0** | `bash scripts/dev/run-web3-itinerary-l5-green.sh` |
| **全链 API（可选）** | **烟测脚本就绪** | `bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh` |
| **spec / handbook** | **2026-05-28 对齐** | **80 §0.2.2** · **62-03 §3.1** · **20-B** · **33/34** · **00 索引** |
| **协议 DID 壳（已上链）** | **未收口** | Phase ② 或独立 13 银行级专项 |
| **`/escrow/[id]/rate`** | **未收口** | 评分页仍按 53 + 协议规范维护 |

**维护期纪律（写死）：** 仅 **bugfix** · **数据链路** · **i18n（同语义）** · **a11y/错误态**；**禁止** 旅行者默认恢复 FeeRouter / cyan DID / 聊天 / 高级折叠（无 `NEXT_PUBLIC_ESCROW_DEV_TOOLS`）。

---

## 激活条件（与代码一致）

```text
experienceDraft = isPreEscrowProtocol && !hasEscrow
```

- **`isPreEscrowProtocol`**：`useEscrowDetail` 派生（行程区、PATCH 门闸）
- **`hasEscrow`**：链上托管实例已存在 → 切换 **协议 DID 壳**（本收口 **不** 覆盖）

**机读锚点：** `data-tt-escrow-draft-experience-ui-frozen="1"` · `data-zone="order-protocol"` · `TT_ESCROW_EXPERIENCE_ZONE`

---

## 旅行者主路径（① · 与 `index.tsx` 一致）

```text
GET /orders/:id
  → OrderFlowSteps (experience · 3 步 · draftStep2Phase=pickGuide 当已发布无向导)
  → 发布横幅 / 向导卡 / 行程 Tab（城市 | 每日说明 | 预览）
  → QuoteSummaryCard + ConfirmFinalPlanBlock
  → 页脚：打印 · 复制 · 返回 · 更多（取消/删除）
  → /market?view=split&bindGuideToOrder=
  → POST confirm-final-plan → mock-pay（①）
```

**默认不出现：** `ChatBlock` · `EscrowRiskNotice` · `FeeRouterWiringNotice` · `EscrowDraftAdvancedProtocolFold`（无 dev env）。

---

## 多维文档互指（单表）

| 读者 | 文档 |
|------|------|
| 前端改 UI | **ESCROW-DRAFT-EXPERIENCE-FREEZE** → **EscrowDetail/README** |
| 行程端到端 | **80 §0.1 / §0.2.2** · **(home)/README** · **GO_local_web3** |
| 逐文件审计 | **62-补充-03 §3.1 / §4.3** |
| 后端订单域 | **20-B** · **04 §3.4** |
| 页面验收表 | **33 §二 EscrowDetail 行**（须区分双壳） |
| Agent / Cursor | **AGENTS.md** · **traveltrust-ai-collab.mdc** |
| 推送前 | **CONTRIBUTING · pre-push**（Escrow 草稿绿集） |

---

## 机读验收（收口闸 · 须 exit 0）

```bash
bash scripts/dev/run-web3-itinerary-l5-green.sh
```

**含：** `escrowDraftExperienceUiFreeze` · `escrowExperienceUi` · `escrowExperienceDevTools` · `OrderFlowSteps*`

**可选全链（API + seed 已起）：**

```bash
bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh
```

**一键启动默认（`start-api-with-seed.bat` · Step 6f）：** API 健康后自动跑上列全链烟测（可用 `SKIP_POST_START_WEB3_ITINERARY_SMOKE=1` 跳过）；启动前 **Step 1b5** 对拍 `api.ts` ↔ `api/routes.ts` 订单路径。

末行：`TT_WEB3_ITINERARY_L5_GREEN: OK` · `TT_WEB3_ITINERARY_FULL_CHAIN_SMOKE: OK`

---

## 诚实边界

| 可宣称（①） | 禁止冒充 |
|-------------|----------|
| 草稿订单页 UI/文档/绿集已收口 | ② staging 全矩阵 GO |
| 创新行程 → Escrow → Market → confirm 本地演示 | 真 USDC / 链上 deposit 已验 |
| mock-pay 占位 | ③ 主网 Production GO |

**② 开工：** [PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md)（G-0～G-4）

---

## 人工 30s（收口目视）

1. `.env.local` **无** `NEXT_PUBLIC_ESCROW_DEV_TOOLS=1`
2. 硬刷新 `/escrow/{draft-order-id}`
3. 暖金步骤条 + 单一发布 CTA + 预览缩略图；**无** 青色协议台
4. 页脚 **更多** 可取消（已发布）或删除（未发布）
