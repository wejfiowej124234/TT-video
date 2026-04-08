# B-094 · `executeResolution` 三终态模板（从文档 · 入口）

**角色**：**从文档** — **不**在此维护三态金额表、tx、余额或 `orders_projection` 字段；避免与 SSOT 双源漂移。

**主文档（SSOT）**：[`docs/verification-evidence/B-094-resolution-fixtures-SSOT.md`](../docs/verification-evidence/B-094-resolution-fixtures-SSOT.md) — 开首 **§0** 为 **B-103** **`TT-B103-RESOLUTION-FIXTURES-ONEPAGE-SSOT-001`** 三终态一页主表（**tx / 三腿 wei / 余额 / `orders_projection` 字段**）；**§1～§5** 为 **B-094** 扩写与 TT-9 锚点。

**证入口（指针 · B-103 / B-123）**：[B-103](../docs/verification-evidence/B-103-resolution-fixtures-SSOT.md) · [B-123](../docs/verification-evidence/B-123-resolution-fixtures-ENTRY.md)（**`TT-B123-RESOLUTION-FIXTURES-ENTRY-001`**）— **仅**回落 **§0**，**不**另写三态表。

**母表**：`docs/任务母表.md` **B-094** / **B-103** / **B-123** — 验收 **单文件勾选** 同上路径（**禁止**在本从文档或它处维护第二套三态 fixture 表）。

**TT**：`TT-ESCROW-EXECUTE-RESOLUTION-B094-001` · 证据包索引见 **`docs/verification-evidence-pack.md`**（**TT-9**、`tt-09-b094-resolution-indexer.json`）。
