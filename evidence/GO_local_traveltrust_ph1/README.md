# /traveltrust v6 · ① 本地 PH-1 证据目录

**阶段：** ① 本地（不宣称 ②③ 或融资级首屏签字）

## 推荐命令

```bash
bash scripts/gates/traveltrust-ph1-homepage-local.sh
TRAVELTRUST_PH1_E2E=1 bash scripts/gates/traveltrust-ph1-homepage-local.sh
TRAVELTRUST_PH1_E2E=1 TRAVELTRUST_PH1_E2E_FULL=1 bash scripts/gates/traveltrust-ph1-homepage-local.sh
cd frontend && npx playwright test e2e/traveltrust-hero-visual-regression.spec.ts --update-snapshots
cd frontend && npm run lighthouse:traveltrust
```

成功跑闸后写入 `last-local-gate-*.txt`。

台账：docs/runbook/issues-phase1-ui-ux-traveltrust-v6.md

## 可选环境变量

| 变量 | 前置 | 作用 |
|------|------|------|
| `TRAVELTRUST_PH1_E2E=1` | Next :3012 | home 预检/提交/190-191 + offline-api |
| `TRAVELTRUST_PH1_E2E_FULL=1` | :3012 + API :8080 | 全量 `e2e:pi1-traveltrust` |
| `TRAVELTRUST_PH1_VISUAL=1` | :3012 + API :8080 | `traveltrust-hero-visual-regression`（须先有 snapshots） |

生成 182 基线：`cd frontend && npx playwright test e2e/traveltrust-hero-visual-regression.spec.ts --update-snapshots`
