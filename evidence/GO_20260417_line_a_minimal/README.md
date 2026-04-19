# GO_20260417_line_a_minimal



**目的**：线 A（`FeeRouter` + `GET /meta` + 分轨 A/B）最小证据包；与 **[Runbook §7.1 · 线 A](../../ops/RUNBOOK.md#line-a-feerouter-pass)** 同源。



**状态**：✅ **已在真实环境跑通**（Sepolia + 本机 API，`artifacts/capture.log` + `artifacts/CONCLUSION.md`）。复现：根 `.env` 设 `PORT`/`API_BASE_URL`（与 `frontend/.env.local` **`NEXT_PUBLIC_API_BASE_URL`** 及 Next rewrites 同源；本包 **`CONCLUSION.md`** 使用 **`API_BASE=http://127.0.0.1:3012`** 重跑），启动 `traveltrust-api`（`DATABASE_URL` + `CHAIN_RPC_URL` + 七键 + `SEED_TEST_ACCOUNTS=1`），再 **`API_BASE=http://127.0.0.1:<PORT> bash artifacts/run_line_a_validation.sh`** 覆盖 `capture.log`（脚本会 **source 仓库根 `.env`** 以跑 Step 3 **`cast`**）。

### 测试网当前版本 · 对外口径

测试网当前版本已完成最新真值统一：运行时入口统一到 3012，/meta 正常，线 A 已在最新环境下重跑通过，B-434 当前裁断已升级为 v3；后续只剩 Treasury.spend 专用治理路径与更完整前端联调待补证据。

（与 **[线 B 清单 · 对外口径](../../docs/runbook/TT-LINE-B-GOVERNANCE-EXECUTION-CHECKLIST.md#testnet-acceptance-2026-04-17)**、**[Runbook · 测试网当前版本](../../ops/RUNBOOK.md#testnet-acceptance-one-liner-2026-04-17)** 同源。）



**注意**：`GET /meta` 在 **根路径** `/meta`，**不是** `/api/v1/meta`。



**内容**：



| 路径 | 说明 |

|------|------|

| [artifacts/run_line_a_validation.sh](artifacts/run_line_a_validation.sh) | 一键：Step 1～5（含种子登录治理只读路由） |

| [artifacts/capture.log](artifacts/capture.log) | 最近一次完整 stdout |

| [artifacts/CONCLUSION.md](artifacts/CONCLUSION.md) | PASS（线 A）六条判定 |

| [artifacts/api_smoke.log](artifacts/api_smoke.log) | 可选：API 进程日志（补跑时生成） |


