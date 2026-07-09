# GO_20260518 · 十日首发证据包（阶段一 · ① 本地）

| 项 | 值 |
|----|-----|
| **D0 起始日** | 2026-05-18 |
| **模式** | 单人 · 阶段一无 CI · TravelTrust v6 首页 PI-1 |
| **Git tip** | `dd52fe246d237b4f203a178a3ea3d9be6e626ab8` |

## 问题清单（PI-1）

| 文件 | 说明 |
|------|------|
| [issues-phase1-local.md](issues-phase1-local.md) | **闭卷表**（P0 全 closed） |
| [issues-phase1-ui-ux-traveltrust-v6.md](issues-phase1-ui-ux-traveltrust-v6.md) | v6 明细 |
| **docs SSOT** | docs/runbook/issues-phase1-local-traveltrust-v6.md · TT-PH1-TRAVELTRUST-V6-HOMEPAGE-AUDIT-001.md |

## ① 验收

```bash
cd frontend && npm run media:traveltrust-tier1
cd frontend && npm run test -- --run app/traveltrust/ lib/analytics.test.ts
cd frontend && npx playwright test e2e/pi1-traveltrust-offline-api.spec.ts
# API 起后: npm run e2e:pi1-traveltrust
```

- [x] issues-phase1-local P0 closed
- [ ] local-smoke 手验
- [ ] phase-signoff PH-1 签字
