# PES Wave 4.1 · Validation Audit

**生效：** 2026-06-07  
**状态：** 分批浏览器验证 · **Wave 5 BLOCKED**  
**机读 ID：** `pes-wave4-1-validation-20260607`

---

## 0 · 机读键

```text
PES_WAVE4_1: ACTIVE
PES_FEATURE_DEVELOPMENT: PAUSED
PES_WAVE5: BLOCKED
PES_WAVE5_DECISION: NO_GO
```

---

## 1 · 分批流程（稳定完成）

| 阶段 | 命令 | 产出 |
|------|------|------|
| **① Smoke** | `PES_WAVE41_MODE=smoke PES_WAVE41_RUNS=10` | `journey-runs-smoke.jsonl` · 埋点非空门禁 |
| **② Batch 1–5** | `PES_WAVE41_MODE=batch PES_WAVE41_BATCH=N PES_WAVE41_RUNS=10` | `journey-runs-batch-0N.jsonl` |
| **③ Aggregate** | `PES_WAVE41_MODE=aggregate --grep aggregate` | 合并 `journey-runs.jsonl` |

**一键脚本：**

```bash
bash scripts/dev/run-pes-wave41-batches.sh
```

---

## 2 · Wave 5 更新门禁

仅当 **同时满足** 时写入 `wave5-decision-package.json`：

1. 真实 `wave41-validation.json` 已生成（≥48 轮浏览器数据）
2. `totalEvents > 0`
3. 三条路径 **均** `improvedVsBaseline`
4. `closuresMet ≥ 2`

未达标 → 仅写 `wave5-decision-package.blocked.json`，**`PES_WAVE5` 保持 BLOCKED**。

---

## 2b · Smoke 门禁（2026-06-07）

| 指标 | 结果 |
|------|------|
| 轮次 | 10/10 |
| 有埋点轮次 | 10/10（100%） |
| 总 events | 172 |
| 门禁 | **PASS** → 可进入 batch 1–5 |

---

## 3 · Actual Funnel Matrix

*待 aggregate 完成后由浏览器 `wave41-validation.json` 填充 · `wave41-validation-synth.json` 不解锁 Wave 5*

| 转化段 | RUJR Before | Wave 4 目标 | Actual | 状态 |
|--------|-------------|-------------|--------|------|
| visit → register | 18.8% | 10.0% | _pending_ | — |
| identity → post | 59.4% | 35.0% | _pending_ | — |
| find_guide → order | 90.9% | 70.0% | _pending_ | — |

---

## 4 · 证据目录

`frontend/evidence/pes-wave41-validation-20260607/`

| 文件 | 说明 |
|------|------|
| `journey-runs-smoke.jsonl` | 10 轮 smoke |
| `journey-runs-batch-01..05.jsonl` | 各 10 轮 |
| `journey-runs.jsonl` | 合并 50 轮 |
| `wave41-validation.json` | Actual Funnel Matrix |
| `wave5-decision-package.json` | 仅达标时更新 |
| `wave5-decision-package.blocked.json` | 未达标快照 |

---

*PES Wave 4.1 · Batched Validation · 2026-06-07*
