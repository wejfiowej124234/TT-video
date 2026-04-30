# GO_95 · §10.3-4 · Feature flag / 死开关（有界机读 · 2026-04-22）

## 1. 定位

对应 **《95》§10.3** 末行：**无「永远 false」仍占主路径的冗余分支**（或已文档化原因）。

本包将 **「永远 false」** 机读为 **字面恒假控制流**（**`if false` / `while false`**），与 **运行时 env 三态**（未设置 / 显式关 / 显式开）区分；后者以 **`frontend/lib/communityMeFeatureFlags.ts`** 等 **JSDoc** 为 **已文档化原因** 旁证。

**诚实边界**：**不**审计 **每个** **`#[allow(dead_code)]`** 被抑制符号是否真死；**不**扫 **全仓** **`cfg(feature=…)`**；**不**等价 **「已删除所有技术债分支」**。

## 2. 机读：字面恒假控制流

| 扇面 | 模式 | 结果 |
|------|------|------|
| **`crates/api/src/**/*.rs`** | `\bif\s+false\b` / `\bwhile\s+false\b` | **0** |
| **`frontend/**/*.ts`/`*.tsx`** | `if\s*\(\s*false\s*\)` / `while\s*\(\s*false\s*\)` | **0** |

## 3. **`#[allow(dead_code)]` 扇面（Rust · `traveltrust-api` 源码树）**

**与** **`…section10_3_legacy_cleanup_audit/README.md` §4** 同扇面；**机读合计** **13** 个 **`*.rs` 文件**、**23** 行 **`#\[allow(dead_code)\]`** / **`#!\[allow(dead_code)\]`**（**`crates/api/src`**）。

**判读**：均为 **编译期 unused 告警抑制**，**非**「**运行时** feature 开关恒 **`false`** 仍走热路径」之语义；**主路径可链接性**由 **`cargo check -p traveltrust-api`**/**`run-check-04`** 闸住（见 **§5**）。

## 4. 前端 **`NEXT_PUBLIC_*` 特性开关**（旁证 · 已文档化）

**`frontend/lib/communityMeFeatureFlags.ts`**：**赞过列表**/**bio**/**头像上传** 等以 **`NEXT_PUBLIC_*`** + **`NODE_ENV`** 组合策略实现，**文件头与逐函数 JSDoc** 写明默认与 **production** 约束 — 满足「**或已文档化原因**」之 **有界** 子集（**不**扩到 **全 `NEXT_PUBLIC_*`** 穷举）。

## 5. 契约闸

```bash
bash scripts/run-check-04-routes.sh
# → exit 0（登记时复跑）
```

## 6. 与 **§9**

本轮 **未**新立 **ISS-**。
