# TT-B414 · B-414 — Revenue Go-Live 联调收口（业务闭环证明）

**母表**：**B-414**  
**卡号**：`TT-B414-REVENUE-E2E-GO-LIVE-CLOSEOUT-001`  
**日期**：2026-04-16  

---

## 0. 为什么必须是 B-414（不做时的风险）

单卡 **B-402**（最小 revenue reconcile）、**B-412**（订单→观测可查）、**B-413**（订单状态事实对拍）各自 **可绿**，但若 **没有一张卡** 把它们 **在同一次可复跑编排里** 钉为 **「订单锚 + reconcile 根级 + admin overview 深相等 + 落盘证据」**，则：

- 发版叙事容易停在「观测键齐全」，而 **缺少** **从用户侧订单 UUID 到同一轮 reconcile/overview 真值** 的 **可追溯** **证据链**；
- **Go-Live §10**（并联打卡）里与 **E2E / evidence 路径**（**10.7 / 10.10**）对齐时，**没有** **单一** **`b414-closeout-record.json`** **指针**，审计只能 **拼** **多脚本** **stdout**，**不满足** **「一次收口」** **口径**。

**B-414** 的定位：**唯一**把 **B-402 + B-412 + B-413** **拼成** **可上线业务闭环证明** **（** **非** **替代** **治理** **B-417/B-428** **；** **不** **新增** **观测** **母表** **键** **）** **。**

---

## 1. 闭环链（真值顺序）

| 段 | 母表 / 脚本 | 说明 |
|----|-------------|------|
| **订单锚** | **B-412** | **`GET …/admin/orders/:id`**（**`B414_ORDER_ID` / `B412_ORDER_ID`**）；**`B414_SKIP_ORDER=1`** 可跳过（仅技术验 reconcile，**不**声称业务锚） |
| **可选索引推进** | — | **`B414_INDEXER_TICK_ROUNDS`**：每轮 **`POST …/internal/indexer-tick`** **`{}`**（与 **b403** 同形） |
| **收益 + 对账 + overview** | **B-402** + **B-413** | **`POST …/internal/indexer-reconcile`** **`persist:true`**，**B-383**、**B-386** **include** **与** **b402** **一致**；响应 **必含** **B-413** **`order_state_transition_facts_chain_align_observability`**（**锚** **`413-ORDER-STATE-FACTS-CHAIN-ALIGN-OBS-V1`**） |
| **同键深相等** | — | **`GET …/admin/observability/overview`** **`overview.{383,386,413}`** **与** **reconcile** **根级** **三** **键** **JSON** **相等** |

---

## 2. 一键命令

```bash
export API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8080}"
export INTERNAL_API_SECRET="…"
export ADMIN_BEARER_TOKEN="…"
export B414_ORDER_ID="<uuid>"   # 或 B412_ORDER_ID；或 B414_SKIP_ORDER=1
# 可选：在 tick 后再对拍
# export B414_INDEXER_TICK_ROUNDS=1
bash scripts/ops/b414-revenue-e2e-go-live-closeout.sh
```

**成功**：**exit 0**；**stderr** **末行** **`b414-revenue-e2e-go-live-closeout.sh: ok (...)`**；**证据目录** **`evidence/b414_revenue_e2e_go_live_closeout/run_<UTC>/`** **含** **`b414-closeout-record.json`** **、** **`indexer_reconcile_200.json`** **、** **`admin_observability_overview_200.json`** **。**

---

## 3. 验收（本 TT）

- [ ] 目标环境 **`bash scripts/ops/b414-revenue-e2e-go-live-closeout.sh`** **`exit 0`** **且** **`verdict=GO`** **在** **`b414-closeout-record.json`** **。**
- [ ] **至少一次** **带** **`B414_ORDER_ID`** **（** **或** **`B412_ORDER_ID`** **）** **跑通** **（** **非** **仅** **`B414_SKIP_ORDER=1`** **）** **作为** **业务锚** **样本** **。**
- [ ] **[go-live-checklist.md §10](../go-live-checklist.md#10-发版真值并联官方总表-p0-十二项-此处仅打卡)** **与** **[evidence/README](../../evidence/README.md#b414-revenue-e2e-go-live-closeout)** **可** **互指** **本** **证据** **路径** **。**

---

## 4. 互证

- **TT-B402**、**TT-B412**、**TT-B413**、**ops/RUNBOOK** **§2.55** **B-414** **段**
