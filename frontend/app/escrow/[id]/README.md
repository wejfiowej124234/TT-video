# `/escrow/[id]` · 订单详情

**阶段：① 本地**

## 读序

| 顺序 | 文档 |
|------|------|
| ① | **[ESCROW-ORDER-PAGE-PHASE1-CLOSURE.md](../../../evidence/GO_local_web3_itinerary_l5/ESCROW-ORDER-PAGE-PHASE1-CLOSURE.md)** — **订单页 Phase ① 收口（ACTIVE）** |
| ② | **[ESCROW-DRAFT-EXPERIENCE-FREEZE.md](../../../evidence/GO_local_web3_itinerary_l5/ESCROW-DRAFT-EXPERIENCE-FREEZE.md)** — 草稿 Experience **UI 硬闸** |
| ③ | [`components/escrow/EscrowDetail/README.md`](../../../components/escrow/EscrowDetail/README.md) |
| ④ | [`GO_local_web3_itinerary_l5`](../../../evidence/GO_local_web3_itinerary_l5/README.md) — Landing → 解锁 → 本页 → Market |

## 路由

- **页身：** `page.tsx` → `EscrowDetailSection` → `EscrowDetail`（`dynamic`, `ssr: false`）
- **Experience 壳：** 预链上草稿（`isPreEscrowProtocol && !hasEscrow`）
- **协议壳：** 已上链 / 争议 / 评价等（**未** UI 冻结，见冻结文「诚实边界」）

## 机读（动 Experience UI 须 exit 0）

```bash
bash scripts/dev/run-web3-itinerary-l5-green.sh
```

**从 `/orders` 进入（协议壳维护 · ①）：** 见 **[GO_local_orders_l5](../../../evidence/GO_local_orders_l5/README.md)** · `bash scripts/dev/run-orders-corridor-local.sh`
