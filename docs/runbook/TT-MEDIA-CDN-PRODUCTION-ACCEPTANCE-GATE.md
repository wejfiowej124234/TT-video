# MEDIA_CDN_PRODUCTION_ACCEPTANCE · Production Acceptance Gate

**Gate ID：** `MEDIA_CDN_PRODUCTION_ACCEPTANCE`  
**Display status：** `PENDING`（Owner 完成 Cloudflare 配置前不可最终关闭）  
**机读 SSOT：** [`registry/media-cdn-production-acceptance.v1.yaml`](../../registry/media-cdn-production-acceptance.v1.yaml)

```text
MEDIA INFRASTRUCTURE ACCEPTANCE ONLY
Catalog Unsplash ≠ failure · see PI3-CATALOG-ASSET-MIGRATION
```

---

## 0 · 验收解耦治理原则（ENFORCED）

> **Media Infrastructure 验收**（本 Gate）仅验证媒体服务能力，**不**验证运营素材来源。  
> **Catalog Asset Migration 验收**仅验证素材来源、版权与运营内容，**不**重新验收媒体基础设施。

禁止：Catalog 素材未替换 → 判 Infra Gate FAIL。  
禁止：Infra 已 CLOSED → Catalog 验收再跑一遍 multipart/CDN/CORS。

---

## 1 · 状态机

```text
PI3-MEDIA-PERSISTENT-STAGING          ✅ CLOSED
        │
        ▼
PI3-MEDIA-R2-CDN-FINAL                ⏳ WAITING_OWNER_CF
        │  Owner 执行 TT-PI3-MEDIA-R2-CDN-FINAL-OWNER-CHECKLIST.md §1–§5
        ▼
PI3-MEDIA-R2-CDN-FINAL                🔄 AWAITING_ACCEPTANCE（配置完成，待验收）
        │
        ▼
MEDIA_CDN_PRODUCTION_ACCEPTANCE       ⏳ PENDING → IN_PROGRESS → PASS
        │
        ▼ PASS（本 Runbook §4 全部通过）
PI3-MEDIA-R2-CDN-FINAL                ✅ CLOSED
MEDIA_CDN_PRODUCTION_ACCEPTANCE       ✅ CLOSED
```

**禁止：**

```text
Cloudflare 配好了 → 直接 CLOSED   ❌
```

**正确：**

```text
WAITING_OWNER_CF → MEDIA_CDN_PRODUCTION_ACCEPTANCE → PASS → CLOSED   ✅
```

---

## 2 · Dashboard（当前目标状态）

| 项目 | 状态 | 说明 |
|------|------|------|
| 本地（MinIO） | ✅ | Phase ① 开发 |
| Staging（Fly Tigris） | ✅ | Phase ② 稳定基线 · `PI3-MEDIA-PERSISTENT-STAGING` CLOSED |
| Production（R2 + CDN） | ⏳ | Owner 待执行 |
| `PI3-MEDIA-PERSISTENT-STAGING` | ✅ **CLOSED** | |
| `PI3-MEDIA-R2-CDN-FINAL` | ⏳ **WAITING_OWNER_CF** | Owner 配置清单 |
| `MEDIA_CDN_PRODUCTION_ACCEPTANCE` | ⏳ **PENDING** | 本 Gate · 配置完成后执行 |
| `CI-BUILD-20260703-V49-OOM` | 🟡 **OPEN (Low)** | |

---

## 3 · 验收检查项（全部必过）

| ID | 检查项 | 自动化 | 说明 |
|----|--------|--------|------|
| **G1** | CDN 返回 **200** | ✅ 脚本 | `cdn.traveltrust.app` smoke HEAD · TLS 正常 |
| **G2** | 社区媒体 URL 已切 **cdn.traveltrust.app** | ✅ `STRICT_CDN=1` audit | 无 `loca.lt` · 无 `tigris.dev` |
| **G3** | `public_video_publish_ready=true` | ✅ capabilities | HeadBucket + secrets 正确 |
| **G4** | 浏览器**图片**正常 | ✅ Playwright | Guide · Provider · Acquisition · Community · Homepage |
| **G5** | 浏览器**视频**正常 | ✅ C4 smoke | Community Feed 可播 |
| **G6** | **上传**正常 | ✅ C4 smoke | multipart session → PUT → complete |
| **G7** | **新上传**立即可访问 | ✅ C4 smoke | complete 后 CDN GET **200** |
| **G8** | **Cache** 命中正常 | ✅ 双次 HEAD | `cf-cache-status` HIT / REVALIDATED（或人工签字 DYNAMIC） |
| **G9** | **回滚验证**完成 | ⚠️ 半自动 | 模板 + Runbook §8 + interim closeout；live drill 可选签字 |

### 3.1 API Surfaces（G2 覆盖）

| Surface | Endpoint |
|---------|----------|
| Community Feed | `GET /api/v1/community/feed?limit=30` |
| Guides | `GET /api/v1/guides?limit=50` |
| Provider | `GET /api/v1/market/provider/listings?limit=50` |
| Acquisition | `GET /api/v1/market/acquisition/listings?limit=50` |
| Market Feed | `GET /api/v1/official/cold-start/surfaces/market_feed` |
| Homepage | `GET /api/v1/official/cold-start/surfaces/homepage` |

> OCS Catalog 图可能仍为 Unsplash — **PI3-CATALOG-ASSET-MIGRATION 轨道**，**不**阻挡本 Gate；**社区 multipart 媒体**须 STRICT CDN（无 loca.lt / 无 tigris.dev）。

### 3.2 浏览器 Surfaces（G4/G5）

| 页面 | URL |
|------|-----|
| Community Feed | `https://tt-web-staging.fly.dev/community` |
| Guide | `https://tt-web-staging.fly.dev/market?view=guides` |
| Provider | `https://tt-web-staging.fly.dev/market/provider` |
| Acquisition | `https://tt-web-staging.fly.dev/market/acquisition` |
| Homepage / Official | `https://tt-web-staging.fly.dev/` · `/market` |

---

## 4 · 执行 Gate（Owner 配置完成后）

### 4.1 前置：Owner 配置已完成

确认 [`TT-PI3-MEDIA-R2-CDN-FINAL-OWNER-CHECKLIST.md`](TT-PI3-MEDIA-R2-CDN-FINAL-OWNER-CHECKLIST.md) **§1–§5** 已完成：

- [ ] R2 桶 + Custom Domain `cdn.traveltrust.app`
- [ ] CORS · Lifecycle
- [ ] Fly `tt-api-staging` secrets → CDN
- [ ] Fly `tt-web-staging` 重建 `NEXT_PUBLIC_*`

将 `PI3-MEDIA-R2-CDN-FINAL.display_status` 记为 **`AWAITING_ACCEPTANCE`**（手工或 registry 更新）。

### 4.2 一键验收（推荐）

```bash
cd /path/to/TravelTrust-V1.1

bash scripts/dev/run-media-cdn-production-acceptance-gate.sh \
  --with-c4 \
  --with-playwright
```

**期望：**

- exit **0**
- `evidence/GO_media_cdn_production_acceptance/<STAMP>/acceptance.json` → `"verdict": "PASS"`
- 控制台：`MEDIA_CDN_PRODUCTION_ACCEPTANCE: PASS`

**仅冒烟（不含上传/浏览器）** — 不足以关闭 Issue：

```bash
bash scripts/dev/run-media-cdn-production-acceptance-gate.sh
# exit 2 = WARN skipped checks — 不得用于 final close
```

### 4.3 手工补充（G9 回滚）

在 sign-off 中勾选其一：

- [ ] **A · 文档验收：** 已审阅 Owner Checklist §8 + `staging-media-tigris-rollback.env.example` + interim closeout  
- [ ] **B · Live drill：** 在维护窗执行 §8 回滚 → 验证 → 恢复 CDN（附 evidence stamp）

---

## 5 · Gate PASS 后关闭 Issue

**仅当** `acceptance.json.verdict == PASS` **且** `--with-c4 --with-playwright` 已跑：

### 5.1 Sign-off

`evidence/manual-uat/signoff/MEDIA-CDN-PRODUCTION-ACCEPTANCE-SIGNOFF-<STAMP>.md`

```markdown
# MEDIA_CDN_PRODUCTION_ACCEPTANCE Sign-off · <STAMP>

- Gate: PASS
- Evidence: evidence/GO_media_cdn_production_acceptance/<STAMP>/
- G1–G9: all required checks passed
- Rollback: [A documented / B live drill]
- Authorizes close: PI3-MEDIA-R2-CDN-FINAL
```

### 5.2 关闭 PI3-MEDIA-R2-CDN-FINAL

```bash
CLOSE_STAMP=<STAMP> bash scripts/dev/close-pi3-media-r2-cdn-staging.sh --with-c4 --with-playwright
```

`closeout.json` 须引用 acceptance：

```json
{
  "issue_id": "PI3-MEDIA-R2-CDN-FINAL",
  "status": "CLOSED",
  "acceptance_gate": "MEDIA_CDN_PRODUCTION_ACCEPTANCE",
  "acceptance_verdict": "PASS",
  "acceptance_evidence": "evidence/GO_media_cdn_production_acceptance/<STAMP>/acceptance.json"
}
```

### 5.3 Registry 更新

1. `registry/open-issues.v1.yaml` — `PI3-MEDIA-R2-CDN-FINAL` → `closed_issues[]`；`MEDIA_CDN_PRODUCTION_ACCEPTANCE` → `closed_issues[]`  
2. `open_count` 减 2（或减 1 若 acceptance 与 issue 合并记账 — 当前为 **2 个 open issue 行**）  
3. `registry/media-three-tier-architecture.v1.yaml` — 两 issue status CLOSED  
4. `registry/executive-dashboard.v1.yaml` — 移除 open summary 中两项  
5. `docs/runbook/TT-OPEN-ISSUES-REGISTRY.md` — Dashboard 同步  

**最终 Dashboard：**

| Issue | 状态 |
|-------|------|
| `PI3-MEDIA-PERSISTENT-STAGING` | ✅ CLOSED |
| `PI3-MEDIA-R2-CDN-FINAL` | ✅ CLOSED |
| `MEDIA_CDN_PRODUCTION_ACCEPTANCE` | ✅ CLOSED |
| `CI-BUILD-20260703-V49-OOM` | 🟡 OPEN (Low) |

---

## 6 · Gate FAIL 处理

| 失败项 | 动作 |
|--------|------|
| G1/G3 | 回到 Owner Checklist §5 Fly secrets |
| G2 | 对象同步 / DB URL 替换 / 等待新上传走 CDN |
| G4/G5 | Playwright 日志 → 前端 build env / CORS |
| G6/G7 | C4 smoke → multipart / CORS / prefix allowlist |
| G8 | Cloudflare Cache Rules §3.3 |
| G9 | 补 rollback 文档或 drill evidence |

**Issue 状态保持：**

- `PI3-MEDIA-R2-CDN-FINAL`：**OPEN**（`AWAITING_ACCEPTANCE` 或 `WAITING_OWNER_CF`）  
- `MEDIA_CDN_PRODUCTION_ACCEPTANCE`：**OPEN**（`FAIL` / `IN_PROGRESS`）

可选：执行 Owner Checklist §8 回滚，Gate 重置为 `PENDING`。

---

## 7 · 机读摘要

```yaml
gate: MEDIA_CDN_PRODUCTION_ACCEPTANCE
display_status: PENDING
blocks_closure_of: PI3-MEDIA-R2-CDN-FINAL
runner: scripts/dev/run-media-cdn-production-acceptance-gate.sh
owner_config: docs/runbook/TT-PI3-MEDIA-R2-CDN-FINAL-OWNER-CHECKLIST.md
required_flags_for_close: [--with-c4, --with-playwright]
checks: [G1, G2, G3, G4, G5, G6, G7, G8, G9]
not_reopen: [market_runtime, OCS, DDG, SOPCP, market_default_filter]
```

---

**文档版本：** 2026-07-03 · Gate `PENDING` until Owner CF config complete
