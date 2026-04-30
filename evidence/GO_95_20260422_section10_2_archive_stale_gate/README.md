# GO_95 — §10.2 · `scripts/archive/` + **索引/Runbook** stale **扇面机读**（**v1.4.137**）

**95**：[§10.2 · 弃用脚本 …](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md#102-全仓库脚本对齐) 第三子项（**`scripts/archive/`** / **stale 链接**）。

## 1. 结论（bounded）

- **物理目录**：仓库根 **`scripts/archive/`** **不存在**（**`test -d scripts/archive` → absent**）。本条 **「或删除」** 分支成立：**无**独立弃用脚本堆目录。
- **「索引/Runbook」字面 stale（`scripts/archive/` 路径）」**：在下列 **4** 个 **SSOT 入口文件** 内检索 **`scripts/archive/`**（**含尾 `/`**，**排除** **`scripts/archive-*`** 脚本名误伤）→ **0 行**命中：
  - **`ops/RUNBOOK.md`**
  - **`docs/spec/00-文档索引.md`**
  - **`CONTRIBUTING.md`**
  - **`docs/go-live-checklist.md`**

## 2. 机读复跑（本包）

```bash
test ! -d scripts/archive && echo "scripts/archive absent OK"
for f in ops/RUNBOOK.md docs/spec/00-文档索引.md CONTRIBUTING.md docs/go-live-checklist.md; do
  echo "--- $f ---"
  grep -nE 'scripts/archive/' "$f" | grep -v 'scripts/archive-' || true
done
bash scripts/run-check-04-routes.sh
```

**本机摘录（2026-04-22）**：**`scripts/archive` absent OK`**；四文件 **`grep`** **无输出**；**`run-check-04-routes.sh` exit 0**。

## 3. 诚实边界

- **不**等价「**全 `docs/spec/**/*.md`** 已扫 stale」— 本包**仅**对 **§10.2** 条文中的 **「索引/Runbook」** 取 **00 + RUNBOOK + CONTRIBUTING + go-live** 四文件 **+** **目录存在性** 机读落款。
- **`docs/AI任务卡索引*.md`** 等处的 **`scripts/archive-*.sh`** 为**脚本文件名**，**≠** 指向 **`scripts/archive/`** 目录；**未**纳入本扇面 stale 计数。
- **不**替代 **§10.3～10.5**/**§8.2**/**93**/**CI 全 workflow** 矩阵人验。
