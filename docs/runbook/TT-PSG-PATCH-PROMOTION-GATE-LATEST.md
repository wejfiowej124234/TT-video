# TT · PSG · Patch Promotion Gate（LATEST）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> tip `652bbab5` / RUNNING / wait-window wording below = **SUPERSEDED_SNAPSHOT** · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`.


**阶段：** Track B 临时队列 → 下一 Release / Certification · **≠** ③ Production GO  
**Machine：** `TT_PATCH_PROMOTION_GATE: ENFORCED` · `TT_STAGING_PATCH_QUEUE: ACTIVE_TEMPORARY`  
**Registry：** [`registry/patch-promotion-gate.v1.yaml`](../../registry/patch-promotion-gate.v1.yaml)  
**Ledger：** [TT-STAGING-PATCH-LEDGER-LATEST](./TT-STAGING-PATCH-LEDGER-LATEST.md)  
**双轨：** [TT-PSG-DUAL-TRACK-RELEASE-STAGING-PATCH-LATEST](./TT-PSG-DUAL-TRACK-RELEASE-STAGING-PATCH-LATEST.md)

---

## 0 · 写死：Track B 禁止永久分叉

| | Track A | Track B |
|--|---------|---------|
| 定位 | Candidate v2 / FG-15-B 认证观察 | **临时**变更队列 |
| 当前 tip | `PSG-REL-20260720-WEB3-CAND-V2` · `97289a71…`（supersedes `652bbab5`） | `PATCH-STG-*` Ledger |
| 可替代 Cert？ | — | **否** |
| FG-15-A | ARCHIVED (`09c72b93`) · NOT FOR PROMOTION | — |

**禁止结果：** Patch 很多 → Staging 很新 → Production Certification 仍旧 → **又一种漂移**。

**合并流水（唯一合法出口）：**

```text
STAGING_PATCH
      ↓
验证通过
      ↓
更新 PSG（Registry · Runbook · AGENTS/Cockpit · Evidence）
      ↓
更新 Release Candidate
      ↓
重新生成 Release Identity
      ↓
进入下一次 Certification
```

---

## 1 · 每条 PATCH-STG 必须记录

| 字段 | 含义 |
|------|------|
| `PATCH_ID` | `PATCH-STG-NNN` |
| 影响范围 | Web / API / Data / Docs / Gate / … |
| 代码 SHA | 已提交 SHA · 或 `WORKTREE`（须注明） |
| 是否影响 PSG | Yes/No（活层是否须同批更新） |
| 是否影响 FG/Web3 | Yes/No |
| 验证结果 | PASS / PENDING / FAIL / N/A |
| 是否合并 Release | Yes / No / DEFERRED_TO_NEXT_RC |
| `promotion_class` | 见下表 |
| `promotion_status` | `OPEN` · `PLAN_RECORDED` · `PROMOTED` · `SUPERSEDED` · `BLOCKED_FG15` |

---

## 2 · 晋升分类

| 类型 | 处理 |
|------|------|
| CMS / 展示 | 可快速合并（验证后） |
| Bug fix | 重新测试 → RC |
| API 行为变化 | Release Candidate |
| 金融逻辑 | 重新 FG-Web3 |
| 合约 / 权限 | **新认证周期** |

---

## 3 · FG-15-B 窗内正确动作（写死）

| 继续 | 不要 |
|------|------|
| FG-15-B maintain（`…_candidate_v2/`） | redeploy（冒充 Cert） |
| 维护 Track A Candidate Observation Evidence | merge patch **进冻结 tip** |
| 在 Ledger 记登记/验证 · `BLOCKED_FG15` | 改 Candidate tip · cite `09c72b93` as ACTIVE · Promotion **execute** |
| `python …/run-patch-promotion-gate.py --mode check\|plan` | `STAGING_PATCH` / `EXPERIMENT` 部署（绕过 PSG） |

`execute` 与补丁进 Staging/Production **仅当**：`FG15_ELAPSED=1`，且走完  
Promotion Gate → PSG 更新 → Release Identity 重建 → 下一 Certification。

---

## 4 · 命令

```bash
# 安全（窗内默认）
python scripts/dev/run-patch-promotion-gate.py --mode check
python scripts/dev/run-patch-promotion-gate.py --mode plan

# 满窗后 · Owner 另授权（禁止跳过 PSG）
# FG15_ELAPSED=1 TRAVELTRUST_PATCH_PROMOTE_EXECUTE_OK=1 \
#   python scripts/dev/run-patch-promotion-gate.py --mode execute
```

诚实边界：Promotion Gate PASS（check/plan）≠ 已合并 Release ≠ Production GO ≠ 已进 Staging。
