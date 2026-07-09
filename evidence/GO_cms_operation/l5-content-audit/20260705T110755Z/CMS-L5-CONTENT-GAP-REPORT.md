# CMS L5 Content Gap Report

**SSOT:** Staging Runtime DOM + Catalog API + Market Catalog API
**Phase:** ② Staging · **不含** Matrix / Registry / Runbook / Evidence

**Generated:** 20260705T110755Z

## 目标（100%）

| 指标 | 当前 |
|------|------|
| CMS 接管率 | 22% |
| Runtime 使用 CMS | 15% |
| L5 合格率 | 25% |
| 图文一致性 | 100% |
| 国家/城市/文化一致性 | 100% |

## Asset Family 汇总

| Family | Total | CMS已接管 | Runtime生效 | L5合格 | 未迁移 | 图文不一致 | 国家错误 | 城市错误 | 建议替换 |
|--------|-------|-----------|-------------|--------|--------|------------|----------|----------|----------|
| destination_ambient | 10 | 10 | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| city_hero | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| poi | 4 | 4 | 0 | 0 | 4 | 0 | 0 | 0 | 4 |
| food | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| hotel | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| transport | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| provider_listing | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 |
| acquisition_listing | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 |
| banner | 30 | 0 | 0 | 6 | 30 | 0 | 0 | 0 | 30 |
| video_poster | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 1 |

## P0 整改

- **poi** · /market · P0 · 开启 Frontend catalog opt-in · 验证 Runtime URL = Catalog publish
  · issues: Catalog publish 与 Runtime URL 不一致（接线断链）
- **poi** · /market · P0 · 开启 Frontend catalog opt-in · 验证 Runtime URL = Catalog publish
  · issues: 尺寸不足 600×400（L5 ≥640×480） · Catalog publish 与 Runtime URL 不一致（接线断链）
- **poi** · /market · P0 · 开启 Frontend catalog opt-in · 验证 Runtime URL = Catalog publish
  · issues: 尺寸不足 600×400（L5 ≥640×480） · Catalog publish 与 Runtime URL 不一致（接线断链）
- **poi** · /market · P0 · 开启 Frontend catalog opt-in · 验证 Runtime URL = Catalog publish
  · issues: 尺寸不足 600×400（L5 ≥640×480） · Catalog publish 与 Runtime URL 不一致（接线断链）

## P1 整改

- **provider_listing** · /market/provider · Upload → Review → Publish · provider_listing
- **provider_listing** · /market/provider · Upload → Review → Publish · provider_listing
- **provider_listing** · /market/provider · Upload → Review → Publish · provider_listing
- **provider_listing** · /market/provider · Upload → Review → Publish · provider_listing
- **provider_listing** · /market/provider · Upload → Review → Publish · provider_listing
- **provider_listing** · /market/provider · Upload → Review → Publish · provider_listing
- **provider_listing** · /market/provider · Upload → Review → Publish · provider_listing
- **provider_listing** · /market/provider · Upload → Review → Publish · provider_listing
- **provider_listing** · /market/provider · Upload → Review → Publish · provider_listing
- **provider_listing** · /market/provider · Upload → Review → Publish · provider_listing
- **acquisition_listing** · /market/acquisition · Upload → Review → Publish · acquisition_listing
- **acquisition_listing** · /market/acquisition · Upload → Review → Publish · acquisition_listing
- **acquisition_listing** · /market/acquisition · Upload → Review → Publish · acquisition_listing
- **acquisition_listing** · /market/acquisition · Upload → Review → Publish · acquisition_listing
- **acquisition_listing** · /market/acquisition · Upload → Review → Publish · acquisition_listing

## P2 整改

- **banner** · / · Upload → Review → Publish · banner
- **banner** · / · Upload → Review → Publish · banner
- **banner** · / · Upload → Review → Publish · banner
- **banner** · /?country=中国 · Upload → Review → Publish · banner
- **banner** · /?country=中国 · Upload → Review → Publish · banner
- **banner** · /?country=中国 · Upload → Review → Publish · banner
- **banner** · /?country=韩国 · Upload → Review → Publish · banner
- **banner** · /?country=韩国 · Upload → Review → Publish · banner
- **banner** · /?country=韩国 · Upload → Review → Publish · banner
- **banner** · /?country=新加坡 · Upload → Review → Publish · banner
- **banner** · /?country=新加坡 · Upload → Review → Publish · banner
- **banner** · /?country=新加坡 · Upload → Review → Publish · banner
- **banner** · /?country=泰国 · Upload → Review → Publish · banner
- **banner** · /?country=泰国 · Upload → Review → Publish · banner
- **banner** · /?country=泰国 · Upload → Review → Publish · banner
