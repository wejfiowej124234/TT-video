# GO_95 · §11.2「全量 spec 对拍」umbrella — 有界机读复验（v1.4.178）

**范围**：**95 §11.2** 首条 **umbrella**「**全量 spec 对拍**」的**机读扇面**复验；**不**替代 **snapshots/**/**27-archived/** 与 **04/95** 的全文人读对拍。  
**结论**：**不**将 **§11.2** 首条 **`- [ ]`→`[x]`**（与 **§11.2** 篇首「**不得将 umbrella 误读为已闭**」一致）。

---

## §1 目录计数（`docs/spec` 为 cwd 的相对 `find`）

```text
docs/spec *.md: 376
snapshots:      11
27-archived:    58
code-maps:      15
```

与 **95 文首**/**§11.2·机读子证（v1.4.123）** 一致（**376/11/58**；**code-maps 15** 为本次显式补登扇面）。

---

## §2 判读向量（`grep -rl`，仓库根 cwd）

```text
$ grep -rl 'routes/internal\.rs' docs/spec --include='*.md' | wc -l
9

$ grep -rl 'migrations/001_initial' docs/spec --include='*.md' | wc -l
10
```

**与 v1.4.123 登记差分**：**`routes/internal.rs`** **8→9**；**`migrations/001_initial`** **9→10**。  
**判读**：**仅**文件路径命中计数；**不**断言新增一篇即构成 **04/95**「冲突」— **须 Owner 打开 diff 文** 后决定是否 **§10.1** 纠文 / **§9 ISS** 登记批量清理。

---

## §3 门禁旁证（非 umbrella 闭证）

```text
$ bash scripts/check-07-version-triple.sh
OK: 07 version triple aligned (1.0.858).

$ bash scripts/run-check-04-routes.sh
exit 0（尾部 B457 等 gates OK）
```

---

## §4 下一动作（工程建议）

- **§11.2 umbrella** 仍为 **`[ ]`**：周期性 Owner 从 **`grep -rl` 命中表** 抽样 **3～5** 篇纠 **B-181**/**历史 migrations 路径** 或登记 **§9** 批量 **ISS-**。  
- **00↔95**：**95 Version** 已前进至 **v1.4.178**；若维护者要求索引一致，须显式 **「台账同批」** 更新 **[00-文档索引](00-文档索引.md)** 表 **95** 行。
