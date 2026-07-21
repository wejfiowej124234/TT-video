# Reality-W3 · GDPR / DSAR 路径说明

**STATUS:** ACTIVE · Path proven · 全自动硬删除/完整导出包仍可分期  
**Machine key:** `TT_REALITY_W3_GDPR_PATHS`  
**PCR:** `PCR-USER-GDPR-EXPORT` · `PCR-USER-GDPR-DELETE`

## 现行路径（②）

| 路径 | 说明 | 验收 |
|------|------|------|
| A · 用户发起 | `/me` 设置 → 支持反馈票请求删除/导出（UI 明示非自助硬删） | 文案可达 |
| B · Admin DSAR 台账 | `GET /api/v1/admin/compliance/data-requests` | 列表 200 |
| C · 状态推进 | `POST …/data-requests/:id/update`（SuperAdmin · 乐观锁） | 事件轴追加 |
| D · 事件轴 | `GET …/data-requests/:id/events` | 可检索 |

## 非本 Wave 关闭（诚实）

- 用户自助硬删除 API（PRG-U01）  
- 全自动完整导出包 + 签名归档 SLA（PRG-U02 → ②/③）  

W3 验收 = **路径存在且 Admin 台账可干跑**；完整自动化属后续 PCR，**禁止**用本页冒充 C-09/生产合规证明。
