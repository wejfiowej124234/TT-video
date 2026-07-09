# PES Wave 5 · Decision Package

**生效：** 2026-06-07  
**前置：** Wave 4.1 Validation Sprint  
**状态：** **Wave 5 BLOCKED**（待浏览器真实证据）

---

## 0 · 机读键

```text
PES_WAVE5: BLOCKED
PES_WAVE5_DECISION: NO_GO
PES_WAVE5_EVIDENCE: wave5-decision-package.blocked.json
PES_WAVE5_UNBLOCK_REQUIRES: browser_wave41_validation_json
WAVE5_BLOCKED_UNTIL: pes-wave41-validation.json from Playwright >= 20 runs
```

---

## 1 · 决策摘要

| 项 | 值 |
|----|-----|
| **决策** | **NO_GO**（暂不启动 Wave 5） |
| **原因** | 浏览器 50 轮 RUJR 证据未完成 / 埋点事件待复核 |
| **合成 50 轮** | 3/3 闭合 MET（仅参考，不解锁 Wave 5） |

---

## 2 · 解锁条件（写死）

1. 完成 **smoke 10 轮** · `checkSmokeEventsNonEmpty` 通过
2. 完成 **batch 1–5** · 合并 `journey-runs.jsonl` ≥ **48** 行
3. `PES_WAVE41_MODE=aggregate` 生成真实 `wave41-validation.json`
4. `evaluateWave41MatrixGate` → `qualified: true`
5. 仅此时覆盖 `wave5-decision-package.json`；否则保持 BLOCKED

---

## 3 · Wave 5 候选主题（验证通过后）

| 优先级 | 主题 | 来源 |
|--------|------|------|
| P2 | 全局 PesFunnelQuickLinks | RUJR FR-09 |
| P1 | 治理 Hub 折叠 + 提案快捷区 | RUJR FR-07 |
| P2 | `/trust` 回程 CTA | RUJR FR-10 |

---

## 4 · 相关文档

- [PES-WAVE4-VALIDATION-AUDIT](./PES-WAVE4-VALIDATION-AUDIT.md)
- [PES-WAVE4-CONVERSION-CLOSURE-AUDIT](./PES-WAVE4-CONVERSION-CLOSURE-AUDIT.md)
- [PRODUCT-ENHANCEMENT-SPRINT](./PRODUCT-ENHANCEMENT-SPRINT.md)

---

*Wave 5 BLOCKED · 2026-06-07*
