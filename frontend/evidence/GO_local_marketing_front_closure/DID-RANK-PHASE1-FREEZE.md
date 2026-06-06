# `/did-rank` DID 排行榜 · Phase ① 收口冻结（2026-06-03）

**阶段：① 本地** — **五主路由 UI 壳（已冻结）** + **榜单 API 数据链 L5 子集（2026-06-03 已闭）**；**不**表示 ② 测试网榜密度、③ 主网链上奖池 / Production GO、全站 **93** 矩阵已闭。

**代码真源：** `frontend/app/did-rank/*` · `frontend/components/did-rank/*` · `frontend/lib/didRank*.ts` · `frontend/lib/did-rank/*`

**互指：** [FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · [30-DID排行榜](../../../docs/spec/30-DID排行榜-页面规范.md) · [04-附录-did-rank §1.2](../../../docs/spec/04-附录-did-rank对接说明.md) · [DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md](./DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md) · [88 §一](../../../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md)

---

## 收口结论（ACTIVE · FROZEN · ①）

| 维度 | ① 状态 | 真源 |
|------|--------|------|
| **五主路由 UI 壳** | **已冻结（2026-05-25）** | **FIVE-MAIN** · 竖脊 **五签** · 暖场/podium · `didRankTheme.contract.test.ts` |
| **旅行者 / 向导主榜 API** | **已闭** | `GET /did-rank/travelers` · `GET /did-rank/guides` · 失败 **不**回退 mock |
| **行程榜 API** | **已闭** | `?board=itinerary` · `DidRankItineraryRankBlock` · `GET /did-rank/itineraries` · Top10（**无** 11～100，见 **30 §0.1**） |
| **商家 / 收购副榜 API** | **已闭** | `ProviderRankBlock` · `AcquisitionRankBlock` · fetch 失败 **retry banner** |
| **奖金池区** | **已闭（① 示意）** | `GET /did-rank/prize-pool` · `illustrative: true` 诚实披露 → **③** 链上真值 |
| **深链 / 分享** | **已闭** | `?board=` · `?period=` · `?guide_sort=` · `?me=traveler-|guide-|itinerary-|provider-|acquisition-` |
| **devPreview** | **门闸（①）** | `didRankDevPreviewGate.ts`：**`NODE_ENV=production` 硬关** · 仅 **`NEXT_PUBLIC_DID_RANK_DEMO_PREVIEW=1`** 且非 production · 预览 UUID **不**链社区 |
| **SSR `is_me`** | **已闭（① 子集）** | RSC **`serverForwardAuthHeaders`**（`traveltrust_user_id` cookie → **`X-User-Id`**）· 首屏榜行 **`is_me`** 对齐 · 副榜/非默认 period 缓存策略 → **②** |
| **②③ backlog** | **OPEN** | 本文件 §②③ · [DID-RANK-COMMUNITY-L5-AUDIT-TASKS](./DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md) **P2/P3** |

**维护期纪律（写死 · ① 冻结范围内）：**

| 允许 | 禁止 |
|------|------|
| API 接线 / 字段映射 / loading·error·retry · **诚实 i18n**（同语义） | 页结构：五签 IA、preboard 栈、Top10 领奖台 layout、fold 交互范式 |
| a11y / 对比度 bugfix | `lib/marketingUi.ts` **`TT_MARKETING_DID_RANK_*`** token / 动效 / 暖场叠层回流 |
| **`crates/api` `did_rank` 路由** 与 **04 §3.4** 同批 HTTP 变更 | 以「数据修」名义改 **DOM 布局 / framer 动效 / 视觉 tier** |
| Contract **对齐代码真值**（不放宽冻结断言） | 恢复 **`didRankMockData` 运行时回退** 或 **无 disclosure 假榜** |

**动 `app/did-rank/*` · `components/did-rank/*` · `lib/didRank*` 路径时：** 须 **`bash scripts/dev/run-did-rank-l5-green.sh` exit 0**（**①**；**非** ②③ GO）。

---

## 机读锚点

```text
data-tt-did-rank-page="1"                    # DidRankPageInner main
data-tt-did-rank-phase1-frozen="1"           # Phase ① 收口冻结标记
data-tt-did-rank-dark-surface="…"            # resolveDidRankBackdropSurface
data-tt-did-rank-dev-preview="1"             # Header · 仅 devPreview 激活时
#did-rank-board-panel-traveler|guide|itinerary|provider|acquisition
traveler-top10-{uuid} · guide-top10-{uuid}   # 深链 scroll 目标
data-did-rank-itinerary-id="{order_id}"      # 行程榜高亮
provider-row-{uuid} · acquisition-row-{uuid}
```

---

## ① 已闭项（P1-DR · 2026-06-03）

| ID | 项 |
|----|-----|
| **P1-DR-01** | 无运行时 `didRankMockData` 回退 |
| **P1-DR-02** | 行程榜 **`?board=itinerary`** 挂载 · `GET /did-rank/itineraries` |
| **P1-DR-06** | 类型 SSOT `didRankTypes.ts` |
| **P1-DR-07** | 向导弹窗 **无** `/guides/${userUuid}` · 社区档案链 |
| **P1-DR-08** | 主榜 **11～100** 与 API **`DID_RANK_LIMIT=100`** 诚实对齐 |
| **P1-DR-09** | 副榜 period 切换分页重置 |
| **P1-DR-10** | devPreview UUID 不链 `/community/user/*` |
| **P1-DR-11** | 副榜 fetch 失败 → error banner + retry |
| **P1-DR-16** | 向导榜 **`?guide_sort=`** ↔ API `sort=` |
| **P1-DR-17** | 主榜 **`rank_delta`**（PG 快照） |
| **P1-DR-18** | SSR **`?period=`** · **`?guide_sort=`** 首屏快照 |
| **P1-DR-19～21** | 行程榜 error/retry · **`rank_delta` UI** · **`?me=itinerary-<order_id>`** |
| **P1-DR-SPEC30** · **P1-DR-DOC** · **P1-DR-FREEZE** | spec 30 · README · 本冻结文与代码对拍 |
| **P1-DR-22** | 奖金池 **`data-tt-did-rank-prize-pool-illustrative`** / **`api-connected`** |
| **P1-DR-12** | SSR cookie → **`X-User-Id`** · 旅行者/向导/行程榜 **`is_me`** 首屏（**`serverForwardAuthHeaders.ts`** · **`didRankPageInitialData.server.ts`**） |
| **P1-DR-PREVIEW-GATE** | **`didRankDevPreviewGate`** 生产硬关 + **`didRankDevPreviewGate.test.ts`** |

---

## ① 验收命令（收口日 · exit 0）

```bash
bash scripts/dev/run-did-rank-l5-green.sh
```

**窄集等价：**

```bash
cd frontend
npx vitest run \
  components/did-rank/didRankTheme.contract.test.ts \
  components/did-rank/useDidRankSecondaryBoard.test.ts \
  lib/didRankUtils.test.ts \
  lib/didRankDevPreview.test.ts \
  lib/didRankDevPreviewGate.test.ts \
  lib/marketingRouteTransitionPerf.contract.test.ts
bash scripts/check-did-rank-no-escrow-prefetch.sh
```

**可选 E2E（须 API :8080）：** `e2e/site-theme-v1-did-rank-guide-modal.spec.ts` · `e2e/93-matrix-path-did-rank-boards.spec.ts`

**五主并集闸（含 home/market/community）：** 仓库根 `bash scripts/gates/five-main-routes-ui-antiregression-gate.sh`

---

## ② 测试网 · 未闭（勿跳阶 GO）

| ID | 项 |
|----|-----|
| **P2-DR-03～04** | 商家/收购 **产品排序口径**（MVP 履约聚合 → 终局 GMV/刊登语义） |
| **P2-DR-05** | 旅行者 → 社区档案 **staging E2E** 覆盖率 |
| **P2-DR-07～09** | staging 榜密度 · **93-D-DID** · 宽 E2E |
| **P2-DR-10** | 行程榜 **staging 密度 E2E**（① 已挂载 · **P1-DR-02**） |
| **P2-DR-12** | SSR 扩展（cookie **`is_me`** · 副榜首屏策略） |
| **P2-DR-14～15** | live poll staging · **rank_delta** 跨环境榜史对拍 |

入口闸：[PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md) **G-0～G-4**

---

## ③ 公网 / 生产 · 未闭

| ID | 项 |
|----|-----|
| **P3-DR-01** | 奖池 **链上真值** |
| **P3-DR-02** | 主网榜与 escrow 对账 |
| **P3-DR-03～04** | 生产禁 devPreview · live poll SLO |

---

## 读法

- **① FROZEN** = UI 壳 + 五榜 API 接线 + 诚实空态/devPreview/示意奖池披露 + 机读 contract 绿集。  
- **②** = 榜数据真值、staging 密度、宽矩阵、排序口径终局。  
- **③** = 链上奖池、主网对账、Production GO。  
- **禁止**用 **①** devPreview / 示意奖池 冒充 **②③ GO**（[CONTRIBUTING · 禁止假完成](../../../CONTRIBUTING.md#no-false-completion)）。
