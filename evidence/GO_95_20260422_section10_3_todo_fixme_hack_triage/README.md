# GO_95 · §10.3-2 · `TODO` / `FIXME` / `HACK` triage（有界机读 · 2026-04-22）

## 1. 定位

对应 **《95》§10.3** 第二行：**`TODO` / `FIXME` / `HACK`** 已 triage（修完 / 转 **§9 ISS** / 注明排期与 Owner）。

本包为 **有界机读**：在列示扇面内 **0 命中** ⇒ 本条 **`[x]`** 的诚实语义为 **「当前无可分流条目」**；**不**等价 **全仓**/**`contracts/`**/**`docs/`**/**`evidence/`** 自然语言里的 **`TODO`** 字样审计；**不**替代 **Owner** 对 **历史大删改 PR** 的逐条 diff triage。

## 2. 机读：`TODO` / `FIXME` / `HACK`（词边界）

工具：工作区 **ripgrep**（与本地 **`rg`** / CI 扫描同类；**`frontend`** 隐式排除 **`node_modules`**）。

| 扇面 | 模式 | 结果 |
|------|------|------|
| **`crates/**/*.rs`** | `\b(TODO\|FIXME\|HACK)\b` | **0** |
| **`frontend/**/*.ts` / `*.tsx`** | 同上 | **0** |

等价的本地命令（已装 **`rg`** 时）：**`rg '\b(TODO|FIXME|HACK)\b' crates --glob '*.rs'`**、**`rg '\b(TODO|FIXME|HACK)\b' frontend --glob '*.ts' --glob '*.tsx'`**。

## 3. 机读：Rust 占位宏（补充）

| 扇面 | 模式 | 结果 |
|------|------|------|
| **`crates/**/*.rs`** | `\b(todo!\(|unimplemented!\()` | **0** |

## 4. 契约闸

```bash
bash scripts/run-check-04-routes.sh
# → exit 0（本包登记时复跑）
```

## 5. 与 **§9** / **§10.3** 余行

- **§9**：本轮 **未**因本扇面新立 **ISS-**（与 **`…section10_3_legacy_cleanup_audit/README.md`** 结论一致）。
- **§10.3** 余 **`[ ]]`**：**`@deprecated` 迁移对拍**、**feature flag / 死分支** — 见 **`evidence/GO_95_20260422_section10_3_legacy_cleanup_audit/README.md`** §3～§4。
