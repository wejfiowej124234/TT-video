# Phase ② · Git ↔ Staging 基线纪律

**生效：** 2026-06-06  
**最新同步：** 20260617 · preflight — local `d32b4813…` · staging `877a1e77…` **MISMATCH** · 须 `--full` 部署后 PASS

**编排：**

```bash
export HTTPS_PROXY=http://127.0.0.1:15715
export NO_PROXY=localhost,127.0.0.1,tt-api-staging.fly.dev,tt-web-staging.fly.dev,.fly.dev
bash scripts/dev/run-phase2-testnet-full-sync-deploy.sh --preflight
bash scripts/dev/run-phase2-testnet-full-sync-deploy.sh --full   # commit deploy paths 后
```

---

## 1 · 当前真源状态（PASS）

| 端 | SHA / 状态 |
|----|------------|
| **git HEAD** | `96c739e104054fbc26efd6ec9abad25cba309c90` |
| **tt-api-staging `/meta`** | `96c739e104054fbc26efd6ec9abad25cba309c90` ✅ |
| **tt-web-staging** | 自 `frontend/` @ `96c739e1` · `FLY_WEB_NO_CACHE=1` 构建 ✅ |

**机读键：**

```text
GIT_STAGING_BASELINE_SYNC: PASS
GIT_SHA_LOCAL_STAGING_MATCH: YES (96c739e104054fbc26efd6ec9abad25cba309c90)
```

---

## 2 · 20260606 同步摘要

### 前置

- 起始 HEAD `9747e1c`（frontend + Phase ② 脚本基线）
- **禁止 dirty tree 部署**：`crates/` WIP 先 stash，仅自 committed tree 构建

### 追加 commit（部署所需）

| Commit | 内容 |
|--------|------|
| `67a22387` | Dockerfile：复制 migrations + spec artifacts |
| `d077071f` | `.dockerignore`：放行 `docs/spec/artifacts` |
| `c1a38d54` | 19 条 staging PG 已应用 migrations 入库 |
| `deb38a97` | Admin L5 / Phase ② API 路由层 |
| `96c739e1` | 其余 staging API 模块（可编译完整镜像） |

### 部署

```bash
export HTTPS_PROXY=http://127.0.0.1:15715
export NO_PROXY=localhost,127.0.0.1,tt-api-staging.fly.dev,tt-web-staging.fly.dev

bash scripts/dev/phase2-staging-fly-deploy-and-sync.sh          # API
FLY_WEB_NO_CACHE=1 bash scripts/dev/deploy-tt-web-staging.sh   # Web
```

### 复验（全部 PASS）

| 闸 | 证据 |
|----|------|
| SHA 对拍 | `git rev-parse HEAD` = staging `/meta.build.git_sha` |
| 六大域 UAT | `staging-uat-six-domains/20260606T144405Z` · 8 passed / 0 failed |
| Admin L5 | `GO_staging_admin_l5_audit/20260606T152813Z` · verdict=PASS |
| Phase 2.5 | `phase25-coverage-hardening/20260606T153032Z` · 5/5 PASS |

**证据目录：** `evidence/GO_phase2_testnet_20260526/git-staging-baseline-sync/20260606T140150Z/`

---

## 3 · 纪律（Phase ③ 前强制）

1. **先 commit，再 deploy** — 禁止「staging 有、git 无」。
2. **API + Web 同批部署** — 禁止只部署 web。
3. **Web 换真源时 `FLY_WEB_NO_CACHE=1`** — 避免 Docker 层误用旧 frontend。
4. **部署前检查**：`frontend/`、`deploy/fly/`、`Dockerfile`、将参与 API 构建的 `crates/` **无未提交运行时代码**。
5. **Production 仅来自 tagged commit** — 禁止 dirty working tree 构建。

---

## 4 · 标准对拍命令

```bash
git rev-parse HEAD
curl -sS https://tt-api-staging.fly.dev/meta | jq -r '.build.git_sha'
# 须完全一致

bash scripts/dev/run-staging-uat-six-domains.sh
bash scripts/dev/run-admin-l5-staging-audit.sh
bash scripts/dev/run-phase25-coverage-hardening-staging.sh
```

---

## 5 · 相关文档

- [PHASE2-DUAL-LOOP-COMPLETION-REPORT.md](./PHASE2-DUAL-LOOP-COMPLETION-REPORT.md)
- [PHASE2-LOCAL-STAGING-PARITY-LOOP.md](./PHASE2-LOCAL-STAGING-PARITY-LOOP.md)
