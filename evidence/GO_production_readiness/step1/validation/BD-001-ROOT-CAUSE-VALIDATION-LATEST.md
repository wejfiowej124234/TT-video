# BD-001 · Sprint A Validation

| **Validation** | **PENDING** |
| **Case** | — |
| **Consecutive PASS** | 0 / 3 |

Step 1 · 仅配置一条正确的 Guide Availability（staging）· 不改 Pricing/HAT/其它数据

## Next Steps

- 配置 Availability 后重跑本脚本
- Case A: Avail+Pricing PASS → 进入 Step 2 连续 3 次验证

```bash
node scripts/dev/run-root-cause-validation-bd001.cjs
```
