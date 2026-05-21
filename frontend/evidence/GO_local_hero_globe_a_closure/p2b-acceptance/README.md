# P2-B 验收证据（①）

| 文件 | 链路 |
|------|------|
| `01-deep-link-cn-match.png` | `#start?region=cn&step=match` → `corridor=asia` |
| `02-hero-cta-to-start-plan.png` | Hero CTA → `#start?region=&step=plan` |
| `03-step-pill-to-escrow.png` | Start pill → `step=escrow` |
| `p2b-deep-link-report.json` | 深链 state 快照 |
| `p2b-acceptance-report.json` | 全探针末次 state（含 step-pill） |

```bash
cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-start-corridor-p2 --config=playwright.scene-debug.probe.config.ts
```
