# FPC-100 · Certification Governance（长期发布标准）

**Version:** 1.2.0  
**Status:** **FROZEN @ FPC v5** · 见 [`FPC-GOVERNANCE-FREEZE-v5.md`](FPC-GOVERNANCE-FREEZE-v5.md)  
**Governance unlock:** P0 governance defect · Version Upgrade (v6+) only
**Machine:** [`registry/full-production-certification-checklist.v1.yaml`](../../../../registry/full-production-certification-checklist.v1.yaml)  
**Risk register:** [`registry/fpc-100-risk-register.v1.yaml`](../../../../registry/fpc-100-risk-register.v1.yaml)

---

## 0. 框架定位

**Governance FREEZE（v5）：** 框架已冻结 — **Execution 线**（B00–B41）为唯一日常推进。  
**禁止 Framework Inflation** — 见 [`FPC-GOVERNANCE-FREEZE-v5.md`](FPC-GOVERNANCE-FREEZE-v5.md)

FPC-100 是 **TravelTrust Full Production Certification Framework** — 不仅是一次发布检查，而是 **每个版本（v1.1 · v1.2 · v2.0）可重复执行的长期发布标准**。

### 0.1 FPC 最高原则（写死 · 框架灵魂）

> **Certification never ends at finding problems.**  
> **Certification ends only when:** problems are resolved · evidence is regenerated · re-certification passes · and the release decision can be justified.

**中文：** 认证不是发现问题就结束，而是只有在 **问题修复 · 证据更新 · 重新认证通过 · 并能够支撑发布决策** 时，认证才算真正完成。

**禁止：** 把「跑完 Gate / 列出 Findings」当作 Batch PASS 或 CLOSED。

#### Batch 完整生命周期

```
Business Certification
        │
        ▼
Quality Certification（B12 起一并 · B00–B10 后补 Supplement）
        │
        ▼
Findings
        │
        ▼
Severity（P0 / P1 / P2 / P3）
        │
        ▼
Remediation
        │
        ▼
Change Impact
        │
        ▼
Re-certification（增量 · 非无脑全量重跑）
        │
        ▼
Evidence Refresh
        │
        ▼
Dashboard Refresh
        │
        ▼
DoD（Gate · Evidence · Dashboard · Commit · Clean tree）
        │
        ▼
Batch CLOSED
```

**每 Batch 执行纪律（B12 起写死 · 标杆可复制）：**

- **禁止** 在本 Batch 内留下「已知 P0/P1 以后再修」（**Accepted Risk** 仅限 **P2** · 须登记 risk register）
- 发现 → 分级 → **当前 Batch 内** Remediation → Re-certification → Evidence Refresh → DoD → **CLOSED** 后进入下一批
- **B12** = Quality Domain Matrix 正式启用后 **第一个标杆 Batch**（Business + Quality + Overall 全链路）

互指：[`FPC-100-QUALITY-DOMAIN-MATRIX-v1.md`](FPC-100-QUALITY-DOMAIN-MATRIX-v1.md) §0.1–0.3 · [`FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md`](FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md)

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
2. 覆盖范围内的 **代码/配置/内容** 变更 → 运行 `node scripts/dev/check-fpc-change-impact.cjs`（精准映射失效）+ `check-fpc-certification-freeze.cjs`（expiry）→ 标记 `INVALIDATED`
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

---

## 11. Version Certification（版本认证历史）

每个 **product_version**（v1.0 · v1.1 · v2.0）独立跑 FPC，并写入 **Release History**：

```
v1.0 → FPC batches → PASS → TT_RELEASE_DECISION
v1.1 → delta/full FPC → PASS → GO
```

| SSOT | 路径 |
|------|------|
| Version registry | `registry/fpc-100-version-registry.v1.yaml` |
| Evidence JSON | `FPC-100/FPC-100-VERSION-CERTIFICATION-LATEST.json` |
| Dashboard 区块 | **Release History** — Version · Result · Release Decision |

**规则：** 关闭版本时更新 registry `release_history` 行 + 刷新 Dashboard；**禁止** 用新版本 PASS 覆盖旧版本历史行。

---

## 12. Change Impact（精准失效）

代码变更 **不再** 全系统失效 — 按路径映射只 invalidate 相关 Batch：

| SSOT | 路径 |
|------|------|
| Impact map | `registry/fpc-100-change-impact-map.v1.json` |
| Script | `scripts/dev/check-fpc-change-impact.cjs` |
| Report | `FPC-100/FPC-100-CHANGE-IMPACT-LATEST.json` |

**示例：** `frontend/app/market` 变更 → 仅 B04 · B25-C2 · B26 · B31 失效。

`check-fpc-certification-freeze.cjs` 负责 **expiry**；path invalidation 委托 change-impact 脚本。

---

## 13. Release Traceability（发布追溯链）

每个 Batch JSON 含 `traceability` 对象，链接完整链：

```
Requirement → Spec → Code → Test → Evidence → Certification → Release
```

必填字段：`requirements[]` · `spec_refs[]` · `code_paths[]` · `tests[]` · `evidence_path` · `certification_batch` · `product_version`

Dashboard 与 Version Certification JSON 暴露 `traceability_chain` 供审计。

---

## 14. AI Review · Release Health · Release Decision

### AI Review

除 Human 外，每个 Batch 记录：

```json
{
  "ai_review": {
    "verdict": "PASS",
    "ai_reviewer": "Internal AI Review",
    "review_type": "Internal AI Review",
    "review_date": "2026-07-09",
    "review_version": "v1"
  }
}
```

**禁止** 在 evidence 中写入具体模型 slug（如 composer-*）— 用 `review_version` 表示审查协议版本。

Dashboard **AI Review · Human Verification** 表区分机读/真人。

### Release Health（一屏总览）

| 指标 | 含义 |
|------|------|
| Certified % | PASS 批次数 / 跟踪批次数 |
| Expired | 过期需 re-cert 数 |
| Blocked | `release_blocker: YES` |
| Accepted Risks | Risk register ACCEPTED |
| Coverage % | Pages · API · Corridors · RBAC 均值 |
| Human Verified % | human_verified 批次占比 |
| AI Review PASS % | ai_review.verdict === PASS |

### Release Decision（企业最终闸）

**Machine key:** `TT_RELEASE_DECISION`

| 值 | 条件 |
|----|------|
| **GO** | 全柱 PASS · Coverage 100% · 无 PENDING risk · 无 blocker |
| **CONDITIONAL_GO** | 仅 ACCEPTED risks · Owner 书面签收 |
| **NO_GO** | FAIL · blocker · PENDING risk · EXPIRED |
| **NOT_STARTED** | FPC 进行中 |

**FPC verdict（PASS）≠ Release Decision（GO）** — Dashboard **Executive Summary** 第一眼展示 **Release Readiness** 与 Release Decision。

---

## 15. No Batch Skip · Burn-down · Release Readiness（最终执行纪律）

### No Batch Skip

批次 **必须** 按 `execution_sequence` 线性执行 — 禁止跳批。

```
B00 → B01 → B02 → … → B41
```

**检查：** `node scripts/dev/check-fpc-no-batch-skip.cjs` · Batch runner 内嵌 `assertCanRun`

### Burn-down（Dashboard）

| 字段 | 含义 |
|------|------|
| Completed | 连续 PASS 前缀 / total |
| Remaining | total − contiguous |
| Next Batch | 下一个必须执行的 id |

### Release Readiness（Owner 每日唯一数字）

**Machine key:** `TT_RELEASE_READINESS`

公式：从 B00 起 **连续 PASS** 批次数 / 41 × 100%

**不是** Pages/API evidence coverage — 那是深度认证进度；Release Readiness 是 **离 GO 还有多远**。

### 每日 rhythm

1. 执行 **一个** Batch（gates）→ evidence 可先 `IN_PROGRESS`  
2. `refresh-fpc-100-release-dashboard.cjs`  
3. Commit  
4. `node scripts/dev/finalize-fpc-batch-dod.cjs --batch Bxx --refresh-dashboard`  
5. 仅当 DoD 五项全满足 → **PASS**；否则 **IN_PROGRESS**

**Owner 每日只看两数：** `TT_RELEASE_READINESS` · `TT_RELEASE_DECISION`

### Batch Definition of Done

| # | 条件 | 不满足则 |
|---|------|----------|
| 1 | Gate PASS | FAIL / IN_PROGRESS |
| 2 | Evidence 完整 | IN_PROGRESS |
| 3 | Dashboard 已刷新 | IN_PROGRESS |
| 4 | Commit 完成（HEAD = frozen_sha） | IN_PROGRESS |
| 5 | Working tree clean | IN_PROGRESS |

### 核心原则

**Feature Freeze does not mean Release Ready.**  
Release Ready is earned only through completed certification evidence.

**中文：** 功能冻结不代表可以发布；发布资格只能通过完整的认证证据获得。

**第三阶段（当前）：** 认证产品 — 每日目标 = 提高 `TT_RELEASE_READINESS`，不是写代码或扩框架。 **禁止再扩展 FPC v5** — 唯一目标 B02→B41。
