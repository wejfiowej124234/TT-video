# GO_20260507 · TT-96-20 Appendix E bundle（①）

本目录 CSV 由 **`bash scripts/tt-96-20-appendix-e-generate-machine-stub.sh --bundle --out-dir evidence/GO_20260507`**（或 **`python scripts/gates/tt-96-20-appendix-e-generate-machine-stub.py --bundle --out-dir …`**）生成。

| 文件 | 说明 |
|------|------|
| **`round-r1-appendix-e.csv` … `round-r9-appendix-e.csv`** | 按 **[TT-96-20 附录 G](../../docs/runbook/TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-g)** 路径启发式分桶（**非**人工定稿）。 |
| **`round-r1-9-merged.csv`** | **`merge.py`** 并集；应对 **`validate.py --strict-pass-controls --require-controls-tag --strict-b-axes --require-key-api-signal`** **exit 0**。 |
| **`round-appendix-e-enriched-all.csv`** | 单文件全量（与 merged 行集合等价，idx 为全局 1..123）。 |

**诚实边界**

- **`matrix:96-20:auto:*`** 为机读占位，**须**在对读 **96-20 / 93** 后替换为文档矩阵真锚（**§0.3.3**）。
- **`status_93=NOT_RUN`**：在有人类手验 / E2E 结论前**不**改为 **PASS**（禁止假完成）。
- **`playwright_ref`** 为每桶默认指针；逐页仍应细化。
- **②③**、**TT-GATE** 全文、**每 DOM 已点**：**不**因本 bundle 而闭合。

**Cursor / 索引**：根目录 **`.cursorignore`** 已对 **`evidence/**/round-*-appendix-e.csv`** 等做 **`!` 反选**；若 IDE 仍无法 `@` 引用该目录，**重载窗口**后再试。

---

## 优先级下一步（机读闭包之后 · ①）

**已达成（机读）**

- **`cargo test -p traveltrust-api`**（① 基线）：**1247 passed**；**0 failed**（本地单次）。

- **`round-r1-9-merged-spec-matrix-codebacked.csv`**：`fill-controls-from-source` → **validate**（`strict-pass-controls,require-controls-tag,strict-b-axes,require-key-api-signal`）→ **`audit-controls-vs-source --strict`** 串联 **exit 0**。
- **行数**：123；**`tt:shell-only`**：8（其余路由目录内已有 **`data-tt-*`**）。
- **`matrix:96-20:auto:*`** / **`MISSING`**：当前 merged-spec-matrix 路径上为 **0**（真锚仍以 **96-20 / 93** 人工对读为准）。

**仍未闭合（须证据，禁止假完成）**

| 优先级 | 事项 | 说明 |
|--------|------|------|
| **P1** | **`status_93` / `d3_hand`** | 现 **123/123** 为 **`NOT_RUN` / `PENDING`**；仅在手点 **B.2**、相关 **Playwright/Vitest** 或明确 **N/A** 理由后改为 **PASS/SKIP/N/A** 等五态口径（见 **TT-96-20 §0.3.4**）。 |
| **P2** | **E2E 竖切** | 按 **[TT-96-20-E2E-COVERAGE-GAP-MAP §3](../../docs/runbook/TT-96-20-E2E-COVERAGE-GAP-MAP-001.md#tt-96-20-e2e-gap-run)**：`DATABASE_URL` + **`local-delivery-expanded`** → 按需 **`e2e:full-chromium`**；失败项回填 **`gap_issue`**。 |
| **P3** | **8× shell-only** | 确认是否接受为壳页；若该页应有可测控件，在路由目录补 **`data-tt-*`** 后重跑 **`fill-controls-from-source`**。 |
| **P4** | **② 测试网** | **另开**证据链（**TT-9618**），**不得**用本机读结果冒充。 |

**`ten-round-B3-code-controls-summary.md`**：R1～R9 计数与 **shell-only** 列表（**①** 附件）。


---

## L3 · `local-delivery-expanded`（① 全栈真实路径 · 2026-05-07）

**阶次：** **仅 ① 本地**。**不**声称 **② 测试网** / **③ 公网·生产** 已验（与 **[CONTRIBUTING · no-false-completion](../../CONTRIBUTING.md#no-false-completion)**、**[TT-9618](../../docs/runbook/TT-9618-onboarding-local-testnet.md)** 另表）。

**环境：** 根 **`.env`** 含 **`DATABASE_URL`**（已 migrate 的 Postgres）。**Git Bash** 若无法 **`source .env`**（如 **`TRAVELTRUST_RESEND_FROM=Name <email>`** 未加引号）：先 **`source scripts/dev/export-database-url-from-root-env.sh`**，再跑扩充闸（见 **`scripts/dev/export-database-url-from-root-env.sh`** 头注释）。

**已跑命令与结果（可复制）**

```bash
source scripts/dev/export-database-url-from-root-env.sh
bash scripts/gates/local-delivery-expanded.sh
# … 三连 + frontend lint/tsc/test + PublishDrawer Vitest + Playwright（8 文件）
# 末行：OK: local-delivery-expanded ；Playwright 摘要：44 passed
```

**Trust-gate · PG 矩阵（与 Playwright 同源夹具 · 真 DB）**

```bash
source scripts/dev/export-database-url-from-root-env.sh
cargo test -p traveltrust-api matrix_93_b_tg_
# test result: ok. 5 passed; 0 failed
```

**附录 E 机读复验（`tt:` ↔ `data-tt-*`）**

```bash
source scripts/dev/export-database-url-from-root-env.sh
bash scripts/tt-96-20-appendix-e-fill-controls-from-source.sh \
  -i evidence/GO_20260507/round-r1-9-merged-spec-matrix.csv \
  -o evidence/GO_20260507/round-r1-9-merged-spec-matrix-codebacked.csv \
  --summary evidence/GO_20260507/ten-round-B3-code-controls-summary.md
# validate OK + audit strict OK + exit 0
```

**与测试网/公网对齐（变量与路径，非阶次冒充）**

- Playwright 尾段走 **`run-e2e-default.mjs`** 真 **`traveltrust-api` + Next**，**`P3_CHAIN_OFF` / mock-pay** 为后端**真实挂载**的链下入金路径（与 **solo-dev §6.5 · A8**、**TT-96-20** 同源），**不是**用 **`page.route` 伪造 JSON** 顶替 API。
- 预发/生产仍须 **BB2** 独立 **`.env`**（**`DATABASE_URL`、CORS、`AUTH_LOGIN_*` 限流非 0** 等）；本证据**不**替代部署验收。

**CSV `status_93` / `d3_hand`：** 仍为 **NOT_RUN / PENDING** 直至按 **93 / 96-20** 逐页或按域有手验/E2E 结论；**禁止**仅因本闸 **exit 0** 批量改为 **PASS**。

