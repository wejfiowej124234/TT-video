# TT-MARKET-LISTINGS-DISPLAY-GOVERNANCE · Provider / Acquisition 展示数据治理

**生效：** 2026-07-02  
**机读：** [`registry/market-listings-display-governance.v1.yaml`](../../registry/market-listings-display-governance.v1.yaml)

```text
TT_MARKET_LISTINGS_DISPLAY_GOVERNANCE: CLOSED | IN_PROGRESS
```

## 范围

- **Provider** `/market/provider` · `GET /api/v1/market/provider/listings`
- **Acquisition** `/market/acquisition` · `GET /api/v1/market/acquisition/listings`
- Admin Public Operations · `entity_type=market_listings`

## 真源链

API/DB（Admin publish-queue）→ 公众 API → 前端 masonry `data-listing-id` → 浏览器卡片

## 运行

```bash
bash scripts/dev/run-market-listings-display-governance-audit.sh
```

## 退出条件

| 类 | 预期 |
|----|------|
| PRODUCT_DEFECT | **0 open** |
| ENHANCEMENT | Post-GO（占位媒体池等） |
