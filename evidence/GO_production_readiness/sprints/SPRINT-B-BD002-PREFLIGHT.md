# Sprint B · BD-002 启动前三问（未启动）

**TT_SPRINT_A:** CLOSED · **TT_SPRINT_B:** READY · **ACTIVE:** false

## ① Root Cause 是什么？

**Provider Pricing 不完整** — Provider 价格未配置或未在 Market 一致展示。

## ② Supporting Evidence？

| 来源 | 状态 |
|------|------|
| Provider Day2 Probe | ⏳ pending（无 probe script / JSON  yet） |
| BD-002 open issue | ✅ 已登记 |
| HAT Provider order | ⏳ pending |
| Market listings API | ⏳ 待抽检 |

**结论：** 方向合理 · **Evidence 不足** · 勿直接开修。

## ③ Exit Condition？

**Pricing API 返回正确价格且 Market 展示一致**

## 下一步

Provider Probe → Evidence → 确认/修正 BD-002 → `active_sprint: BD-002`
