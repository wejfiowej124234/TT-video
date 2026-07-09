# ② Staging smoke（Fly · PH-2 前）

**分层：** 仅 **② 测试网**；**不得**用 ① `local-smoke.md` 或 `ci-local` 全绿冒充本表。  
**环境：** [staging-env.md](./staging-env.md)  
**问题清单：** [issues-phase2-staging.md](./issues-phase2-staging.md)

**前置：** [phase-signoff.md](./phase-signoff.md) **PH-1 已签字**。

| # | 检查项 | 状态 | 证据 / 备注 |
|---|--------|------|-------------|
| 1 | `GET https://tt-api-staging.fly.dev/health` → 200 | [ ] | curl / 截图 |
| 2 | `https://tt-web-staging.fly.dev` 首页 200 | [ ] | 浏览器 |
| 3 | 登录（staging 专用账号，**非** tourist@test.com ① 默认） | [ ] | |
| 4 | `GET …/community/media/capabilities` · `public_video_publish_ready` | [ ] | 真桶已配 |
| 5 | 社区视频 multipart 浏览器证据（**PH2-FE-01**） | [ ] | `run-community-publishdrawer-staging-evidence.sh` |
| 6 | Stripe **test** webhook 命中 staging API | [ ] | Dashboard + 日志 |
| 7 | Actions **job `e2e`** 绿（**PH2-B09**） | [ ] | run URL |
| 8 | R-003 `report.json` GO（**PH2-C01**） | [ ] | `artifacts/staging-r003-report.json` |

**Git HEAD（staging 部署时）：** ________  
**复核人签字：** ________　日期：________
