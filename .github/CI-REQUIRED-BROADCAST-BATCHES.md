# Broadcast batch blockers（合并唯一阻断）

合并到默认分支 `main` 时，应**只**将 **workflow「Broadcast batch blockers」**（文件：`.github/workflows/broadcast-batch-blockers.yml`）中的下列 **3 个 check** 设为必需：

| 必须勾选（Check name 与 UI 一致） | Job id |
|-----------------------------------|--------|
| `Broadcast batch 1 blockers` | `broadcast-batch-1-blockers` |
| `Broadcast batch 2 blockers` | `broadcast-batch-2-blockers` |
| `Broadcast batch 3 blockers` | `broadcast-batch-3-blockers` |

**GitHub 设置路径**：Repository → Settings → Branches → 编辑 `main` 的保护规则 → **Require status checks to pass** → 在列表中**只**搜索并勾选上述三项；**取消**将整条「Build」workflow 或其它旧门禁列为必需（否则仍会被非 batch 失败挡住）。

> 说明：`Build` workflow（`.github/workflows/build.yml`）中非 batch 的 job 已设 `continue-on-error: true`，其失败**不会**让整个 Build 变红；仅 `Broadcast batch blockers` 三门禁全绿时该专用 workflow 才通过。

## 本地等价强制（pre-push）

一次性安装推送前跑三门禁：

```bash
bash scripts/gates/install-broadcast-batch-pre-push-hook.sh
```

手动跑一次（不依赖 hook）：

```bash
bash scripts/gates/broadcast-batch-all-required.sh
```

Windows 若 `python3` 不可用，请先修好 PATH 或将 gate 脚本中的 `python3` 改为本机可用的解释器（如 `py -3`）。
