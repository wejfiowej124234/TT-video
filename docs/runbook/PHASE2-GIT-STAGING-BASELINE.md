# Phase ② · Git ↔ Staging 基线纪律

**生效：** 2026-06-06（双闭环完成后）  
**问题：** staging 已部署修复 · 本地有修复 · **git 未记录** → Phase ③ Production **不可复现、不可回滚**。

---

## 1 · 三端真源关系（2026-06-06 前）

| 端 | 状态 | 说明 |
|----|------|------|
| **tt-web-staging** | 超前于 git | `FLY_WEB_NO_CACHE=1` 从 **完整 `frontend/` 工作区** 构建 |
| **tt-api-staging** | = git `HEAD` | Docker **CACHED** 构建 · `/meta` `git_sha` = `4a9ab0d…` |
| **git** | 落后 | Admin L5 会话重置、parity 脚本、大量 frontend 改动 **未 commit** |

**风险：** 任何人从 git clone 无法重建 staging web；Production 部署可能漏掉已验修复或带入未验 diff。

---

## 2 · 本基线 commit 范围

| 路径 | 理由 |
|------|------|
| `frontend/` | 与 **tt-web-staging** 运行时一致（全树） |
| `deploy/fly/` | Fly staging 部署配置 |
| `docs/runbook/PHASE2-*.md` | Phase ② runbook / 双闭环报告 |
| `scripts/dev/*staging*` · `*phase2*` · 双闭环 smoke | S5/S6 / Admin L5 / parity gate 可复现 |

**不含：** `scripts/dev/.env.*.local`（密钥 · `.gitignore`）、`crates/`（API staging 仍为上一 `HEAD` 直至下次 API deploy）。

---

## 3 · commit 后必做（SHA 对拍）

```bash
# 1) 确认新 HEAD
git rev-parse HEAD

# 2) 重部署（建议 web 仍 FLY_WEB_NO_CACHE=1 首次，或确认 Docker 未误用旧层）
export HTTPS_PROXY=http://127.0.0.1:15715
export NO_PROXY=localhost,127.0.0.1,tt-api-staging.fly.dev,tt-web-staging.fly.dev
bash scripts/dev/phase2-staging-fly-deploy-and-sync.sh   # API · 刷新 git_sha
FLY_WEB_NO_CACHE=1 bash scripts/dev/deploy-tt-web-staging.sh

# 3) 对拍
curl -sS https://tt-api-staging.fly.dev/meta | jq -r '.build.git_sha'
git rev-parse HEAD   # 须一致

# 4) 快验
bash scripts/dev/run-admin-l5-staging-audit.sh
```

---

## 4 · Phase ③ 前纪律（强制）

1. **先 commit，再 deploy** — 禁止「staging 有、git 无」。
2. **deploy 参数写入 run.log** — `TRAVELTRUST_BUILD_GIT_SHA` / `FLY_WEB_NO_CACHE`。
3. **Production 仅允许来自 tagged commit** — 不得从 dirty working tree 构建。
4. 日常：**本地改 → S3 绿 → commit → S5 → S6**（见 [PHASE2-LOCAL-STAGING-PARITY-LOOP.md](./PHASE2-LOCAL-STAGING-PARITY-LOOP.md)）。

---

## 5 · 相关文档

- [PHASE2-DUAL-LOOP-COMPLETION-REPORT.md](./PHASE2-DUAL-LOOP-COMPLETION-REPORT.md)
- [PHASE2-LOCAL-STAGING-PARITY-LOOP.md](./PHASE2-LOCAL-STAGING-PARITY-LOOP.md)
- [PHASE2-CLOSING-GAP.md](./PHASE2-CLOSING-GAP.md)
