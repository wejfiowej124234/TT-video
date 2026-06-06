# Admin 首页 · 系统概况 · 代码真源（2026-06-05 · ①）

**阶段口径：** **① 本地** → **② 测试网** → **③ 生产**

| 项 | 结论 |
|----|------|
| **有没有收口** | **是（①）** — 代码 + 机读 + 与 [`frontend/app/admin/README.md`](../../app/admin/README.md) 对拍 |
| **有没有 UI 冻结** | **否** — Admin 非五主 |

**诚实边界：** ① memory/PG 诚实标注 **≠** ② 全库 KPI SLA **≠** ③ 生产 DAU/审计趋势。

---

## 组件树

```
AdminHomeClient
└─ AdminHomeSystemOverviewSection          # AdminHomeCollapsibleSection 折叠壳
   └─ AdminHomeSystemOverview              # 诚实 footnote + 四磁贴 + 角色 + 链接
      ├─ AdminHomeSystemOverviewTrends     # 7 日柱图（聚焦待办时隐藏）
      ├─ AdminHomeDomainHealthStrip        # 非聚焦嵌入
      └─ AdminHomeRecentVisits             # 非聚焦嵌入
```

**数据 hook：** `useAdminHomeSystemOverview` → metrics / users fallback / observability 并行拉取。

---

## 数据链

| 字段 | 真源 | 诚实规则 |
|------|------|----------|
| 用户总数 | `metrics.usersTotal`（PG）或 users 样本 `sampleCount` | 标签随 `source` 切换 |
| 7 日新增 | `metrics.trends.userSignups` 或样本 `new7d` | PG 时 copy「全库」 |
| 四通道待办 | `useAdminHomeInbox` 聚合 | 列表 API 上限内；聚焦时不暖色强调 |
| 链 · 滞后 | `GET …/observability/overview` | `31337`/`1337` → 本地链人话 |
| 控制台角色 | `metrics.by_console_role` 优先 | top-4 + remainder；标题不含「（70）」 |
| 7 日趋势 | `metrics.trends` | memory 时 admin activity 可能 unavailable |

**API：** [`admin_metrics_home_http.rs`](../../../crates/api/src/routes/admin/admin_metrics_home_http.rs) · [`home_metrics.rs`](../../../crates/api/src/db/admin/home_metrics.rs)

**解析：** [`adminHomeSystemOverviewMetrics.ts`](../../lib/admin/adminHomeSystemOverviewMetrics.ts)

---

## 折叠与聚焦

| 场景 | `defaultOpen` | `persistOpen` | `frame` | 趋势 |
|------|---------------|---------------|---------|------|
| 无待办 | `true` | `true` | `warm` | 显示 |
| 有待办、非聚焦 | `false` | `true` | `warm` | 显示 |
| 聚焦待办 | `false` | `false` | `compact` | 隐藏 |

策略函数：`adminHomeSystemOverviewDefaultOpen(pendingTotal)` · [`adminShellUxPolicy.ts`](../../lib/admin/adminShellUxPolicy.ts)

---

## 缓存

| 键 | TTL | 失效 |
|----|-----|------|
| `admin-home-overview-v1` | 90s | `traveltrust:auth-change` · `invalidateAdminHomeOverviewCache` |

与列表 SWR 同属 **① 会话内内存**；**非**跨设备 SSOT。

---

## 机读验收

```bash
node scripts/dev/run-admin-l5-green.mjs   # 含 adminHomeL5 · metrics · overview cache
```

---

## 互指

| 文档 | 用途 |
|------|------|
| [`70 §3.0.2`](../../../docs/spec/70-管理员系统开发文档.md) | spec 契约表 |
| [`ADMIN-L5-PHASE-GAP-TASK-LIST.md`](ADMIN-L5-PHASE-GAP-TASK-LIST.md) | P1-ADM-SOV-01～05 |
| [`ADMIN-L5-HOME-SCREENSHOT-AUDIT-20260604.md`](ADMIN-L5-HOME-SCREENSHOT-AUDIT-20260604.md) | 视觉续扫（§F 数据诚实） |
