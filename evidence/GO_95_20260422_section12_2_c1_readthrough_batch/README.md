# GO_95 · §12.2 · C-1 读通批次登记（非主行闭证）

**日期**：2026-04-22  
**范围（95 §12.2 · C-1）**：**`crates/api/src/routes/mod.rs`**（**`api_router()`** **`.merge`** 链）、**`crates/api/src/state.rs`**（**`ApiMetaState`** 落点 · **48 §11.2**）、**`crates/api/src/startup/`**、**[48-后端模块化拆分与落地清单](../../docs/spec/48-后端模块化拆分与落地清单.md)** 读前+**§一**/**§二** 首屏；与 **04 §3.4**/**14 §2.1**/**07 §零 0.6**/**95 §12.3** 互指；**并列** **§12.4** 既有 **C-1** 子证行（**机读**/**`routes` 顶层可数**/**`routes/**/tests` 可数**/**state/startup 纠偏**/**CONTRIBUTING** 等，**2026-04-21** 起）。

## 1. 本轮读通与对拍（有界）

| 对象 | 本轮触及 | 结论 |
|------|----------|------|
| **`routes/mod.rs`** | 文件头 **SSOT** 句（**21×`merge`**，含 **`market_subsite`**）；**`api_router()`** 体 **21** 行 **`.merge(...)`**（**`health_meta`→`internal`**） | 与 **07/04/14/95 §12.3** 同源；**未**逐域审计各 **`router()`** 内 handler 行为 |
| **`state.rs`** | 篇首 crate 注释（**48 §4.4、§11.2**）；**`ApiMetaState`** 相关类型区首屏 | **非** **`state/`** 目录叙事与 **§12.2·C-1**/**§12.4** 子证一致 |
| **`startup/`** | 目录 **`*.rs`** 可数（本轮 **6**） | 与 **95 §12.2·C-1**/**48 §二**「**`startup/`** 拆分」粗对齐 |
| **48** | 读前摘要；**§一 1.1** 行数目标；**§一 1.2** 与 **04 §3.4** 对应；**§二 2.1** 拆分后 **`main`/`startup`/`routes/`** 表首屏 | **不**替代 **04** 契约表全文；**`routes/`** 历史行列表可能滞后于现行 **`api_router()`** |
| **机读计数** | **`find crates/api/src/routes -maxdepth 1 -name '*.rs' | wc -l` → `35`**；**`find … -path '*/tests/*.rs' | wc -l` → `15`** | 与 **95 文首** **`routes/` 顶层 `*.rs` 约 35**/**`routes/**/tests` 约 15** 同源；**与 §12.3.4** 子目录扇面**并列**、**禁**简单相加双计 |

## 2. 互指一致性（本轮结论）

- **`api_router()`** **21×`merge`** 与 **`routes/mod.rs`** 顶部注释及 **95**/**07**/**14** 叙述一致。  
- **顶层 `*.rs`=35** 与 **旧子证「31」** 不同：以**本轮 `find` 输出**与 **95 文首** **35** 为准（历史子证未改事实，仅本包登记本轮重数）。  
- **未**发现与 **04 §3.4** 路径总表的**显式**冲突（本轮未做路径级 diff）。

## 3. 命令结果（机读 · 非 C-1 闭证）

```bash
bash scripts/check-07-version-triple.sh
bash scripts/run-check-04-routes.sh
# 本轮另记（Git Bash / 仓库根）：
# find crates/api/src/routes -maxdepth 1 -name '*.rs' | wc -l   → 35
# find crates/api/src/routes -path '*/tests/*.rs' | wc -l     → 15
# find crates/api/src/startup -name '*.rs' | wc -l          → 6
```

**结果**：**`OK: 07 version triple aligned (1.0.858).`**；**`run-check-04-routes.sh` exit 0**。

## 4. 诚实边界

- **不得**将本包替代 **§12.2 · C-1** 主表 **`[x]`**（须 **`mod.rs` 与各域挂载/测试桩** 行为审计 + **Admin 同层 `admin_cross_check` 等** 与 **04/F-030** 对拍等 **95** 主行口径）。  
- **不得**用 **`run-check-04` 绿**替代 **`cargo test -p traveltrust-api`** 全矩阵。  
- 与 **§12.4** 既有 **C-1** 子证行**并列**；本包为 **C-1 批次读通登记（v1.4.156）**。
