# GO_95 · §12.2 · C-2 读通批次登记（非主行闭证）

**日期**：2026-04-22  
**范围（95 §12.2 · C-2）**：**`chain_off/`**、**`db/`**、**`migrations/`**、双写/hydrate 叙事 — 走读 **`crates/api/src/chain_off/mod.rs`** 篇首+**`ChainOffConfig`** 治理 SSOT 开关注释；**`crates/api/src/db/mod.rs`** 篇首+**`pub use`/`mod`** 出口面；互证 **95 §12.3.2**（**`migrations/*.sql`→70**）；与 **110**/**§7.5**/**§3 F-029** 母题对读；**并列** **§12.4** **「C-2（子证）」**（**2026-04-23** 起）。

## 1. 本轮读通与对拍（有界）

| 对象 | 本轮触及 | 结论 |
|------|----------|------|
| **`chain_off/mod.rs`** | crate 注释（**04 §二§三**、mock）；**`ChainOffConfig`** 与 **`GOVERNANCE_*_CHAIN_SSOT`** 字段注释（**`GET /meta`**/**Governor** 对拍边界） | 与 **§11.1** **`…chain_off_extensions/`** 旁证方向一致；**未**扫 **`chain_off/**`** 各 impl 全文 |
| **`db/mod.rs`** | 双写/hydrate 叙事句；**`pub use`** 域清单首屏（orders/disputes/community/…） | 与 **04 §四**/**48 §六** 互指；**未**走读各 **`db/*.rs`** 实现 |
| **`migrations/`** | **95 §12.3.2** 真值句（**70** `*.sql`） | 与本轮 **`find crates/api/migrations -name '*.sql' | wc -l` → 70** 一致 |
| **机读计数** | **`find crates/api/src/chain_off -name '*.rs' | wc -l` → 36**；**`find crates/api/src/db -name '*.rs' | wc -l` → 76** | **chain_off=36** 与 **95 文首**/**§11.1** 一致；**`db`→76** 与 **曾记约 74** 不同 — 以本轮 **`find`** 与 **v1.4.157** **95**/**§12.2·C-2** 表体为准 |

## 2. 互指一致性（本轮结论）

- **`migrations` 70** / **`chain_off` 36** 与 **95 §12.3.2**/**文首**/**§12.4·C-2（子证）** 机读句一致。  
- **`db` 76 `*.rs`** 与 **§12.2·C-2** 主表曾写 **约 74** 冲突 — **本包登记重数纠偏**（**不**宣称 **`db/`** 模块审阅完成）。  
- **未**重跑 **`cargo test -p traveltrust-api chain_off::`**（历史旁证 **162 passed** 见 **`…section11_1_chain_off_extensions/`**）。

## 3. 命令结果（机读 · 非 C-2 闭证）

```bash
bash scripts/check-07-version-triple.sh
bash scripts/run-check-04-routes.sh
# 本轮另记（仓库根）：
# find crates/api/src/chain_off -name '*.rs' | wc -l  → 36
# find crates/api/src/db -name '*.rs' | wc -l       → 76
# find crates/api/migrations -name '*.sql' | wc -l  → 70
```

**结果**：**`OK: 07 version triple aligned (1.0.858).`**；**`run-check-04-routes.sh` exit 0**。

## 4. 诚实边界

- **不得**将本包替代 **§12.2 · C-2** 主表 **`[x]`**（须 **`db/`** 模块走读 + **110** + **§7.5** hydrate/strict + **§3** F 行等 **95** 主行口径）。  
- **不得**用 **`migrations` 文件存在**替代目标环境 **`sqlx migrate run`** 成功（**95 §12.3.2** 已述）。  
- 与 **§12.4 · C-2（子证）** **并列**；本包为 **C-2 批次读通登记（v1.4.157）**。
