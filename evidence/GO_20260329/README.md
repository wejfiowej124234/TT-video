# GO_20260329 — 机器预检留痕（非发版 Gate 签字包）

**日期**：2026-03-29  
**用途**：复核 `scripts/pre-release-automation.sh`（`check-invariants`、`check-55-s13`、`run-check-04-routes`）与 **`cargo test --workspace`** 在本机/CI 同类环境下的通过情况；与 [15 附录〇](../../docs/spec/15-多维度文档与技术检查报告.md#发版前勾选总表)、[缺口与待补-官方总表](../../docs/spec/缺口与待补-官方总表.md) 核查流水第 5 步互补。

**明确不是**：08-4 / 08-2 签字、P0 十二项闭环、E2E 三项目标环境留痕、forge ABI multiset（本包执行时 **`SKIP_FORGE_VERIFY=1`**）。

**文件**：

| 文件 | 说明 |
|------|------|
| `pre-release-automation-run.log` | `SKIP_FORGE_VERIFY=1 ./scripts/pre-release-automation.sh`（`tee` 落盘） |
| `cargo-test-run.log` | `cargo test --workspace`（`tee` 落盘；291 api + 21 core tests） |
| `manifest.json` | 产物清单 + sha256（[evidence/README](../README.md) 格式） |
| `manifest.sha256` | `manifest.json` 的 SHA256 单行 |

校验：`sha256sum -c manifest.sha256`（或等价）应对 `manifest.json` 再算一遍比对。
