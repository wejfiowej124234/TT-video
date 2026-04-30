# GO_95 · §12.1 · S-6 读通批次登记（非主行闭证）

**日期**：2026-04-22  
**范围（95 §12.1 · S-6）**：时点快照 / 归档 / 代码映射 — **[snapshots/README](../../docs/spec/snapshots/README.md)**、**[27-archived/README](../../docs/spec/27-archived/README.md)**、**[code-maps/README](../../docs/spec/code-maps/README.md)**（与 **§11.2** **`api_router` `.merge`** 机读、**§12.3**、**§10.4**/**§9** 冲突上报口径对读；**并列** **§12.4** 既有 **「S-6（子证 · snapshots/README）」**/**「S-6（子证 · 27-archived + code-maps README）」**（**2026-04-21**））。

## 1. 本轮读通与对拍（有界）

| 文档 | 本轮触及 | 与 95 / 互指 对读 |
|------|----------|-------------------|
| **snapshots/README** | 篇首定位；**api_router merge 时点稿≠真值**（SSOT：`routes/mod.rs`、04/07/14/00）；**当前收录**表头 | 与 **95 §11.2**/**snapshot58_merge** 旁证同向；**未**审 **snapshots/** 单篇正文 |
| **27-archived/README** | 读前摘要；**migrations** 历史路径纠偏（**`crates/api/migrations/`** 唯一执行源）；**Discover vs `/market`** 现行口径 | 与 **04 §3.4**/**13-1** 一致；归档与主 spec 冲突时走 **§9**/**§10.4** |
| **code-maps/README** | 目录定位（**01/04/07/14/53/110** SSOT 仍在 **spec/** 根）；**当前收录**类型表；**链接约定** | 与 **95 文首** **`code-maps` `*.md` 约 15** 计数旁证兼容；**未**扫 **code-maps/** 单篇映射全文 |

## 2. 互指一致性（本轮结论）

- **三份 README** 均显式声明：**子目录稿 ≠ 主 SSOT**；与 **S-6** 主行「全文审计后勾」仍留余量一致。  
- **27-archived** 对 **Discover**/**`/market`** 的纠偏与现行 **04** 叙事无冲突。  
- **未**发现需新开 **§9 ISS-*** 的硬冲突（本轮有界）。

## 3. 命令结果（机读 · 非 S-6 闭证）

```bash
bash scripts/check-07-version-triple.sh
bash scripts/run-check-04-routes.sh
```

**结果（本轮）**：**`OK: 07 version triple aligned (1.0.858).`**；**`run-check-04-routes.sh` exit 0**。

## 4. 诚实边界

- **不得**将本包替代 **S-6** 主表 **`[x]`**（须 **`code-maps/`**/**`snapshots/`**/**`27-archived/`** 映射/时点稿 **全文** 审计 + **04/95** 冲突闭环等主行口径）。  
- **不得**用 **`snapshots/58`** 等时点 **`merge` 计数**替代 **`crates/api/src/routes/mod.rs`** **`api_router()`** 真值。  
- 与 **§12.4** 两行 **S-6 子证（2026-04-21）** **并列**；本包为 **S-6 批次读通登记（v1.4.155）**。
