# TESTNET_SYNC_PACKAGE · 人工验证（② · staging）

**基线 SHA:** `3bbedda776b2cf2666efaac055ce9e13d98127b7`
**诚实边界：** 通过本清单 **≠** ③ Production GO

## A · Booking Core（traveler → guide → order → escrow → completion）

1. 登录 staging 旅行者账号 → `/market` 或向导详情
2. 选择向导 → 创建订单 → 双边确认 → mock-pay / escrow 路径可达
3. 完成或 dispute 路径可浏览（只读验收即可）

## B · Itinerary（country → city → booking）

1. `/` 或 `/market`：选 **product_countries** 十国之一 + 预设 city
2. 创建行程 / 自定义行程 draft → 预览 → 订单草稿

## 签字后继续

```bash
export TESTNET_MANUAL_VERIFY_PASS=1
bash scripts/ops/run-testnet-sync-package.sh --freeze-soak
```
