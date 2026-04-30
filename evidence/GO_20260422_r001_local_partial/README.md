# R-001 · `report.json`（local · PARTIAL_GO · 2026-04-22）

## 用途

- **诚实子集**：`report.json` 仅含 **12** 条 **`cases[]`**，指向已落盘的 **GO_95** 证据 README；**不**声称 **93 全矩阵 PASS**。
- **机读闸**：`python scripts/validate-regression-report.py evidence/GO_20260422_r001_local_partial/report.json` → **exit 0**（**`release_gate=PARTIAL_GO`**）。

## ISS-007（未闭）

- **`main`** 上 **`build.yml`** 最近 **15** 次抽样中 **`e2e` job` 均为 `failure`**。
- **§8.2** **93 / E2E / 行完成** 与 **§3.1** **仍不得**仅凭本 `report.json` 勾闭。

## 文件

- **`report.json`**：R-001 **`schema_version: "1"`**。
