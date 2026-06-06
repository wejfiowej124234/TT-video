# L5 视觉收口 · 机读回归（① · 2026-05-21）

**批次**：`TT-HERO-L5-VISUAL-CLOSURE-2026-05`

## Vitest（本地 · exit 0）

```bash
cd frontend && npm run test -- traveltrustHeroL5LabelPick traveltrustHeroL5FinalPolish traveltrustHeroGlobeBrighten traveltrustHeroP3DecorNodes
```

| 套件 | 结果 |
|------|------|
| `traveltrustHeroL5LabelPick` | 3/3 PASS |
| `traveltrustHeroL5FinalPolish` | 3/3 PASS |
| `traveltrustHeroGlobeBrighten` | 5/5 PASS（地球 1.30 未动） |
| `traveltrustHeroP3DecorNodes` | 2/2 PASS |

## Playwright `e2e:hero-globe-closure`（2026-05-21 · **10/10 PASS**）

前置：`npm run clean && npm run dev:webpack`（3012）→ `PLAYWRIGHT_REUSE_FE_SERVER=1 npm run e2e:hero-globe-closure`

| 轨 | 探针 | 结果 |
|----|------|------|
| **P0** | `traveltrust-hero-p0-globe-acceptance` | PASS |
| **P1** | `traveltrust-hero-p1-linkage`（桌面全链 + 移动 roster） | PASS |
| **P2** | `traveltrust-hero-p2-theater` + `traveltrust-start-corridor-p2` | PASS（closure 含 P2） |
| **P3** | `traveltrust-hero-p3-network-decor` | PASS |

**探针稳定性修复（无视觉参数改动）**：`waitTraveltrustHeroP3Ready` · P3 读 `data-*-node-count` 元数据 · P1 CTA dock 断言 prefill（非 focus）· 针脚 globe-bound 坐标 · Playwright `webServer` → `dev:webpack`

**本批探针断言变更**（`traveltrust-hero-p3-network-decor.probe.spec.ts`）：

- `labelCount` 上限 10 → **4**
- 新增 `data-tt-traveltrust-hero-l5-label-max` / `label-rendered` / `visual-closure`
- focus `cn` 后 `labelCount` 仍 ≤ 4

## 目视

`npm run clean && npm run dev:webpack` → `/traveltrust` 硬刷新。
