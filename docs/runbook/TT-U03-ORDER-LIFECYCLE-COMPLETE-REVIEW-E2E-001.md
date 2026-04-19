# TT-U03-ORDER-LIFECYCLE-COMPLETE-REVIEW-E2E-001 · **订单** **状态** **流转** **→** **完成** **→** **评价**

**母表**：[B-460](../任务母表.md)

**全局执行顺序**：**TT-U01** **→** **TT-A01** **→** **TT-U02** **→** **TT-A02** **→** **本卡** **（** **收口** **主** **闭环** **）** **。**

**前置**：**TT-U02** **绿** **；** **状态** **迁移** **见** **[TT-B409](./TT-B409-ORDER-STATE-MACHINE-CHAIN-OFF-53-001.md)** **、** **[TT-B410](./TT-B410-USER-FLOW-E2E-ORDER-STATE-UNIFIED-001.md)** **；** **评价** **契约** **见** **B-449～B-451** **Runbook** **。**

---

## §1 · 最小验收

### §1.0 · 单一封口命令（**B-473** **推荐** **·** **发布** **级**）

自仓库根目录 **一条** **命令** **完成** **§1.1～§1.2** **与** **契约** **补充** **（** **见** **[`TT-B473-SEAL-B460-TT-U03-001`](./TT-B473-SEAL-B460-TT-U03-001.md)** **）** **：**

```bash
bash scripts/ops/b473-seal-b460-tt-u03.sh
```

**说明**：**与** **手搓** **分散** **命令** **等价** **；** **证据** **`evidence/b473_seal_b460_tt_u03/seal-run.log`** **+** **`evidence/b460_tt_u03_order_lifecycle_review_e2e/b410_stderr.txt`** **。**

### §1.1 · 一条后端机读命令

```bash
bash scripts/ops/b410-user-flow-e2e-gate.sh
```

**说明**：**内含** **`b409-order-state-primary-acceptance.sh`** **+** **`b409-order-state-exception-acceptance.sh`** **；** **Playwright** **全量** **须** **`B410_RUN_PLAYWRIGHT=1`** **（** **可选** **）** **。**

### §1.2 · 一条前端 / E2E 命令（串联主路径片段）

```bash
cd frontend && npx playwright test e2e/p02-tourist-order-create-list.spec.ts e2e/p03-tourist-guide-accept.spec.ts e2e/p04-bilateral-confirm.spec.ts e2e/p05-confirm-final-escrow.spec.ts --project=chromium
```

**说明**：**须** **本机** **API** **+** **依赖** **环境** **；** **若** **仅** **跑** **页面** **可达** **，** **可** **改** **`e2e/release-flow.spec.ts`** **并** **在** **证据** **说明** **降级** **原因** **。**

### §1.3 · PASS / FAIL 表

| 项 | PASS | FAIL 时记录 |
|----|------|-------------|
| **主** **成功** **链** **状态** **与** **`GET /api/v1/orders/:id`** **一致** | ☐ | 漂移 |
| **`POST …/confirm-completion`** **/** **评分** **/** **释放** **顺序** **符合** **53** **/** **Runbook** | ☐ | 越权 |
| **资金** **终态** **后** **`POST …/reviews`** **可** **成功** **（** **或** **契约** **测试** **绿** **）** | ☐ | 见 `b449_` |
| **`b410-user-flow-e2e-gate`** **exit** **0** | ☐ | 子脚本名 |
| **（** **补充** **机读** **）** **`cargo test -p traveltrust-api b449_ b451_`** **（** **评价** **JSON** **）** | ☐ | 可选**/**必修补 |

### §1.4 · 证据落点

**`evidence/b460_tt_u03_order_lifecycle_review_e2e/`**：** **`pass_fail.md`** **+** **`b410_stderr.txt`** **（** **重定向** **）** **+** **可选** **Playwright** **report** **。**

---

## §2 · 范围与真值

| 柱 | 真值来源 |
|----|----------|
| **页面** | **`/orders`** **、** **订单** **详情** **/** **抽屉** **、** **`/escrow/[id]`** **、** **评价** **入口** |
| **API** | **`POST …/accept`** **、** **`confirm-bilateral`** **、** **`mock-pay`** **/** **`set-escrow-address`** **、** **`confirm-completion`** **、** **`GET/POST …/reviews`** |
| **DB** | **`orders.state`** **、** **`reviews`** |
| **文档** | **[04](../spec/04-后端与API.md)** **§3.4** **；** **B-449/B-450/B-451** |

---

## §3 · 非目标

- **不** **在本卡** **重做** **B-455** **灰度** **阈值** **或** **B-457** **发布** **适配** **（** **仅** **消费** **既有** **门禁** **）** **。**
- **主网** **真实** **tx** **非** **必达** **；** **以** **`P3_CHAIN_OFF`** **/** **mock** **为准** **时** **须** **在** **证据** **写明** **。**

---

**文档版本**：1.0 · 2026-04-17
