# Broadcast batch blockers（合并唯一阻断）

合并到默认分支 `main` 时，应**只**将 **workflow「Broadcast batch blockers」**（文件：`.github/workflows/broadcast-batch-blockers.yml`）中的下列 **4 个 check** 设为必需：

| 必须勾选（Check name 与 UI 一致） | Job id |
|-----------------------------------|--------|
| `No legacy Staking.sol as unqualified SSOT path` | `no-legacy-staking-path-ssot` |
| `Broadcast batch 1 blockers` | `broadcast-batch-1-blockers` |
| `Broadcast batch 2 blockers` | `broadcast-batch-2-blockers` |
| `Broadcast batch 3 blockers` | `broadcast-batch-3-blockers` |

若 **Settings → Branches** 中 `main` 另有一条必过项 **`Production gate (trinity) — gate closed`**（Unicode 长横线 `—`），仓库内由 **`.github/workflows/production-gate-trinity-branch-protection-shim.yml`** 上报该 context；未部署真实 Trinity 生产门禁前勿删该 workflow，否则 PR 会因「缺少必过 check」而永久阻塞。

**GitHub 设置路径**：Repository → Settings → Branches → 编辑 `main` 的保护规则 → **Require status checks to pass** → 勾选上表 **4** 项；若保护规则另含 **`Production gate (trinity) — gate closed`**，一并勾选（由上文 shim workflow 上报）；**取消**将整条「Build」workflow 或其它旧门禁列为必需（否则仍会被非 batch 失败挡住）。

> 说明：`Build` workflow（`.github/workflows/build.yml`）中非 batch 的 job 已设 `continue-on-error: true`，其失败**不会**让整个 Build 变红；`Broadcast batch blockers` 中上述 **4** 个 job 全绿时该 workflow 才通过。

**长期监控（非必过）**：`.github/workflows/legacy-path-ssot-gate-monitor.yml` 每周定时复跑同一脚本，便于在 **Actions** 时间线上观测回归；**合并仍以 branch protection 中的必过 check 为准**。

**规则冻结**：`config/ci/legacy_path_ssot_rules.v1.json` 仅在出现**真实误报/漏报**或**新增退役路径**时变更（见 `docs/runbook/TT-LEGACY-PATH-SSOT-GATE-REGRESSION-OBSERVATION-001.md`）。

## 本地等价强制（pre-push）

一次性安装推送前跑 **legacy path SSOT gate + 三门禁**：

```bash
bash scripts/gates/install-broadcast-batch-pre-push-hook.sh
```

手动跑一次（不依赖 hook）：

```bash
bash scripts/gates/broadcast-batch-all-required.sh
```

Windows 若 `python3` 不可用，请先修好 PATH 或将 gate 脚本中的 `python3` 改为本机可用的解释器（如 `py -3`）。
