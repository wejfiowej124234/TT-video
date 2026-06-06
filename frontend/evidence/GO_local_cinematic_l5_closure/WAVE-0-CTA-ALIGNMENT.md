# 波 0 · 首页导流对齐（① · L5）

**阶段：① 本地** — 不证明 ②③ 真链 / staging 全矩阵 GO。  
**机读真源：** [`frontend/lib/traveltrustHomepageFunnelL5.ts`](../../lib/traveltrustHomepageFunnelL5.ts)  
**契约：** `npm run test -- traveltrustHomepageFunnelL5 --run`

---

## 1. 「规划行程」两阶（勿跳阶）

| 阶 | href | 说明 |
|----|------|------|
| **① 当前（已闭）** | `#start` | Hero / 地球 pin / 游客角色 · `TT-PH1-170` |
| **波 1（已登记）** | `/guides` | 向导列表 → 预约 / `orders?book_guide=` · **波 0 不改 Hero 主按钮** |

`page-brief` 默认：`primary_target: "#start"`，`secondary_target: "/governance"`。

---

## 2. 五角色「进入」

| 角色 | 路径 | L5 tier |
|------|------|---------|
| 游客 | `#start` | cinematic（叙事页内） |
| 向导 | `/guide` | experience_dark |
| 商家 | `/market/provider` | experience_dark |
| 旅行收购 | `/market/acquisition` | experience_dark |
| 区域主理人 | `/governance` | product_console |

---

## 3. 信任 / 资金三角

| 首页区块 | 落地 | Escrow≠TTG |
|----------|------|------------|
| `#trust` 托管 | `/help` | 帮助 FAQ + 示意 |
| `#trust` 治理 | `/governance` | 治理中心 |
| `#trust` 参数 | `/governance/params` | 协议参数 |
| `#trust` 披露 | `/help#disclosure` | 合规锚点 |
| `#settlement` / `#liquidity` | `/pay` | 订金 Escrow 枢纽 |
| FAQ 争议 | `/disputes` | 争议入口 |
| 费路由 | `/governance/fee-routes` · `/traveltrust#fee-router` | 技术说明 |

`liquidity_contract` ① 默认：`escrow_pay_path: /pay`，`governance_hub_path: /governance`。

---

## 4. L5 壳层（落地页）

| tier | 要求 | 代表路由 |
|------|------|----------|
| **cinematic** | `TT-CINEMATIC-L5` 已闭 · 地球锁定 | `/traveltrust` |
| **product_console** | `TT_MARKETING_PRODUCT_PAGE_*` + `data-tt-ui-generation=v2` + `data-tt-marketing-product-shell=1` + `data-tt-homepage-funnel-l5` | `/orders` `/pay` `/help` `/governance` `/disputes` |
| **experience_dark** | `data-tt-ui-generation=v2` + 市场/向导 ambient · 无全页 WebGL | `/guides` `/guide` `/market/*` `/trust` |

---

## 5. 波 0 验收（①）

```bash
cd frontend && npm run test -- traveltrustHomepageFunnelL5 traveltrustNetworkPage.contract --run
```

目视（Maintainer）：

1. 首页五角色「进入」逐条可开、顶栏 L0 可见。  
2. `/orders` `/pay` `/help` 浅底产品壳 + 页脚交叉导航含 `/traveltrust`。  
3. `/guides` 顶栏弱链含「旅行网络页」。  
4. 信任文案：首页 Escrow / TTG 与 `/help`、`/pay` 不矛盾。

---

## 6. 下一波（波 1）

- Hero / `#start` 主 CTA 接 `/guides`（或 `page-brief` `primary_target`）。  
- 空态 / 登录回跳 / `book_guide` 深链。  
- 可选：E2E 首页 → 向导卡 → 订单。

**禁止假完成：** 波 0 对齐 **≠** 波 1 转化已验收。
