# GO_95 · §11.2 — **全量 spec 对拍** 机读子证（2026-04-22）

## 1. 目的与边界

- **目的**：为 **[95 §11.2](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)**  umbrella 子条 **「全量 spec 对拍」** 登记**可追溯机读扇面**，支撑 **§10.1** 分批勾选与 **§12.4** 审计行。
- **诚实边界**：
  - **不**将 **§11.2** 主条 **`- [ ]` 全量 spec 对拍** 改为 **`[x]`**（仍须 **§10.1** 逐批人验 / evidence）。
  - **不**表示已通读 **`docs/spec/**/*.md`** 全量（本轮仅 **计数 + 定向 grep**）。
  - **不**替代 **S-2**/**P0 签字**/**93/R-001**。

## 2. 机读计数（仓库根 · Git Bash）

```bash
find docs/spec -name '*.md' | wc -l
# → 376

find docs/spec/snapshots -name '*.md' | wc -l
# → 11

find docs/spec/27-archived -name '*.md' | wc -l
# → 58
```

与 **95 文首**「**约 376**」篇数一致（**`snapshots/`**/**`27-archived/`** 已含于 **`find docs/spec`**）。

## 3. 定向 grep（漂移向量 · 非穷举）

### 3.1 **`routes/internal.rs`** 字面（B-181 / CI 锚点叙事）

```bash
grep -rl 'routes/internal\.rs' docs/spec --include='*.md' | wc -l
```

**本包执行时**：**8** 个 **`docs/spec/**/*.md`** 仍含该字面（多为 **00/07/缺口/02/110/160/14** 读前**判读**句，**非**断言文件仍存在）。

### 3.2 **历史 SQL 路径 `migrations/001_initial`**

```bash
grep -rl 'migrations/001_initial' docs/spec --include='*.md' | wc -l
```

**本包执行时**：**9** 个文件（含 **`27-archived/README.md`** 明示历史路径；**`04`/`41`/`58`/`59`** 等互证或时点稿）。

### 3.3 **`snapshots/` 内 `api_router`/`merge` 叙述**

```bash
grep -r 'api_router\|\.merge(' docs/spec/snapshots --include='*.md'
```

**本包执行时**：命中 **`snapshots/README.md`**（滞后提示）+ **`58-企业级检查-完成证明-20260306.md`**（篇首/§2.1 已与 **`grep -c '\.merge(' routes/mod.rs` → 21** 对齐；**历史 17 域** 表体仍作**当时**记录 — 见 **`evidence/GO_95_20260422_section11_2_snapshot58_merge/README.md`**）。**其余 9 篇** `snapshots/*.md` **本轮未**全文打开。

## 3.4 **CI** 侧（**v1.4.124** 另包）

**`.github/workflows`** 仍含 **`routes/internal.rs`**/**`routes/community.rs`** 字面的 **`*.yml` 文件扇面** → **`evidence/GO_95_20260422_section10_1_workflow_b181_anchor_scan/README.md`**（**不**重复计数为「spec 篇内」命中）。

## 4. 与 **04/95** 的读法（登记用）

| 向量 | **现行 SSOT** | **归档/时点稿** |
|------|----------------|-----------------|
| **HTTP 路径** | **04 §3.4** | **27-archived** 可能旧 Discover 叙事 — **27-archived/README** 已给读前 |
| **迁移文件** | **`crates/api/migrations/*.sql`** | **`migrations/001_*.sql`** 历史字面 — **41**/**27 README** |
| **`api_router` merge 数** | **`routes/mod.rs` 机读** | **snapshots/** 可能滞后 — **snapshots/README** + **58** 补丁链 |

## 5. 文档登记

- **`docs/spec/95-…`**：**`Version:` 1.4.123**；**§11.2** 增 **`[x]`** **机读子证** 行（**不**勾 umbrella **`- [ ]`**）；**§0.2**/**§6**/**§12.4**/**文首**/**[00 表 95 行](../../docs/spec/00-文档索引.md)** 台账同批。
