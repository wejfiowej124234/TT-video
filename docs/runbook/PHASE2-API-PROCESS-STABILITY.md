# Phase ② · API 进程稳定性（独立跟踪 · 非 Phase ① 阻塞）

**阶段：** **② 测试网 / 运维** — **不** 回退 Phase ① Freeze · **不** 阻塞 **G-T** / **Transition Audit OK**

**现象（2026-05-31）：** `bash scripts/dev/start-api-for-playwright.sh`（`traveltrust-api.exe`）长跑约 **51 分钟** 后 **`exit code: 1`**；此前 **`/health` 与 G-08 烟测路径均为 200**。属 **进程稳定性 / 长跑退出**，**非** Phase ① 功能缺口。

**纪律：**

| 规则 | 说明 |
|------|------|
| **① 已封版** | **禁止** 以本项为由重开 Phase ① E2E / 功能补洞 |
| **② 单独跟踪** | 进入 Phase ② 后按槽验收；与 **C1～C12**、**ONB-P2-*** 并行登记 |
| **证据** | 终端 `start-api-for-playwright` / `988420` 类任务 log · 崩溃前后 `dmesg`/Windows 事件查看器（可选） |

**建议排查（② · 未启动实施）：**

1. 复现时保留 **`RUST_BACKTRACE=1`** · **`RUST_LOG=info`**
2. 对照崩溃时刻是否有 **OOM**、**端口抢占**、**Docker PG 断开**
3. G-08 / Playwright 会话改 **短跑重启** 或 **进程外健康检查**，直至根因闭证

**互指：** [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md) · [PHASE2-ENTERPRISE-GAP-AUDIT](./PHASE2-ENTERPRISE-GAP-AUDIT.md) · [solo-dev-rhythm §6.5](../solo-dev-rhythm.md)
