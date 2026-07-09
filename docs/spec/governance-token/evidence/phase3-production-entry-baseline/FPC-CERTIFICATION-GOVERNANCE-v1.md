# FPC-100 · Certification Governance（长期发布标准）

**Version:** 1.0.0  
**Status:** ACTIVE · 与 FPC-100 v4 registry 同源  
**Machine:** [`registry/full-production-certification-checklist.v1.yaml`](../../../../registry/full-production-certification-checklist.v1.yaml)  
**Risk register:** [`registry/fpc-100-risk-register.v1.yaml`](../../../../registry/fpc-100-risk-register.v1.yaml)

---

## 0. 框架定位

FPC-100 是 **TravelTrust Full Production Certification Framework** — 不仅是一次发布检查，而是 **每个版本（v1.1 · v1.2 · v2.0）可重复执行的长期发布标准**。

与已有 Freeze 的关系：

| Freeze | 范围 |
|--------|------|
| **Local SSOT Freeze** | 代码锚点 `e9df0a73` — Environment Diff 前不改业务代码 |
| **PER Freeze** | Waves LOCK — 无新 P0/P1 不重开 Wave |
| **FPC Certification Freeze** | **Batch PASS 后 Evidence 冻结** — 见 §1 |

---

## 1. Certification Freeze（必须）

```
Batch 执行 → PASS → Evidence 写入 FPC-100-BATCH-{id}-LATEST.json
        ↓
Evidence Freeze（certification_frozen: true · frozen_at_utc）
        ↓
禁止修改该批次证据所覆盖的 SSOT 范围
        ↓
若修改 → 自动失效（invalidation）→ 必须重新认证同一 Batch
```

**规则：**

1. PASS 批次 JSON 写入 `certification_frozen: true` · `frozen_at_utc` · `frozen_git_sha`
2. 覆盖范围内的 **代码/配置/内容** 变更 → 运行 `node scripts/dev/check-fpc-certification-freeze.cjs`（或 Dashboard refresh 内嵌检查）→ 标记 `STALE`
3. Dashboard **不得** 在 STALE 证据上显示 PASS — 显示 `INVALIDATED · RE-CERT REQUIRED`
4. 文档-only commit **不** 自动失效技术批次，除非 Owner 显式 `FPC_FORCE_INVALIDATE=1`

**B00 已 PASS：** 锚点证据已冻结；后续 matrix schema bump 用 **新 batch 记录**，不 silently 改 B00  verdict。

---

## 2. Risk Register（Accepted Risks）

**SSOT：** `registry/fpc-100-risk-register.v1.yaml`

| Risk | 等级 | 状态 | 含义 |
|------|------|------|------|
| VP-09 未做 | LOW | ACCEPTED | 不是 Bug · Owner 接受 · 有过期日 |
| Mobile Tablet | MEDIUM | PENDING | 阻断 Final PASS 直至 ACCEPTED 或完成 B15 |
| CDN 全球节点 | MEDIUM | ACCEPTED | ③ 范围诚实边界 |

Dashboard 展示 **Accepted Risks** 区块 — 任何人可见「哪些不是 Bug 而是 Owner 接受的风险」。

**禁止：** 将 **BLOCKER** 级问题登记为 Risk — 必须 FIX。

---

## 3. Evidence Expiry（重新认证周期）

每个 Batch 证据 **必须** 含：

```json
{
  "certified_at_utc": "...",
  "expires_at_utc": "...",
  "expiry_policy_days": 90
}
```

| 域 | 默认 TTL | 批次示例 |
|----|----------|----------|
| **Performance** | **30** 天 | B16 |
| **Accessibility** | **60** 天 | B14 |
| **Security** | **90** 天 | B17 |
| **Default** | **90** 天 | 其他 |
| **Anchor / Truthfulness** | **30** 天（staging 前复跑） | B00 · B36 |

Dashboard refresh 时：`expires_at_utc < now()` → 行 verdict **EXPIRED · RE-CERT REQUIRED**

---

## 4. Release Blockers（BLOCKER vs WARN）

每个 Batch JSON 增加：

| 字段 | 含义 |
|------|------|
| `release_blocker` | **YES** / **NO** |
| `verdict` | PASS · PASS_WITH_WARN · **FAIL** · EXPIRED · INVALIDATED |

**示例：**

| 批次 | 发现 | release_blocker | verdict |
|------|------|-----------------|---------|
| B36 Truthfulness | Mock 数据上屏 | **YES** | FAIL |
| B13 SEO | 一个 Title 微调 | NO | PASS_WITH_WARN |

**Final PASS 条件：** 所有 P0 批次 `release_blocker: NO` 且 verdict ∈ {PASS, PASS_WITH_WARN}

---

## 5. Evidence Coverage（100% 可见）

Dashboard **Evidence Coverage** 区块（done / target）：

| 维度 | Target SSOT |
|------|-------------|
| **Pages** | 202 · page matrix |
| **API contracts** | 181 · 04 §3.4 消费集 |
| **Business corridors** | 23 · 93 + BFM |
| **RBAC probes** | 102 · admin-rbac-route-matrix + 扩展探针 |

未达 100% → Technical pillar **不能** PASS。

---

## 6. Human Certification（真人认证）

每个 Batch 除 Agent/脚本外 **必须** 记录：

```json
{
  "human_verified": true,
  "human_verifier": "Sebastian Ward",
  "human_verified_at_utc": "..."
}
```

**规则：**

- L2 · L2.5 · L3 · L5-Operations · L5-Recovery · Deployment · Business Readiness：**human_verified 必填** 方可 Final PASS
- 纯机读 Gate（如 `cargo test`）可 `human_verified: false` 但须在 batch notes 标注「machine-only」

Dashboard pillar **Human Verification** = 所有必填批次 human_verified === true

---

## 7. Deployment Certification（独立于 Local FPC）

Local FPC PASS **≠** Deployment PASS。

**批次 B40 · Deployment Certification（② only · one-shot 后）：**

```
Deploy → Health → Meta (SHA) → Environment Diff → Rollback drill → PASS
```

| 检查 | 要求 |
|------|------|
| Health | 200 |
| Meta | SHA = code anchor |
| Diff | Local == Staging |
| Rollback | 文档化 + 探针 |

Dashboard pillar **Deployment** 仅在 B40 PASS 且未 EXPIRED 时为 PASS。

---

## 8. Business Readiness（产品/商务就绪 · B41）

非纯技术 — **产品能否对外发布：**

| 项 | 检查 |
|----|------|
| Logo / 品牌 | 生产资产 |
| ICP（如适用） | 备案/展示 |
| Privacy · Terms | 法务页 Live |
| 联系方式 · 运营邮箱 | 可达 |
| 邮件模板 | 生产模板非 placeholder |
| CDN · 域名 | 解析/TLS |
| Sitemap · Robots | 可抓取 |
| Analytics | 配置（非 dev ID 泄漏） |

Dashboard pillar **Business** = B41 PASS + human_verified

---

## 9. Release Dashboard · 多柱结构

```
TravelTrust Release Dashboard
────────────────────────────
Technical          PASS | NOT_STARTED | FAIL
Product            …
Operations         …
Content            …
Business           …
Security           …
Performance        …
Truthfulness       …
Deployment         …
Human Verification …
────────────────────────────
Accepted Risks     (from risk register)
Evidence Coverage  Pages · API · Corridors · RBAC
Expired Batches    (re-cert list)
────────────────────────────
TT_FULL_PRODUCTION_CERTIFICATION   PASS | NOT_STARTED | FAIL
```

**刷新：** `node scripts/dev/refresh-fpc-100-release-dashboard.cjs`

---

## 10. 版本复用（v1.1 · v1.2 · v2.0）

每个版本发布：

1. 新 code anchor commit  
2. 失效/过期批次 re-cert  
3. 新 `FPC-100-RELEASE-DASHBOARD-LATEST.json`  
4. Risk register 复审过期项  

**PER Round 1** 历史 closeout **只读** — 不删除；新轮 FPC 追加证据，不覆盖旧 PASS 文件（用新 stamp 文件或 `-LATEST` 滚动 + freeze 指针）。
