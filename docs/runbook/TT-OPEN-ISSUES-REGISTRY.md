# TT-OPEN-ISSUES-REGISTRY · 问题总账（统一 Issue Registry）

**机读 SSOT：** [`registry/open-issues.v1.yaml`](../../registry/open-issues.v1.yaml)  
**Dashboard 引用：** [`registry/executive-dashboard.v1.yaml`](../../registry/executive-dashboard.v1.yaml) → `open_issues`  
**原则：** 一个问题 ID · 一条总账 · 模块 Registry 只放细节

```text
TT_OPEN_ISSUES_REGISTRY: ENFORCED
```

---

## 字段（每条 Issue 必填）

| 字段 | 说明 |
|------|------|
| **id** | 全局唯一，如 `CI-BUILD-20260703-V49-OOM` |
| **category** | Build Infrastructure · Frontend Runtime · Security · PI3 Owner Live … |
| **severity** | LOW · MEDIUM · HIGH · CRITICAL |
| **owner** | 负责团队/角色 |
| **status** | OPEN · IN_PROGRESS · CLOSED · WONTFIX |
| **blocking** | 是否阻挡 `target_gate` / Release Decision |
| **target_gate** | 归属门禁或轨道 |
| **evidence** | 证据路径 |
| **closed_utc** | 关闭时间；OPEN 时为 `null` |
| **opened_utc** | 登记时间 |
| **summary** | 一句话摘要 |

可选：`module_registry` · `runbook`（模块深度文档）

---

## 与模块 Registry 的关系

```text
open-issues.v1.yaml          ← 总账（Dashboard / 发布决策一眼）
        │
        ├── registry/ci-build-stability.v1.yaml   ← Build 细节
        ├── registry/phase3-production-infrastructure.v1.yaml
        └── …
```

**禁止** 只在模块 Registry 登记、总账缺失。  
**允许** 模块 Registry 保留 mitigation/env 等细节，但必须 `id` 与总账一致。

---

## 当前开放项（2026-07-03）

| id | Category | Severity | Blocking | Target Gate |
|----|----------|----------|----------|-------------|
| `CI-BUILD-20260703-V49-OOM` | Build Infrastructure | **LOW** | **false** | `CI_BUILD_STABILITY` |

Evidence：`evidence/GO_ci_build_stability/20260703T113000Z/`  
Runbook：[`TT-CI-BUILD-STABILITY.md`](TT-CI-BUILD-STABILITY.md)

---

## 程序阶段（与 Dashboard 对齐）

**Phase ② — CLOSED**

- Product · Operations · Governance · Alignment

**Phase ③ — Production Engineering（当前主线）**

```text
Production Infrastructure
        ↓
Security
        ↓
Observability
        ↓
Performance
        ↓
Production Validation
        ↓
Production GO
```

后续工作重点：**生产可靠性 · 运维 · 安全 · 发布** — 非新功能扩张。

---

## 登记 / 关闭流程

1. 在 `registry/open-issues.v1.yaml` → `issues[]` 追加完整一行  
2. 写入 `evidence/GO_<category>/`  
3. 若有模块细节，更新对应 `registry/*.v1.yaml` 并引用同一 `id`  
4. 更新 `executive-dashboard.v1.yaml` → `open_issues.rollup`  
5. 关闭时：`status: CLOSED` · `closed_utc` · 更新 `rollup` · 可选移入 `closed_issues[]`
