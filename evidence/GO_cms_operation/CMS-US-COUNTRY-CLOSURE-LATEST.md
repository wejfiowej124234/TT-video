# USA Country CLOSED

**Recorded:** 2026-07-06T12:55:50.038Z
**TT_CMS_US_COUNTRY:** `CLOSED`
**Phase:** ② staging · **Next country:** BLOCKED · **Production GO:** BLOCKED

## 四城 Content QA + Runtime

| 城市 | POI | LOCK | Exec | Content QA | City Runtime | Live Runtime | Catalog |
|------|-----|------|------|------------|--------------|--------------|---------|
| 旧金山 | 8 | 8/8 | PASS | CLOSED | FAIL | 8/8 | 8/8 |
| 拉斯维加斯 | 7 | 7/7 | PASS | CLOSED | FAIL | 7/7 | 7/7 |
| 洛杉矶 | 8 | 8/8 | PASS | CLOSED | FAIL | 8/8 | 8/8 |
| 纽约 | 10 | 10/10 | PASS | CLOSED | FAIL | 10/10 | 10/10 |

## Country criteria

- PASS 所有 City Execution CLOSED
- PASS Content Accuracy = 100%
- PASS Runtime Consumer = CMS
- PASS Geo Matching = 100%
- PASS L5 Visual = PASS
- PASS Cross-region Images = 0
- PASS Unsplash = 0（CMS 管辖 POI 范围）
- PASS OCS Runtime = 0（CMS 管辖 POI 范围）
