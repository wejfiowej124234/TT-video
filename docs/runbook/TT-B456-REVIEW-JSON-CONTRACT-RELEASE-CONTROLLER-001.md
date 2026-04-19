# TT-B456-REVIEW-JSON-CONTRACT-RELEASE-CONTROLLER-001 · **灰度执行器（** **release controller** **）** **与** **CI/CD** **集成**

**母表**：[B-456](../任务母表.md)

**前置**：**[TT-B455](./TT-B455-REVIEW-JSON-CONTRACT-GRAY-ROLLBACK-STRATEGY-001.md)**（**B-455**）**`eval-b455-*`** **裁决** **；** **[TT-B454](./TT-B454-REVIEW-JSON-CONTRACT-DEGRADE-EVIDENCE-REPLAY-001.md)**（**B-454**）**`replay_summary.json`** **。**

**本卡** **将** **`GREEN`/`YELLOW`/`RED`** **从** **判定** **结果** **落地** **为** **可** **编排** **的** **发布** **动作** **：** **`scripts/ops/release-controller-b456-review-json-contract.py`** **（** **默认** **透传** **`eval-b455`** **exit** **码** **）** **与** **`.github/workflows/review-json-contract-release-controller.yml`** **（** **`GITHUB_OUTPUT`** **+** **条件** **步骤** **占位** **）** **。**

---

## §1 · 验收（封口条件）

### §1.1 本地 / 门禁（透传 exit 码）

```bash
python scripts/ops/release-controller-b456-review-json-contract.py \
  evidence/b455_review_json_contract_rollout/fixtures/replay_summary.green.json

python scripts/ops/release-controller-b456-review-json-contract.py \
  evidence/b455_review_json_contract_rollout/fixtures/replay_summary.red.json
```

### §1.2 CI 模式（**`--ci`** **：进程** **恒** **0** **，** **由** **`GITHUB_OUTPUT`** **分支** **）**

```bash
python scripts/ops/release-controller-b456-review-json-contract.py \
  evidence/b455_review_json_contract_rollout/fixtures/replay_summary.green.json \
  --ci \
  --github-output /tmp/gh_out.txt
```

### §1.3 门禁

```bash
python scripts/gates/check-b456-review-json-contract-release-controller-gate.py
bash scripts/run-check-04-routes.sh
```

---

## §2 · 机读契约

| 工件 | 说明 |
|------|------|
| **`config/b456_review_json_contract_release_controller.json`** | **`controller_schema`** **`b456_review_json_contract_release_controller_v1`** **；** **`hooks.*.shell_command`** **默认** **`null`** **（** **运维** **可** **在** **私有** **叠加** **层** **填** **命令** **，** **勿** **把** **密钥** **写入** **公有** **仓** **）** **。** |
| **`scripts/ops/release-controller-b456-review-json-contract.py`** | **调用** **`eval-b455-*`** **；** **写** **`GITHUB_OUTPUT`** **：** **`verdict`** **、** **`eval_exit_code`** **、** **`should_promote`** **/** **`should_freeze`** **/** **`should_rollback`** **（** **布尔** **字符串** **）** **。** |
| **`.github/workflows/review-json-contract-release-controller.yml`** | **`workflow_dispatch`** **可** **指** **定** **`replay_summary_path`** **；** **PR** **触** **发** **用** **绿** **fixture** **回归** **；** **三** **条** **占位** **步骤** **对应** **放量** **/** **冻结** **/** **回滚** **信号** **（** **须** **替换** **为** **贵司** **部署** **/Flag** **管道** **）** **。** |

---

## §3 · 非目标

- **不** **在** **本** **仓** **存放** **云** **厂商** **凭证** **或** **真实** **回滚** **API** **调用** **（** **仅** **占位** **与** **契约** **）** **。**
- **不** **改变** **B-455** **阈值** **语义** **（** **仍以** **`eval-b455-*`** **为** **唯一** **裁决** **）** **。**

---

**文档版本**：1.0 · 2026-04-17
