# R-003 → R-002 §4 机读回填（待首轮 staging 实跑）

在**真实 staging**上执行 `python scripts/dev/run_r003_staging_evidence_chain.py --from-env`（**勿**启用 **`R003_LOCAL_CHAIN`**）后，`r003_staging_full_regression.py` 将**覆盖**本文件；正文与 **`report.json`** 的 **`cases[]`** 同源。

本机烟测生成的样例见 [`../R003_local_evidence_chain/r002_section4_backfill.md`](../R003_local_evidence_chain/r002_section4_backfill.md)。

**封口**：`report.json` 为 **GO / PARTIAL_GO** 且 **`cases[]`** 非空后，运行 **`python scripts/dev/print_tt_b486_seal_snippet.py`**（可选 **`--require-iron-rule-notes`**）生成 **from-stash 行 420** 与 **tracker** 粘贴块；详见 **[TT-B486](../../docs/AI任务卡索引.from-stash.md#tt-b486-93-r003-staging-batch-001)**。
