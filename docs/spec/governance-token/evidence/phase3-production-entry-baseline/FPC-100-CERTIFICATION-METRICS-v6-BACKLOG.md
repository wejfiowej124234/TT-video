# FPC-100 · Certification Metrics · Batch Health · Timeline — v6 Backlog

**Status:** **DEFERRED · v6 only**  
**Governance:** **FPC v5 FROZEN** — **不** 改 Dashboard Schema · Batch 顺序 · DoD 定义  
**v5 纪律：** **只执行** B13→B41 · 202 页卡 · Quality Domain 验证

---

## 为何 defer 到 v6

Framework Freeze 已生效。下列能力属于 **Certification Metrics（旁证读数）**，不是新治理框架：

- 不改变 Batch PASS/FAIL 判据  
- 不改变 `TT_RELEASE_READINESS` 公式  
- 不改变 No Batch Skip  

**v5：** 记录需求 · **v6：** 实现机读汇总与 Review UI 旁证

---

## 1. Certification Metrics（全局 · Owner 效率视图）

**不是 Dashboard 替换** — 是认证过程 **效率与风险收敛** 指标：

| 指标 | 示例 | 用途 |
|------|------|------|
| Findings · P0 / P1 / P2 | 0 / 0 / 12 | 阻断 vs 可接受 |
| Accepted Risk | 5 | P2 书面接受 |
| Quality Coverage | 83% | 质量域检查执行率 |
| Business Coverage | 100% | 业务认证执行率 |
| Runtime Events | 2 | 环境事件（≠ Bug） |
| Infrastructure Events | 1 | CI/网络（通常 non-blocking） |
| Re-certifications | 6 | 闭环次数 |
| Average Fix Time | 2.3h | Remediation 效率 |

**Machine key（v6 提案）：** `TT_CERTIFICATION_METRICS` — 聚合自各 Batch evidence · risk register · runtime event log

---

## 2. Batch Health（每批 · Review 一眼）

**示例 B13：**

```
Business:              PASS
Quality:               PASS
Runtime Events:        1
Infrastructure Events: 0
Findings:              P0 0 · P1 0 · P2 3
Re-certifications:     2
Overall:               PASS
```

**数据源（v6）：** 扩展 `FPC-100-BATCH-{id}-LATEST.json` 旁证字段 · **不** 改 v5 必填 schema

---

## 3. Certification Timeline（每批 · 审计回溯）

**示例：**

```
B13 Start → Business PASS → Quality PASS → P1 Found → Fixed → Re-certify → PASS → Closed
```

**字段（v6 提案）：** `certification_timeline[]` · `{ at_utc, event, verdict? }`

---

## v5 当前执行（写死）

```
B13 → … → B41（Business + Quality + Fix + Re-cert + Evidence + DoD + Close）
→ B00–B10 Quality Supplement
→ 202 页卡填满 · 17 质量域验证
→ ② Staging → Environment Diff → PER
```

**互指：** [`FPC-CERTIFICATION-GOVERNANCE-v1.md`](FPC-CERTIFICATION-GOVERNANCE-v1.md) · [`FPC-100-QUALITY-DOMAIN-MATRIX-v1.md`](FPC-100-QUALITY-DOMAIN-MATRIX-v1.md)

**Version:** 1.0.0 · **2026-07-10** · Maintainer: defer until **FPC v6** unlock
