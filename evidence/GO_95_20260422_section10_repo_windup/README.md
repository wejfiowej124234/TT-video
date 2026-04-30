# GO_95 — §10 仓库收尾（对拍 · 2026-04-22）

**95**：[§10](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md#10-仓库收尾文档对齐--脚本对齐--汰旧--终验洁净可跑通) **§10.1～§10.5**（**Q=22**；**§0.2** 现表 **12/22 `[x]`**；本包成稿时 **9/22** 叙述见下表脚注）。

## §10.1 全仓库文档对齐 — **5/5 `[x]`（机读+台账同批；非全 spec 人读）**

| 行 | 证据 |
|----|------|
| **00 与 spec 同步** | 本更 **与 [00-文档索引](../../docs/spec/00-文档索引.md) 表内 **95** 行** **台账同批**（**v1.4.88**）；**不**表示 **docs/spec 全量** 已逐篇审阅。 |
| **04↔api.ts↔95§3↔93** | **`python scripts/gates/check-04-api-ts-routes-vs-doc-34.py`** **exit 0**（**178** 路径，与 **§7.3** 同链）；**`bash scripts/run-check-04-routes.sh` exit 0**；**不**替代 **能力承诺** 业务终验/§8.2 行完成。 |
| **环境样例** | **[08-5](../../docs/spec/08-5-CI与一致性落地说明.md) §1** 表行 **「环境变量示例 → `.env.example`」**；**`wc -l .env.example` → 475**、**`frontend/.env.example` 114**；**CHAIN_ID / NEXT_PUBLIC_*** 等互指 **14/Runbook** 叙事。 |
| **07 版本三线** | **`bash scripts/check-07-version-triple.sh` exit 0**（**`OK: 07 version triple aligned (1.0.858).`**）。 |
| **27-archived / snapshots** | **[27-archived/README](../../docs/spec/27-archived/README.md)**：历史 **migrations** 路径、**Discover→/market** 口径已 **标注现行 SSOT**；**[snapshots/README](../../docs/spec/snapshots/README.md)**：时点稿、**`api_router` merge** 以 **routes/mod.rs/04/07** 为准；**不**逐篇扫 **snapshots/** 正文。 |

## §10.2 全仓库脚本对齐 — **5/5 `[x]`（含 v1.4.30 首条 + v1.4.131「或·前置」+ v1.4.137 archive/stale bounded）**

| 行 | 结果 | 说明 |
|----|------|------|
| CI / package.json → scripts | **`[x]`**（历史） | 见 **§10.2** 正文 **v1.4.30** 与 **`…script_paths_audit/README.md`**。 |
| Runbook / 08-5 **clean clone** **或** 前置文档 | **`[x]`**（**「或」**） | **[08-5 §2.1](../../docs/spec/08-5-CI与一致性落地说明.md#clean-clone-prereq)** + **`…section10_2_runbook_prerequisites/README.md`**（**v1.4.131**）；**不**表示裸 **Runbook/go-live** 全矩阵 **`exit 0`**。 |
| 弃用 → **scripts/archive/** | **`[x]`**（**bounded**） | **`…section10_2_archive_stale_gate/README.md`**（**v1.4.137**）：**目录 absent** + **四文件** **`scripts/archive/`** 字面 **0**；**不**扫 **全 `docs/spec`**。 |
| **Windows / Bash 同源** | **`[x]`** | **`find scripts -name '*.ps1' | wc -l` → 96**（**Git Bash**）；与 **`run-check-04-routes.ps1`/`check-07-version-triple.ps1`** 等主门禁 **.sh 同题** 并存；**不**证「每一脚本 100% 行级等价」。 |
| 脚本中无真实 **token** | **`[x]`**（抽样） | **`scripts/**/*.py`** 对 **`[REDACTED]`**/**占位** 表述（**`r003_*.py`** 等）；**不**作密钥扫描厂商级审计。 |

## §10.3 / §10.4 — **仍 `0/8`（`[ ]`）**

- **10.3～10.4**：**未**做 **全仓 TODO 分流**、**已删文导航**、**旧 env 名** 全量 grep、**重复 spec** 合并裁决；**保持 `[ ]`**。

## §10.5 终验 — **1/4 `[x]`（狭义 API 构建·测编译）**

| 行 | 结果 | 说明 |
|----|------|------|
| DB **docker compose** | **`[ ]`** | **本包未** 起 **Postgres 容器** 实跑 **migrations**。 |
| **API 绿** | **`[x]`**（狭义） | **`cargo build -p traveltrust-api` exit 0**；**`cargo test -p traveltrust-api --no-run` exit 0**；**不**含 **`cargo test` 全量执行** 绿 / **生产矩阵**。 |
| **前端 `npm run build`** | **`[ ]`** | **`cd frontend && npm run build` exit 1**（**2026-04-22**）：**`useSearchParams()`需 Suspense**（**/admin/internal-tools/audits** 等）+ **`/community/feedback` prerender** 失败；**见 CI 与 §9·ISS-007 主链** 对读。 |
| **一条 E2E / 93 子集** | **`[ ]`** | 见 **ISS-007** / **§8.2 行完成**。 |

## 与 **§0.2** 计数

- **本包成稿（v1.4.88）**：**P**：**1 → 9**；**K**：**9/22**；**Q**：**22** 不变；**总完成度 %**：**34**（**K=9/22**）。  
- **95 现表（v1.4.137+）**：**P=12**、**K=12/22**、**总 %=39** — 以 **[95 §0.2](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md#02-填写区每次全量回归后更新)** 为准。
