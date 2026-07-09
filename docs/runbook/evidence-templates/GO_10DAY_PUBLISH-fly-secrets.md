# Fly secrets 清单（B-12）

对照仓库根 **`.env.example`**。secrets **名**入 Fly；**值不入 Git**。

| 变量 / secret | staging (`tt-api-staging`) | preprod | prod | 备注 |
|---------------|---------------------------|---------|------|------|
| `DATABASE_URL` | [ ] | [ ] | [ ] | ≠ 本地 ① |
| `INTERNAL_API_SECRET` | [ ] | [ ] | [ ] | |
| `TRAVELTRUST_STRIPE_*` | test | test | **live** | |
| `TRAVELTRUST_STRIPE_WEBHOOK_SECRET` | [ ] | [ ] | [ ] | Dashboard 与 Fly URL 一致 |
| `RESEND_*` / 邮件 | [ ] | [ ] | [ ] | |
| `CHAIN_RPC_URL` / 链 | [ ] | [ ] | [ ] | **S-01** 无 Mainnet 则填测试链 |
| （按需补行） | | | | |

`fly secrets list -a <app>` 截图或导出路径：________________

复核人签字：________________　日期：________________
