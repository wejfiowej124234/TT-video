# POI 配图人工验收证据目录

机读 SSOT：`frontend/lib/cityDetails/poiImageVerification/`

| 路径 | 用途 |
|------|------|
| `poiImageCandidates.ts` | 候选清单（PENDING / REJECTED / APPROVED） |
| `poiImageWhitelist.ts` | **仅人工确认后**写入的固定 URL |
| `poiImageWhitelist.contract.test.ts` | 已验收 POI 长期锁死测试 |

流程说明：`docs/runbook/POI-IMAGE-VERIFICATION-SPRINT.md`
