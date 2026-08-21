# TT-CI-BUILD-STABILITY · 远程构建 / CI 稳定性

**机读：** [`registry/ci-build-stability.v1.yaml`](../../registry/ci-build-stability.v1.yaml)  
**范围：** Fly remote build · Docker `npm run build` · **Build Infrastructure**（与 Market Runtime / OCS / DDG **无关**）

```text
TT_CI_BUILD_STABILITY: ENFORCED
```

---

## 与 Market Runtime 的边界

| 维度 | Market Runtime（子站竞态收口） | CI Build Stability（本 Runbook） |
|------|-------------------------------|----------------------------------|
| 分类 | Frontend Runtime Consistency | Build Infrastructure |
| 用户可见 | UI=API 首进即正确 | 否（仅部署链路） |
| 证据包 | `GO_market_subsite_frontend_race_fix/` | `GO_ci_build_stability/` |
| 是否挡 GO | 否（已 CLOSED） | 否（Low · 单独跟踪） |

**禁止** 将 remote build OOM 写入 Market Race Fix 的 `issue_taxonomy` 或 Sign-off 正文。

---

## 开放项 · CI-BUILD-20260703-V49-OOM

| 字段 | 值 |
|------|-----|
| **Severity** | **Low** |
| **Category** | **Build Infrastructure** |
| **Status** | **OPEN** |
| **Symptom** | `tt-web-staging` **v49** Fly remote `npm run build` 失败（OOM / exit 1） |
| **Active staging** | **v48** · `deployment-01KWKTAYPE5Q61Q4X80S6Y3R9F` |
| **Evidence** | `evidence/GO_ci_build_stability/20260703T113000Z/v49-remote-build-oom.json` |

**Issue Registry（总账 SSOT）：** [`registry/open-issues.v1.yaml`](../../registry/open-issues.v1.yaml) — Dashboard 与发布决策统一引用此 ID，本 Runbook 为模块细节。

**含义：** v48 可部署 ≠ 远程构建链路无风险；v50+ 可能复现 OOM，须单独消项。

### 缓解（运维 · 非产品修复）

```bash
# 推荐：专用 OOM 脚本（Depot + 更大 heap）
bash scripts/dev/tt-web-staging-oom-fix-deploy.sh

# 或显式 env
DEPLOYMENT_STATE=fix TESTNET_FREEZE_OVERRIDE=1 \
FLY_WEB_OOM_FIX=1 FLY_WEB_REMOTE_BUILD=1 \
BUILD_NODE_MAX_OLD_SPACE_SIZE=6144 FLY_WEB_BUILDER_MEMORY_MB=8192 \
bash scripts/dev/deploy-tt-web-staging.sh
```

### 关闭条件（未来）

- 连续 N 次 remote build PASS（含 `npm run build` 在 Fly builder 上）
- 或默认 deploy 脚本已启用 OOM fix 且 registry 项标记 **CLOSED**

---

## 登记新 Build 事件

1. **先**写入 `registry/open-issues.v1.yaml` → `issues[]`（总账）
2. 写入 `evidence/GO_ci_build_stability/<UTC>/`
3. 追加 `registry/ci-build-stability.v1.yaml` 模块细节（引用同一 `id`）
4. 更新 `executive-dashboard.v1.yaml` → `open_issues.summary`
5. **不要** 修改 `GO_market_subsite_frontend_race_fix` 或 Market Runtime Sign-off
