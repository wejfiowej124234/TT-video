# GO_95 · §10.1 — **B-181** **workflow** 锚点字面机读（2026-04-22）

## 1. 目的与边界

- **目的**：为 **[95 §10.1](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **「归档与快照」**/**[00 · B-181](../../docs/spec/00-文档索引.md)** 叙事提供 **`.github/workflows`** 侧**可数旁证**（**`check_anchor`/`grep` 第三参** 仍可能指向**已删除**之 **`routes/internal.rs`** 等字面）。
- **诚实边界**：
  - **不**表示已审完全部 **workflow** 行为或 **YAML** 语义。
  - **不**替代 **§10.2** **Runbook clean clone** / **弃用脚本** 子条。
  - **不**改变 **04 §3.4** HTTP 表体；**判读**仍以 **00/缺口/07** 读前 **B-181** 为准（**`grep` 对缺文件失败 ≠ 域未实现**）。

## 2. 机读命令（仓库根 · Git Bash）

**含 `routes/internal.rs` 的 workflow 文件（去重路径）**

```bash
grep -rl 'routes/internal\.rs' .github/workflows --include='*.yml' | sort
```

**本包执行时输出**（**5** 文件）：

- `.github/workflows/build.yml`
- `.github/workflows/community-governance-gate.yml`
- `.github/workflows/finance-reconcile-gate.yml`
- `.github/workflows/indexer-reconcile-gate.yml`
- `.github/workflows/internal-drill-gate.yml`

**含 `routes/community.rs` 的 workflow 文件**

```bash
grep -rl 'routes/community\.rs' .github/workflows --include='*.yml' | sort
```

**本包执行时输出**（**1** 文件，与上表重叠 **1** 条）：

- `.github/workflows/community-governance-gate.yml`

**`routes/health_meta.rs` 命中**

```bash
grep -rl 'routes/health_meta\.rs' .github/workflows --include='*.yml' | wc -l
# → 0（本包执行时）
```

## 3. 与 **§11.2** 子证关系

- **`docs/spec`** 侧 **`grep -rl 'routes/internal\.rs' docs/spec …` → 8** 见 **`evidence/GO_95_20260422_section11_2_full_spec_reconcile_subproof/README.md`**。
- 本包补 **CI 侧** 文件扇面（**5** **`*.yml`**），便于 **§10.1**/**§10.2** 分批维护锚点串时**不混读**为 **HTTP 契约**漂移。

## 4. 文档登记

- **`docs/spec/95-…`**：**`Version:` 1.4.124**；**§10.1** 末增 **blockquote 机读旁注**；**§0.2**/**§6**/**§12.4**/**文首**/**[00 表 95 行](../../docs/spec/00-文档索引.md)** 台账同批。
