# GO_95 — §10.2 · Runbook / 08-5「复制即跑」前置条件落款（**v1.4.131** · 与 **95 `Version:`** 台账对读）

**95**：[§10.2 · Runbook / 08-5 … clean clone（或文档写明前置条件）](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md#102-全仓库脚本对齐)  
**结论**：按 **「或」** 分支，在 **[08-5 §2.1](../../docs/spec/08-5-CI与一致性落地说明.md#clean-clone-prereq)** 落盘 **前置条件表**；本条 **`[x]`** = **文档落款**，**不**表示 **[ops/RUNBOOK.md](../../ops/RUNBOOK.md)** / **[go-live-checklist.md](../../docs/go-live-checklist.md)** 全矩阵已在 **裸 clean clone** 上 **`exit 0`** 复现。

## 1. 文档锚点

- **`docs/spec/08-5-CI与一致性落地说明.md`** — **§2.1**（`id="clean-clone-prereq"`）  
- **`docs/go-live-checklist.md`** — **11.4** **`Run command`** 仍引用 **`bash scripts/check-08-consistency.sh`**（前置见 **08-5 §2.1** 互指）

## 2. 机读复跑（本包）

```bash
bash scripts/check-08-consistency.sh
bash scripts/run-check-04-routes.sh
```

**本机摘录（2026-04-22）**：`check-08-consistency.sh` **exit 0**（**08-4** CI 版本行 OK；**vs main** 无 08-3 触键时 skip bump 规则）；`run-check-04-routes.sh` **exit 0**。

## 3. 诚实边界

- **仍开**：**§10.2** **裸 Runbook/go-live** 全矩阵 **`[ ]`**；**CI 全 workflow 行为矩阵** 人验。**`scripts/archive/`/`stale`（bounded · 四文件+目录）** **`[x]`** **v1.4.137**/**`../GO_95_20260422_section10_2_archive_stale_gate/README.md`**。  
- **禁止**：仅凭本包宣称 **Runbook** 或 **go-live** 已 **clean clone 全绿**。
