# data/ — 运行时与审计留痕目录

本目录用于存放运行时产出与发版前/审计留痕文件，便于追溯与门禁闭合。

## DB 合并规则（17 条 #3，写死）

**paid_merge_rule**：当前合约无 topUp；DB 合并规则写死为 **paid 仅来自 deposit，无 topUp**；合并逻辑见 `project_chain_event` 与 [04-后端与API](../docs/spec/04-后端与API.md) §四。若未来合约支持 topUp，须在 04 §四 与本节同步更新合并规则。

---

## 已有约定

| 文件或模式 | 用途 | 依据 |
|------------|------|------|
| `indexer_audit.jsonl` | Indexer 审计日志（replay_plan、event_applied 等） | 08-3 finalityN 行、Runbook §11 |
| `p34_pre_release_YYYYMMDD.log`（或 `pre_release_08_checks_YYYYMMDD.log`） | 发版前 **08 一致性 / evidence 指针** 等分项脚本的标准输出留痕（**非**已移除的汇总脚本） | [07 §四 4.3](../docs/spec/07-开发流程与顺序.md) 发版前（可选）、[Runbook](../ops/RUNBOOK.md)「发版前自动化检查」、[scripts/README §二](../scripts/README.md)、[27-P34-实现记录](../docs/spec/27-P34-实现记录.md) |

## 发版前 08 检查留痕（原 P34 口径）

仓库**已移除** `scripts/p34_pre_release_checks.sh`。发版前在仓库根**分项**执行并保存输出，例如：

```bash
D=$(date +%Y%m%d)
bash scripts/check-08-consistency.sh 2>&1 | tee "data/pre_release_08_checks_${D}.log"
bash scripts/check-08-evidence-pointer.sh 2>&1 | tee -a "data/pre_release_08_checks_${D}.log"
```

也可将输出纳入当次 evidence bundle（如 `evidence/GO_YYYYMMDD/`）备查。历史叙事与清单见 [27-P34-实现记录](../docs/spec/27-P34-实现记录.md)（正文在 **27-archived**）。若仍使用旧文件名 `p34_pre_release_*.log` 仅作兼容，语义上等同上述分项留痕。

## 其他

- 若需将 `data/*.log` 排除出版本库，可在 `.gitignore` 增加 `data/*.log`；留痕仍可仅存本地或 CI 产物。
- 08-3 中 `INDEXER_STATE_PATH`、`INDEXER_SEEN_KEYS_PATH` 等可指向本目录下文件，见 08-3 变更记录。
