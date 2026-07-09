# Community Platform · Maintenance SSOT

**Unified answer:** **Community = Production Ready (G1 Domain) · Maintenance**

**Release Train：** **已退出**（与 PCP 同为稳定平台能力）。除非 **新需求 / 架构评审 / 线上事故**，不投入叙事。

---

## 四条证据（G1 Domain · 已归档）

| 轨 | Gap | Evidence |
|----|-----|----------|
| **Architecture** | PCP CLOSED | [PCP-PLATFORM-STATUS.md](PCP-PLATFORM-STATUS.md) |
| **Runtime** | PRM-CONTENT-B001 CLOSED | `community-production-ready/20260704T000527Z/` |
| **Content** | PRM-CONTENT-B001 CLOSED | [COMMUNITY-PRODUCTION-READY-L5-CHECKLIST.md](COMMUNITY-PRODUCTION-READY-L5-CHECKLIST.md) |
| **Media** | PRM-MEDIA-B001 CLOSED | [COMMUNITY-MEDIA-RUNTIME-READINESS-G1.md](COMMUNITY-MEDIA-RUNTIME-READINESS-G1.md) · `community-media-runtime-ready/20260704T001446Z/` |
| **Staging ②** | PRM-CONTENT-B002 CLOSED | [COMMUNITY-G1-STAGING-ALIGNMENT.md](COMMUNITY-G1-STAGING-ALIGNMENT.md) · `community-g1-staging-alignment/20260704T005621Z/` |

**禁止 Reopen** 已 CLOSED Gap — 新问题 **`PRM-CONTENT-B00X` / `PRM-MEDIA-B00X`**。

---

## Community Media Guard（长期守护 · 非 Blocker）

每次提交扫描 **repo**（CI 默认）；本地可选 **PG**：

```bash
# CI / 日常（无 DB）
bash scripts/gates/run-community-media-guard.sh

# 含 DB published + community_media_assets
node scripts/dev/validate-community-media-guard.cjs
```

**禁止（非 allowlist）：** w3schools · samplelib · filesamples · unsplash.com · cdn.example.test · legacy `/uploads/community-posts/` 视频路径

**CI：** [.github/workflows/community-media-guard.yml](../../.github/workflows/community-media-guard.yml)

**机读键：** `TT_COMMUNITY_MEDIA_GUARD: PASS` · `TT_COMMUNITY_PLATFORM: MAINTENANCE`

---

## 当前主线（Release Train）

```text
G1  Browser UAT · Manual Validation
↓
G2  Security · Performance · Monitoring
↓
G3  Stripe · Domain/CDN · DR · Go Live
```

Community / PCP：**不占用** Release Train 精力。
