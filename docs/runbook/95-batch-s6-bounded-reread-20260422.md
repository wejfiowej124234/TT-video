# 95 · §12.1 · **S-6** 有界机读复验（snapshots / 27-archived / code-maps · 2026-04-22）

> **定位**：**§12.1** 表 **S-6**（**`code-maps/`**、**`snapshots/`**、**`27-archived/`**）之**有界复验**；**不**将 **§12.1 · S-6** 主行 **`[ ]`→`[x]`**；**不**替代三目录**单篇全文**审计、**§11.2** umbrella、**ISS-007**/**93**/**§8.2 行完成**。

## 1. 门禁（仓库根）

```bash
bash scripts/check-07-version-triple.sh
bash scripts/run-check-04-routes.sh
bash scripts/check-08-consistency.sh
```

**结果（本机）**：三者均为 **exit 0**（**`run-check-04`**：**178** 路径）。

## 2. 入口 README（存在性）

| 路径 | `test -f` |
|------|-----------|
| **`../spec/snapshots/README.md`** | OK |
| **`../spec/27-archived/README.md`** | OK |
| **`../spec/code-maps/README.md`** | OK |

**语义锚（抽检）**：**snapshots/README** — 时点稿 **`routes/mod.rs` / `merge`** 可能滞后；**27-archived/README** — 历史 **`migrations/001_initial`** 路径 vs 现行 **`crates/api/migrations/`**；**code-maps/README** — 映射稿目录，**SSOT** 在 **`spec/` 根**。

## 3. 子目录 `*.md` 计数（与 **95 §11.2** 机读子证 / 文首「约」互证）

```bash
find "${DOC_D:-docs}/${SPEC_S:-spec}/snapshots -name '*.md' | wc -l
find "${DOC_D:-docs}/${SPEC_S:-spec}/27-archived -name '*.md' | wc -l
find "${DOC_D:-docs}/${SPEC_S:-spec}/code-maps -name '*.md' | wc -l
```

| 目录 | `wc -l` |
|------|---------|
| **`../spec/snapshots`** | **11** |
| **`../spec/27-archived`** | **58** |
| **`../spec/code-maps`** | **15** |

## 4. 诚实边界

- **不**宣称 **S-6** 主批次已闭（仍为 **`[ ]`**）。
- **不**将本 Runbook 与 **v1.4.155** **`…section12_1_s6_readthrough_batch/`** 读通登记**合并闭证**（**并列**机读复验）。
- **不**闭 **ISS-007** / **§8.2「行完成」** / **§3.1 `[x]`**。
- **台账同批**：**[00-文档索引](../spec/00-文档索引.md)** 表 **95** 行 **v1.4.189** 摘要前缀（**S-6** Runbook 指针）。
