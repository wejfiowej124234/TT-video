# B-477 PG pool stress / recovery — FAIL

- **Verdict**: FAIL
- **Threshold hits**: recovery_timeout_sec:120.0
- **Recovery**: None ms (null = timeout)
- **Report**: `report.v1.json`
- **Seal**: skipped

## Minimal fixes

- 恢复超时：压测后池未回落至目标利用率——检查是否有后台任务持连接或 PG 侧锁等待。
