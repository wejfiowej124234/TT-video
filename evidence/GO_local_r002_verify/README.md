# ISS-007 本地 R-002 预链证据目录（①）

本目录为 **`local-verify-r002-prereport-chain.sh`** 的默认落盘根（可用 **`TRAVELTRUST_LOCAL_R002_EVIDENCE_DIR`** 覆盖）。产物通常包括：

- **`r002_iss007_prereport/report.json`** — **`gen-r002-iss007-prereport.py`** 按 **R-001** 结构写出；**43 个 93 锚全 PASS** 时 **`release_gate` 仍为 `PARTIAL_GO`**（窄切片设计，**不**宣称 staging 全矩阵 **GO**）。
- **`e2e_core_report.json`** — 严格链末尾由 **`write-e2e-core-report-with-r002.py`** 写入（需 **`DATABASE_URL`** 全跑通）。

## 机读收口

- 使用 **`python scripts/validate-regression-report.py <path-to-report.json> --fail-on-no-go`**（及脚本链里与 **`--fail-on-case-not-run`** 的组合）。
- **勿**把本品的 **`report.json` 单独加上 `--require-go`** 当成 **staging 全矩阵 `release_gate: GO`** 的等价物。

## 重跑（仓库根）

有 **`DATABASE_URL`** + 已迁移的本地 Postgres（示例）：

```bash
DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust \
P3_CHAIN_OFF=1 \
bash scripts/gates/local-verify-r002-prereport-chain.sh
```

或段 3 预链包装：

```bash
DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust \
P3_CHAIN_OFF=1 \
bash scripts/gates/vertical-slice-tt9627-segment3-r002-prereport-chain.sh
```

无 **`DATABASE_URL`** 时链脚本只做 **Python 编译 + 软校验**（锚位可能 **NOT_RUN**），见 **`local-verify-r002-prereport-chain.sh`** 头注释。

## 口径对齐

- **[TT-9627 段 3.3](../../docs/runbook/TT-9627-delivery-order-spine-then-full-site.md)**（ISS-007 与全矩阵分轨）
- **[TT-9628 §0.0.3](../../docs/runbook/TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-report-json-path-convention)**（`report.json` 路径与阶次）
- **[CONTRIBUTING · 禁止假完成](../../CONTRIBUTING.md#no-false-completion)**

- **[engineering/05 · §3 矩阵](../../docs/handbook/engineering/05-本地环境与常用门禁速查.md#hb-eng-05-matrix)**（ISS-007 / 本地 R-002 预链行）

阶次：**① 本地**；**② 测试网 / ③ 生产** 的 **GO** 仍以 **R-002 / 96-11 / go-live** 与真实环境证据为准。
