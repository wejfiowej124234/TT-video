# 阶段一 · TravelTrust v6 本地烟测（① · PH-1 窄切片）

**阶段：** ① 本地（不宣称 ②③）  
**闸戳：** `last-local-gate-*.txt`

| # | 项 | 机读 | 人眼 |
|---|-----|------|------|
| 1 | `traveltrust-ph1-homepage-local.sh` vitest + page_brief | [x] | — |
| 2 | `TRAVELTRUST_PH1_E2E=1` home（含 PH1-HOME-02 行程提交） | [x] 8 pass / 1 skip offline-down | — |
| 3 | `TRAVELTRUST_PH1_VISUAL=1` | [x] 7/7 | — |
| 4 | `TRAVELTRUST_PH1_VERIFY_SCREENSHOTS=1` | [x] `verify/*.png` | **待** 150～158 |
| 5 | `TRAVELTRUST_PH1_LIGHTHOUSE=1` | [x] perf 0.32 / a11y 0.97（dev LCP 高，仅旁证） | — |
| 6 | `TRAVELTRUST_PH1_E2E_FULL=1` pi1 全量 | [ ] **partial** 26/33（已修台账选择器；建议本地再跑一轮） | — |

维护者：________　日期：________


## 2026-05-19 合一全闸

- `TRAVELTRUST_PH1_E2E=1 E2E_FULL=1 VERIFY_SCREENSHOTS=1 VISUAL=1` → exit 0
- stamp: `last-local-gate-20260519T074726Z.txt`
- verify: 10 PNG
- 人眼: [`human-verify-checklist.md`](human-verify-checklist.md) 待签
