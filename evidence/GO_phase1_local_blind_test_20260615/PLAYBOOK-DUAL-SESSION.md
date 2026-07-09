# ① 双会话 Playbook（不混跑）

**BL-③-001** mock-pay ↔ chain-on **冲突留 ③ 决策**；① 执行采用 **分轨、分端口**。

## 当前运行态（2026-06-15 收口）

| 端口 | 状态 | 说明 |
|------|------|------|
| **8080** | **ACTIVE · chain-on** | 真人 UI 质押 / 多身份盲测 **唯一** API |
| **8081** | **STOPPED** | Chain B 临时会话已关，防双轨混用 |

## 轨 A · chain-on（人测默认 · 保持运行）

| 项 | 值 |
|----|-----|
| API | http://127.0.0.1:8080 |
| 环境 | 根 .env P3_CHAIN_OFF=0 · TRAVELTRUST_CHAIN_ON=1 |
| 用途 | Guide/Provider 质押 · 多身份 · 页面可用性 · /meta 759 |
| 启动 | bash scripts/dev/start-api-for-playwright.sh（勿强制 P3_CHAIN_OFF=1） |
| Next | http://127.0.0.1:3012（指向 **8080**） |

**勿**在本轨跑 mock-pay 全链烟测（会 501）。

## 轨 B · chain-off（Chain B 支付闭环 · 仅临时会话）

| 项 | 值 |
|----|-----|
| API | http://127.0.0.1:8081（与 8080 **并行不混**） |
| 环境 | 进程注入 P3_CHAIN_OFF=1 + TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1 |
| 用途 | smoke-seed-tourist-guide-transaction-local.sh mock-pay → completed |
| 烟测 | API_BASE=http://127.0.0.1:8081 bash scripts/dev/smoke-seed-tourist-guide-transaction-local.sh |
| 结束 | **必须**关 8081 进程，仅保留轨 A（见 05-session-closure.txt） |

**注意：** Next 默认连 8080；轨 B UI 核对须临时改 NEXT_PUBLIC_API_URL 或仅信 API 日志 + 轨 A 只读壳。

## ② 边界

不修改 deploy-tt-web-staging.sh / staging soak。
