# C8 · Community Staging Ops Runbook（Phase ② · 测试网）

**Version:** 1.0.0 · **2026-05-31**  
**阶段：** **② 测试网 / staging** — **非** Phase ② GO · **非** Production GO  
**SSOT 互指：** [COMMUNITY-PHASE-2-3-ROADMAP](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) · [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md) · [COMMUNITY-MEDIA-OBJECT-STORAGE](./COMMUNITY-MEDIA-OBJECT-STORAGE.md)

---

## 0. 范围与边界

| 项 | 说明 |
|----|------|
| **本 Runbook 覆盖** | 社区 **staging** 运维：审核队列、上传安全、媒体播放、图片交付、社交链路、回滚、限流、对象存储、DB 迁移、URL 切换、故障排查、证据复跑 |
| **不覆盖** | ③ Production CDN/HLS edge · Stripe 生产 webhook · 主网触链 |
| **C8 PASS 含义** | Runbook 可执行 + 监控 smoke **exit 0** + C1–C7 证据路径可追溯 — **仅 C8 槽** |

**默认拓扑（本机 staging 预演）：**

| 组件 | 地址 | 说明 |
|------|------|------|
| API | `http://127.0.0.1:8080` | `traveltrust-api` · `GET /health` |
| Frontend | `http://127.0.0.1:3012` | Next dev / staging FE |
| PostgreSQL | `postgresql://…@127.0.0.1:5432/traveltrust_staging` | G-2 隔离库 |
| HTTPS 预演 | `https://*.loca.lt` | localtunnel · **非持久**（C1 曾用） |

---

## 1. C1–C7 证据索引（复跑入口）

| 槽 | 证据路径 | 复跑命令 | 关键产物 |
|----|----------|----------|----------|
| **C1** | `evidence/GO_phase2_testnet_20260526/community/C1/` | `API_BASE=<staging> bash scripts/dev/record-community-c1-seed-evidence.sh` | feed ≥20 · `automation_leak=0` |
| **C2** | `…/C2/` | `bash scripts/dev/record-community-c2-evidence.sh` | `matrix_93_d_com_c2_*` · upload smoke |
| **C3** | `…/C3/` | `bash scripts/dev/record-community-c3-evidence.sh` | moderation IT + staging E2E |
| **C4** | `…/C4/` | `bash scripts/dev/record-community-c4-evidence.sh` | MP4 playback · **HLS-CDN pending** |
| **C5** | `…/C5/` | `bash scripts/dev/record-community-c5-evidence.sh` | image delivery · **production CDN pending** |
| **C6** | `…/C6/` | `bash scripts/dev/record-community-c6-evidence.sh` | social graph · browser revisit |
| **C7** | `…/C7/` | `bash scripts/dev/record-community-c7-evidence.sh` | `report.json` **`release_gate=GO`** |
| **C8** | `…/C8/` | `bash scripts/dev/record-community-c8-evidence.sh` | 本 Runbook · monitoring smoke |

**验收前自检：**

```bash
for s in C1 C2 C3 C4 C5 C6 C7; do
  grep -q '^status: PASS' "evidence/GO_phase2_testnet_20260526/community/${s}/STATUS.txt"
done
```

---

## 2. 健康检查（每日 / 部署后）

```bash
# 快速监控（C8 smoke · exit 0 = 通过）
API_BASE=http://127.0.0.1:8080 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3012 \
  bash scripts/dev/smoke-community-c8-staging-monitoring.sh
```

| 检查项 | 命令 / 路径 | 期望 |
|--------|-------------|------|
| API 存活 | `curl -sS -o /dev/null -w '%{http_code}' $API_BASE/health` | **200** |
| 契约 meta | `curl -sS $API_BASE/meta` | **200** · JSON 含 chain 块 |
| 社区 Feed | `curl -sS "$API_BASE/api/v1/community/feed?limit=5"` | **200** · `posts` 数组 |
| 媒体能力 | `curl -sS $API_BASE/api/v1/community/media/capabilities` | **200** |
| 前端壳 | `curl -sS -o /dev/null -w '%{http_code}' $FE/community` | **200** |
| G-2 迁移 | `evidence/GO_phase2_testnet_20260526/g2-staging-migrate/latest/run.log` | migrate **exit 0** |

---

## 3. 审核队列（C3 · Moderation）

**链路：** 用户 `POST /api/v1/community/reports` → Admin `GET …/admin/community/reports` → `content_remove` → 公开面隐藏。

| 操作 | 命令 |
|------|------|
| Staging smoke | `bash scripts/dev/smoke-community-c3-staging-moderation.sh` |
| 全链证据 | `bash scripts/dev/record-community-c3-evidence.sh` |
| PG IT | `cargo test -p traveltrust-api matrix_93_d_com_c3_` |

**常见故障：**

- **429 report spam**：`community_abuse_policy` 同用户最短间隔 — 换 `@example.com` 测试账号或等待窗口。
- **Admin 403**：须 `admin` 角色 Bearer；staging 可用 `TRAVELTRUST_TESTNET_ADMIN_BEARER_MINT=1` + internal mint（见 `.env.example`）。
- **帖子仍可见**：确认 `content_remove` 已执行；查 `community_posts.visibility_status`。

---

## 4. 上传安全（C2 · Upload Security）

**规则：** MIME+魔数+体限+路径遍历 · 测试源 `test_origin` 不进公开 Feed。

| 操作 | 命令 |
|------|------|
| Staging smoke | `bash scripts/dev/smoke-community-c2-staging-upload.sh` |
| 证据 | `bash scripts/dev/record-community-c2-evidence.sh` |
| PG IT | `cargo test -p traveltrust-api matrix_93_d_com_c2_` |

**回滚：** 若错误放行 MIME — 停 API → 回滚 `crates/api` 至上一 tag → 复跑 C2 证据。

---

## 5. 媒体播放（C4 · Video / MP4）

**② 已验：** staging **MP4** + Feed **canplay** · **HLS/manifest/production CDN = BLOCKED（③）**

| 操作 | 命令 |
|------|------|
| Staging smoke | `bash scripts/dev/smoke-community-c4-staging-video-playback.sh` |
| 证据 | `bash scripts/dev/record-community-c4-evidence.sh` |
| 对象存储 | 见 [COMMUNITY-MEDIA-OBJECT-STORAGE](./COMMUNITY-MEDIA-OBJECT-STORAGE.md) |

**故障：**

- **`public_video_publish_ready=false`**：检查 `COMMUNITY_MEDIA_S3_*` env · 重启 API · `HeadBucket` 日志（`TT_COMMUNITY_MULTIPART_LOG=1`）。
- **Feed 无 canplay**：确认 `media_urls[0]` / `playback_url` 可 GET **200**。

---

## 6. 图片交付（C5 · Image Delivery）

**② 已验：** API 本地磁盘 serve · `Cache-Control: immutable, max-age=86400` · **production CDN edge = BLOCKED（③）**

| 操作 | 命令 |
|------|------|
| Staging smoke | `bash scripts/dev/smoke-community-c5-staging-image-delivery.sh` |
| 证据 | `bash scripts/dev/record-community-c5-evidence.sh` |
| Browser E2E | `C5_STAGING_EVIDENCE_RUN=1` + `record-community-c5-evidence.sh` |

---

## 7. 社交链路（C6 · Social Graph）

**覆盖：** follow/followers · DM unread/read · `likes_received` · Friends/Messages/Activity/Explore 回访。

| 操作 | 命令 |
|------|------|
| Staging smoke | `bash scripts/dev/smoke-community-c6-staging-social-graph.sh` |
| 证据 | `bash scripts/dev/record-community-c6-evidence.sh` |
| PG IT | `cargo test -p traveltrust-api matrix_93_d_com_c6_` |

**限流：** 关注/DM/发帖受 `community_abuse_policy` 约束 — E2E 用独立 `@example.com` 账号。

---

## 8. 93 矩阵归档（C7）

```bash
bash scripts/dev/record-community-c7-evidence.sh
python scripts/validate-regression-report.py evidence/GO_phase2_testnet_20260526/community/C7/report.json
```

- **`environment.name=staging`** · 社区 D 域 **`release_gate=GO`**
- **≠** ISS-007 全站窄切片 · **≠** A+B 全矩阵 GO

---

## 9. 限流与滥用防护

| 机制 | 位置 | 运维动作 |
|------|------|----------|
| `community_abuse_policy` | API middleware | 429 时换账号或调窗口（**仅 staging**） |
| 登录限流 | `POST /auth/login` | staging 可 `TRAVELTRUST_AUTH_LOGIN_RATE_LIMIT_DISABLED=1`（**勿用于 prod**） |
| 媒体上传限流 | `COMMUNITY_MEDIA_UPLOAD_RATE_LIMIT` | 见 `crates/api/src/middleware/mod.rs` |
| DM / follow 频控 | community routes | 日志搜 `429` + `x-request-id` |

---

## 10. 对象存储（S3 / MinIO / R2）

**真源：** [COMMUNITY-MEDIA-OBJECT-STORAGE](./COMMUNITY-MEDIA-OBJECT-STORAGE.md)

| 变量 | 用途 |
|------|------|
| `COMMUNITY_MEDIA_S3_BUCKET` | 桶名 |
| `COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL` | CDN/playback 前缀 |
| `COMMUNITY_MEDIA_S3_ENDPOINT` | R2/MinIO |
| `TRAVELTRUST_COMMUNITY_PUBLIC_VIDEO_SPEC_REQUIRED` | `=1` 时 `/health` 依赖 HeadBucket |

**孤儿分片：** 桶生命周期 `AbortIncompleteMultipartUpload` · DB `pending_upload` 对账。

---

## 11. 数据库迁移（G-2）

```bash
export DATABASE_URL=postgresql://traveltrust:traveltrust@127.0.0.1:5432/traveltrust_staging
bash scripts/dev/record-phase2-g2-staging-sqlx-migrate-evidence.sh
```

- **禁止** staging 与 prod 混用 `DATABASE_URL`
- 迁移真源：`crates/api/migrations/`
- 社区表：`community_posts` · `community_media_assets` · `community_follows` · `community_conversations` · `community_reports`

**回滚：** 无自动 down — 从备份 restore PG 或重建 `traveltrust_staging` 空库后 migrate + 复跑 C1 seed。

---

## 12. localtunnel ↔ 持久 staging URL

| 模式 | 用法 | 适用 |
|------|------|------|
| **localtunnel** | `STAGING_USE_LOCAL_TUNNEL=1 bash scripts/dev/bootstrap-phase2-g1-g2.sh` | 本机 ② 预演 · URL **每次不同** |
| **持久主机** | `STAGING_API_BASE=https://tt-api-staging.example bash scripts/dev/bootstrap-phase2-g1-g2.sh` | C1+ 正式 ② |

**切换步骤：**

1. 更新 `scripts/dev/.env.staging-onboarding.local` 中 `API_BASE` / `API_BASE_URL`
2. 同步前端 `NEXT_PUBLIC_API_BASE_URL`（或 Next rewrite）
3. 复跑 `bash scripts/dev/smoke-community-c8-staging-monitoring.sh`
4. 若 Feed/seed 依赖旧 URL — 复跑 **C1** seed 证据

**C1 历史：** `https://little-maps-call.loca.lt`（`20260531T115243Z`）— 隧道过期后 **须** 改 `API_BASE` 或重开隧道。

---

## 13. 回滚 playbook

| 场景 | 步骤 |
|------|------|
| **错误 API 部署** | 停进程 → checkout 上一已知 good SHA → `cargo build -p traveltrust-api` → 重启 → C8 smoke → 受影响 C* 证据复跑 |
| **错误 FE 部署** | `git checkout` frontend → `npm run build` / restart dev → `/community` 200 |
| **PG 迁移失败** | 勿 partial migrate — restore snapshot 或 drop/recreate `traveltrust_staging` → G-2 migrate → C1 seed |
| **对象存储误删** | 从桶版本/备份 restore · 复跑 C4/C5 |
| **限流误配** | 还原 `.env` → 重启 API → C6/C2 smoke |

---

## 14. 日志位置

| 来源 | 路径 / 检索 |
|------|-------------|
| API 请求 | stderr · 搜 `[req]` · `x-request-id` / `x-message-id` |
| Multipart 链 | `TT_COMMUNITY_MULTIPART_LOG=1` → `phase=capabilities_snapshot` 等 |
| Playwright E2E | `frontend/test-results/` · evidence `staging-*-e2e.log` |
| 证据 run | `evidence/GO_phase2_testnet_20260526/community/C*/run.log` |
| G-2 migrate | `evidence/GO_phase2_testnet_20260526/g2-staging-migrate/latest/` |
| localtunnel PID | `evidence/GO_phase2_testnet_20260526/g2-staging-migrate/latest/localtunnel.pid` |

---

## 15. 告警指标 · SLO · 错误预算（staging）

| 指标 | SLO（staging ②） | 告警阈值（建议） |
|------|------------------|------------------|
| `GET /health` 可用性 | **99%** 滚动 24h | 连续 3 次非 200 |
| `GET /api/v1/community/feed` p95 | **< 2s** | p95 > 5s 持续 10m |
| `POST …/community/posts` 5xx 率 | **< 1%** | > 5% 持续 5m |
| Moderation 队列深度 | Admin 可处理 | open reports > 100 且无处理 24h |
| Feed UGC 密度 | ≥20 真帖（C1） | `automation_leak > 0` 或 feed < 15 |

**错误预算（staging）：** 每月允许 **1 次** 计划外 C1–C7 证据复跑失败；超出须 root-cause 记录于 `evidence/…/community/BLOCKERS.md`。

---

## 16. 常见故障 · 恢复步骤

| 症状 | 可能原因 | 恢复 |
|------|----------|------|
| `/health` 503 + video spec | `TRAVELTRUST_COMMUNITY_PUBLIC_VIDEO_SPEC_REQUIRED=1` 且桶不可达 | 修 S3/R2 或 staging 设 `=0` · 重启 API |
| Feed 空 / C1 失败 | seed 未跑 · `TRAVELTRUST_PUBLIC_CATALOG_SURFACE` 未开 | 复跑 C1 seed · 设 env=1 |
| 上传 400 mime | C2 规则生效 | 预期行为；用真 PNG/JPEG |
| DM 401 | 缺 Bearer | `STRICT_SESSION_GATE=1` — 前端须 session token |
| 3012 refused | Next 崩溃 | `cd frontend && npm run dev:clean` |
| 8080 占用 | 旧 API 进程 | 杀 `traveltrust-api` · 重启 |
| C7 NO_GO | C 槽 STATUS 缺失 | 复跑对应 C* · 再跑 C7 |
| tunnel 502 | localtunnel 过期 | 重开 `STAGING_USE_LOCAL_TUNNEL=1` bootstrap |

---

## 17. C8 证据复跑（本槽验收）

```bash
# 仓库根 · API+FE 已起
API_BASE=http://127.0.0.1:8080 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3012 \
  bash scripts/dev/record-community-c8-evidence.sh
```

**产出：**

- `evidence/GO_phase2_testnet_20260526/community/C8/runbook.md`（本文件副本）
- `monitoring-check.log` · `run.log` · `STATUS.txt`

**PASS 条件：** smoke **exit 0** · C1–C7 `STATUS.txt=PASS` · runbook 章节完整。

---

## 18. 互指

- [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md)
- [PHASE2-START-CHECKLIST · G-0～G-4](./PHASE2-START-CHECKLIST.md)
- [bootstrap-phase2-g1-g2.sh](../scripts/dev/bootstrap-phase2-g1-g2.sh)
- [E2E-STABILITY-MINIMAL-PROBE](./E2E-STABILITY-MINIMAL-PROBE.md)

**合法宣称：** **C8 PASS（② 槽）** — **NOT** Phase ② GO · **NOT** Production GO.
