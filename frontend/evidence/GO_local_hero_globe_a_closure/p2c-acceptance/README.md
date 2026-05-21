# P2-C 验收证据（①）

| 文件 | 链路 |
|------|------|
| `01-theater-asia-match-guide.png` | `#start?region=cn&step=match` → `#roles` `corridor=asia` · `active-role=guide` |
| `02-theater-escrow-merchant.png` | Hero CTA → escrow pill → `#roles` `step=escrow` · `merchant` |
| `p2c-theater-report.json` | 机读 state 快照 |

```bash
cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-hero-p2-theater --config=playwright.scene-debug.probe.config.ts
```
