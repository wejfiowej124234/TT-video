# 阶段一 · 本地全功能手验（A-08）

**日期：** 2026-05-17  
**Git HEAD：** dd52fe2+local
**栈：** `scripts\start-api-with-seed.bat`（Step 0a/6c–6e）· API :8080 · Next :3012

| # | 路径/功能 | 通过 | 证据 / 关联 |
|---|-----------|------|-------------|
| 1 | API `/health` | [x] | `artifacts/pi1-closure-verify-20260517.log` |
| 2 | 注册 / 登录 | [x] | `artifacts/a08-smoke-ab-core-chain.log` |
| 3 | `/me/onboarding` + 内网 webhook | [x] | `artifacts/a08-tt9618-pg-evidence.log` |
| 4 | 发现 / 市场 | [x] | smoke-ab + vertical-slice |
| 5 | 下单主脊 | [x] | smoke-ab #6–9 |
| 6 | 订单详情 / 消息 | [x] | smoke-ab |
| **7a** | **社区 Feed 图浏览器可见** | [x] | **PH1-FE-01** · 截图 `artifacts/fe-browser-*-fe01.png` |
| **7b** | 社区 uploads 匿名 GET 机读 | [x] | **PH1-UI-09** · pi1-closure log |
| **7c** | **视频+封面上传发帖** | [x] | **PH1-FE-02** |
| **7d** | **多图发帖** | [x] | **PH1-FE-03** |
| **7e** | **文字帖** | [x] | **PH1-FE-04** |
| **7g** | **`/traveltrust` v3 重设计** | [ ] | **PH1-FE-08** · 截图 `artifacts/fe-browser-traveltrust-redesign-*.png` |
| **7i** | **PH1-FE-10** | `/traveltrust` 动效手验（Tab/CLS/减动效） | [ ] |
| **7h** | **`/traveltrust` Tab a11y + 信任 Chip** | [ ] | **PH1-FE-09**（P1，可与 7g 同日） |
| **7f** | **`/community/me` 头像上传** | [x] | **PH1-FE-05** |
| 8 | 导游/行程壳 | [x] | `a08-playwright-smoke.log` |
| 9 | Admin smoke | [x] | `a08-playwright-smoke-admin.log` |

| **7j** | **PH1-FE-11** | `/traveltrust` 首屏 1.2s 编排 | [ ] |

**P0 阻断：** **PH1-FE-01～03** + **`/traveltrust` PH1-FE-08**（§C P0：UI-12/13/14/16/21）未勾前 **不可签 PH-1**。社区实现项已 closed；`/traveltrust` 见 [重设计 v3](./issues-phase1-traveltrust-home-redesign.md) + [§C](./issues-phase1-local.md#c--traveltrust-首页-ia-重设计挡-ph-1)。

签字：________ 日期：________


### PH1 /traveltrust v6 browser (2026-05-18, ① local)
- E2E: `cd frontend && npm run e2e:pi1-traveltrust` → **6 passed**
- Screenshots: `artifacts/fe-browser-traveltrust-redesign-desktop.png`, `artifacts/fe-browser-traveltrust-redesign-mobile.png`
