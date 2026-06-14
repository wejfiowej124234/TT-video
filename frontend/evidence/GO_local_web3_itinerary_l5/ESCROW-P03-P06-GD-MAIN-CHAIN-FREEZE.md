# P03–P06 + GD/P06 公众向导主链 · ① 本地冻结（2026-06-09）

**阶段：① 本地** — itinerary-first Escrow 走廊 **P03 接单 → P04 双边确认 → P05 终版 snapshot → P06 mock-pay/托管 → GD 日历占用/释放** 主链 **产品 + 机读** 一并冻结；**不**表示 ② 测试网 / ③ 生产 Escrow GO。

**代码真源：** `frontend/e2e/helpers/escrowP05P06Corridor.ts` · `frontend/e2e/helpers/publicCatalogHangzhouGuide.ts` · `frontend/e2e/escrow-p05-p06-itinerary-first.spec.ts`

---

## 冻结结论（ACTIVE）

| 项 | 状态 |
|----|------|
| **向导 SSOT** | 公众 catalog 杭州 `f0e0b101-0001-4001-8001-000000000001` · `tg_guide_main@trustgate-e2e.local` |
| **绑定向导** | API `PATCH …/guide`（非 Market UI bind） |
| **P05 终版** | `POST …/confirm-final-plan` + `version_conflict` 重试（读 `current_version`） |
| **P06 入金** | `/pay` mock-pay 或 API `POST …/mock-pay`（`P3_CHAIN_OFF=1`） |
| **GD 日历** | `/guides/[id]` 红格占用 · 完成/取消后恢复可订 |
| **冻结日** | **2026-06-09** |
| **权威证据** | `ESCROW-GD-P06-PUBLIC-CATALOG-20260609T043011Z.log` |

**维护期纪律（写死）：** 主链 spec / corridor helper **仅允许** bugfix · 数据链路 · i18n/a11y · 门闸字段对齐；**禁止** 改主链步骤顺序、换非公众 catalog 向导 SSOT、删除日历 UI 断言。**异常流**见 [`escrow-p03-p06-exception-flows.spec.ts`](../../e2e/escrow-p03-p06-exception-flows.spec.ts)（可增用例，不得削弱主链覆盖）。

---

## 主链步骤（与 Playwright 一致）

```text
seedTrustGateE2eFixtures + release 杭州向导档期
  → registerFreshTourist + seedPublishedOpenItineraryOrder
  → PATCH guide（杭州）+ PATCH trip-dates
  → 旅行者 UI 登录 /escrow/:id
  → 向导 accept + 双方 confirm-bilateral（sub_status=confirmed）
  → POST confirm-final-plan（snapshot_hash 0x…）
  → mock-pay → escrowed
  → GET …/availability occupied + /guides/[id] 日历红
  → confirm-completion 或 cancel → 档期释放 + 日历白
```

---

## 机读验收（主链 · 须 exit 0）

```bash
bash scripts/dev/record-escrow-gd-p06-public-catalog-evidence.sh
```

末行：`TT_ESCROW_GD_P06_PUBLIC_CATALOG_EVIDENCE: OK`

**绿集回归（同批）：** `bash scripts/dev/run-web3-itinerary-l5-green.sh`

---

## 互指

| 读者 | 文档 |
|------|------|
| 异常流验收 | [`escrow-p03-p06-exception-flows.spec.ts`](../../e2e/escrow-p03-p06-exception-flows.spec.ts) · `record-escrow-p03-p06-exception-flows-evidence.sh` |
| 订单页 UI | [ESCROW-DRAFT-EXPERIENCE-FREEZE](./ESCROW-DRAFT-EXPERIENCE-FREEZE.md) |
| 向导详情 | `publicCatalogHangzhouGuide.ts` · GD-L5 |
| Agent | `AGENTS.md` · `traveltrust-ai-collab.mdc` |

**诚实边界：** ① 本地主链绿 **≠** ② staging 全矩阵 GO **≠** ③ Production GO。
