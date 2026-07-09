# B-477 PG pool stress / recovery — FAIL

- **Verdict**: FAIL
- **Threshold hits**: http_error_ratio:0.5000>0.02, recovery_timeout_sec:300.0
- **Recovery**: None ms (null = timeout)
- **Report**: `report.v1.json`
- **Seal**: skipped

## Minimal fixes

- 恢复超时：压测后池未回落至目标利用率——检查是否有后台任务持连接或 PG 侧锁等待。
- HTTP 错误率过高：先确认 API 健康与超时配置，再重复压测。
