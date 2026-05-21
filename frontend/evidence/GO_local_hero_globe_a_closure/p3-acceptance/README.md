# P3 验收证据（① · P3-A + P3-B · 精修）

| 文件 | 链路 |
|------|------|
| `01-hero-p3-network-default.png` | 24 光点 + 8 轻量走廊弧 · **6** 核心文字标签 · 右侧一句 lead + 托管三步 |
| `02-hero-p3-focus-cn.png` | focus cn → asia 走廊高亮 · 聚焦时仅高亮核心标签 |
| `p3-hero-report.json` | 机读 state（`labelCount` ≤ 6 · `corridorStrip` 空） |

```bash
cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-hero-p3-network-decor --config=playwright.scene-debug.probe.config.ts
```
