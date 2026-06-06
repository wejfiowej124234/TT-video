# GO_local_enterprise_10 · ① 创新行程走廊「10 分」

**层级：** 本包 = **[全站企业 10 · 走廊子集 A](../../../docs/runbook/ENTERPRISE-SITE-10-L5-MATRIX.md#0--三档10-分口径必读)**；**全站 10** 见同文 **§1** + `bash scripts/dev/run-enterprise-site-10-local.sh` → `TT_ENTERPRISE_SITE_10_LOCAL: OK`。

**状态（①）：** 机读闸 **`bash scripts/dev/run-enterprise-local-10.sh`** → **`TT_ENTERPRISE_LOCAL_10: OK`**（L5 + API 全链 + cargo 安全 + 五主防回归 + Playwright 走廊；`SKIP_E2E=1` 可跳过浏览器）。E2E 每轮 **新注册旅客**（避免 `tourist@test.com` 进行中订单上限 409）；预览卡经 **API 预置 + localStorage**（`tt_landing_result_order_ids_v1`）后仍走 **解锁 / Escrow 保存 / Market bind** UI。

**阶段：① 本地** — **Landing → 解锁 → Escrow 保存发布 → Market `bindGuideToOrder` 深链** 的机读满分闸。  
**非本包：** ② 测试网 / staging `release_gate=GO`、③ 生产 PSP / 主网 / **全站企业 10 分**（见 [ENTERPRISE-SITE-10-L5-MATRIX](../../../docs/runbook/ENTERPRISE-SITE-10-L5-MATRIX.md) · [PHASE1-ENTERPRISE-CLOSURE-AUDIT](../../../docs/runbook/PHASE1-ENTERPRISE-CLOSURE-AUDIT.md)）。

**同源 L5 子包：** [`GO_local_web3_itinerary_l5`](../GO_local_web3_itinerary_l5/README.md) · UI 真源 [`app/(home)/README.md`](../../app/(home)/README.md)

---

## 10 分定义（可 grep · 可复跑）

| 层 | 内容 | 命令 / 产物 |
|----|------|-------------|
| 契约 | 闸脚本 + E2E spec + 本 README 三处对拍 | `lib/enterpriseLocal10Gate.contract.test.ts` |
| Vitest L5 | 首页 / Escrow / Market 绿集 | `bash scripts/dev/run-web3-itinerary-l5-green.sh` |
| API 全链 | 保存发布 · discover · 绑向导 · 确认 | `bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh`（[`tt-patch-order-assignable-guide.sh`](../../../scripts/dev/lib/tt-patch-order-assignable-guide.sh) 防 409） |
| 后端安全 | confirm CAS · Accepted 禁 PATCH · mock_pay 门闸 · 预算对齐 | `cargo test -p traveltrust-api`（见总闸脚本） |
| 五主防回归 | `/` 段扩展（含 landing session） | `bash scripts/gates/five-main-routes-ui-antiregression-gate.sh` |
| 浏览器走廊 | Playwright 真 UI 走通 | `npm run e2e:web3-itinerary-10` |

**总闸（推荐）：**

```bash
bash scripts/dev/run-enterprise-local-10.sh
```

末行须 grep：`TT_ENTERPRISE_LOCAL_10: OK`

无 Playwright / 仅 API 已起时：

```bash
SKIP_E2E=1 bash scripts/dev/run-enterprise-local-10.sh
```

---

## 诚实边界

- **① 走廊 10** = 上表 **全部 exit 0**（含 E2E 时须 full-stack：API `:8080` + Next `:3012`，`run-e2e-default.mjs` 可自动拉起）。
- **不等于** ② 测试网真付、③ 生产 go-live P0 清单已闭。
- 旅客在 plain `/market` **看不到自己的单** 为产品设计；向导见 discover、旅客见 **`/market?view=split&bindGuideToOrder=`** — E2E 断言 bind 横幅与 URL。

---

## ② 待办（未开工）

须 [PHASE2-START-CHECKLIST · G-0～G-4](../../../docs/runbook/PHASE2-START-CHECKLIST.md#0--总入口闸phase-②-任何工作流开工前) 后再宣称 ② 走廊或全站企业分提升。

**② 测试网 / ③ 生产 / 公网需求全文：** [ENTERPRISE-SITE-10-L5-MATRIX](../../../docs/runbook/ENTERPRISE-SITE-10-L5-MATRIX.md) **§2～§3**。
