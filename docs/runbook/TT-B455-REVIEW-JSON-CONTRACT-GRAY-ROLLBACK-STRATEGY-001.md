# TT-B455-REVIEW-JSON-CONTRACT-GRAY-ROLLBACK-STRATEGY-001 · **`review_json_contract`** **灰度发布与自动回滚（** **B-453/B-454** **指标** **）**

**母表**：[B-455](../任务母表.md)

**前置**：**[TT-B454](./TT-B454-REVIEW-JSON-CONTRACT-DEGRADE-EVIDENCE-REPLAY-001.md)**（**B-454**）**`replay_summary.json`** **；** **[04 §3.4 · B-453](../spec/04-后端与API.md)** **`review_json_contract_degrade`** **实时** **观测** **。**

**本卡** **将** **B-454** **证据** **与** **机读** **阈值** **（** **`config/b455_review_json_contract_rollout_thresholds.json`** **）** **闭合** **为** **可** **自动化** **裁决** **的** **发布** **控制** **环** **：** **`eval-b455-*`** **输出** **`GREEN`/`YELLOW`/`RED`** **（** **exit** **0/1/2** **）** **，** **供** **CI** **/** **发布** **控制器** **/** **Feature** **Flag** **编排** **消费** **。**

---

## §1 · 验收（封口条件）

### §1.1 机读裁决（fixtures）

```bash
python scripts/gates/eval-b455-review-json-contract-rollout-decision.py \
  evidence/b455_review_json_contract_rollout/fixtures/replay_summary.green.json

python scripts/gates/eval-b455-review-json-contract-rollout-decision.py \
  evidence/b455_review_json_contract_rollout/fixtures/replay_summary.red.json
```

- **预期** **：** **绿** **fixture** **exit** **0** **；** **红** **fixture** **exit** **2** **（** **阈值** **以** **`config/b455_review_json_contract_rollout_thresholds.json`** **为准** **）** **。**

### §1.2 门禁

```bash
python scripts/gates/check-b455-review-json-contract-rollout-gate.py
bash scripts/run-check-04-routes.sh
```

---

## §2 · 机读真源与输入

| 工件 | 角色 |
|------|------|
| **`config/b455_review_json_contract_rollout_thresholds.json`** | **阈值** **SSOT** **（** **`limits.*.{yellow_abs,red_abs}`** **、** **`min_total_events_eval_rate`** **、** **`gray_release.*`** **）** **；** **调参** **须** **同批** **更新** **本** **Runbook** **§3** **人读** **表** **或** **脚注** **。** |
| **B-454** **`replay_summary.json`** | **`eval-b455-*`** **唯一** **统计** **输入** **（** **由** **`replay-b454-*`** **自** **NDJSON** **生成** **）** **。** |
| **`eval-b455-review-json-contract-rollout-decision.py`** | **合并** **阈值** **+** **summary** **→** **stdout** **JSON** **+** **进程** **exit** **码** **。** |

**裁决** **顺序** **（** **实现** **与** **`eval-b455-*`** **一致** **）** **：** **①** **任一** **`degrade`** **计数** **≥** **`red_abs`** **→** **`RED`** **；** **②** **`total_events==0`** **→** **`GREEN`** **；** **③** **`total_events`** **&lt;** **`min_total_events_eval_rate`** **且** **&gt;0** **→** **`insufficient_sample_verdict`** **（** **默认** **`YELLOW`** **）** **；** **④** **任一** **≥** **`yellow_abs`** **→** **`YELLOW`** **；** **⑤** **否则** **`GREEN`** **。**

---

## §3 · 灰度发布与自动回滚（人读）

### §3.1 灰度阶梯（与配置 `gray_release.traffic_percent_steps` 对齐）

| 阶梯 | 建议流量占比 | 准入条件 |
|------|----------------|----------|
| **S0** | **0%** **（** **仅** **内测** **租户** **/** **标签** **）** | **B-451～B-454** **门禁** **绿** **；** **预发** **`replay_summary`** **无** **`RED`** **历史** **。 |
| **S1～Sn** | **`traffic_percent_steps`** **逐项** | **每一** **阶梯** **结束** **后** **导出** **T+0** **窗口** **NDJSON** **→** **`replay-b454-*`** **→** **`eval-b455-*`** **；** **仅** **`GREEN`** **可** **升** **下一** **阶梯** **；** **`YELLOW`** **保持** **本** **阶梯** **并** **排障** **；** **阶梯** **间隔** **≥** **`min_wall_clock_minutes_between_steps`** **。** |

### §3.2 自动回滚策略（与 `gray_release.on_verdict` 对齐）

| **`eval-b455`** **裁决** | **建议** **动作** **（** **实现** **绑定** **Feature** **Flag** **/** **CDN** **回切** **/** **部署** **回滚** **）** |
|--------------------------|------------------------------------------------------------------|
| **`GREEN`** | **按** **`advance_or_hold_top`** **：** **可** **升** **下一** **灰度** **或** **维持** **100%** **（** **已** **全量** **）** **。** |
| **`YELLOW`** | **按** **`hold_and_triage`** **：** **冻结** **放量** **、** **保留** **当前** **比例** **，** **执行** **B-454** **§2** **排障** **清单** **。** |
| **`RED`** | **按** **`auto_rollback_frontend_or_flag`** **：** **立即** **关闭** **相关** **前端** **实验** **/** **回滚** **至** **上一** **已知** **良好** **构建** **，** **并** **保留** **证据** **包** **（** **`run_<UTC>/`** **）** **。** |

**说明** **：** **仓库** **内** **不** **强制** **具体** **编排** **引擎** **（** **Argo** **/** **GitHub** **Actions** **/** **内部** **控制器** **）** **；** **仅** **规定** **输入** **（** **`replay_summary.json`** **）** **、** **阈值** **文件** **与** **exit** **码** **契约** **。**

---

## §4 · 非目标

- **不** **替代** **业务** **SLO** **告警** **体系** **：** **本** **链** **路** **仅** **覆盖** **`meta.review_json_contract`** **客户端** **降级** **信号** **。**
- **不** **在** **本** **卡** **内** **实现** **云端** **回滚** **执行器** **（** **仅** **Runbook** **+** **机读** **契约** **）** **。**

---

**文档版本**：1.0 · 2026-04-17
