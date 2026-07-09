# HAT-R1 · step-00-preflight · 五层证据 · L1 页面截图

**验收标准（每步必齐）：** 页面展示 → 钱包签名 → 链上事件 → API 返回 → 数据库状态

| 层 | 本目录文件 |
|----|------------|
| L1 页面 | `screenshots/`（本 README 下方命令） |
| L2 钱包 | `tx-*.json` · `receipt-*.json` |
| L3 链上事件 | `events-*.json` |
| L4 API | `api-*.json` · `api-*-meta.json` |
| L5 DB | `db-snapshot.sql`（需 `DATABASE_URL`） |

在 `:3012` 前端运行期间执行：

```bash
node scripts/dev/capture-hat-r1-screenshots.mjs --step step-00-preflight --out /d/TravelTrust-V1.1/evidence/GO_hat_r1_sepolia/20260616T063612Z/step-00-preflight/screenshots
```

或人工截图保存至 `/d/TravelTrust-V1.1/evidence/GO_hat_r1_sepolia/20260616T063612Z/step-00-preflight/screenshots/`（PNG · 含 URL 栏与时间戳）。
