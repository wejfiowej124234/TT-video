# B-472 · 子证据包清单（发布级索引）

**规则**：下列路径为 **B-472** **汇总** **所引** **真源**；子包更新时 **须** **同步** **本清单** **日期** **注** **或** **Runbook** **§** **修订** **记录**。

| 母表 | 目录 / 文档 | 说明 |
|------|-------------|------|
| B-458 | [`evidence/b458_tt_u01_tourist_register_login_e2e/`](../b458_tt_u01_tourist_register_login_e2e/) | TT-U01 · 注册 / 登录 / `me` / reload |
| B-459 | [`evidence/b459_tt_u02_tourist_place_order_e2e/`](../b459_tt_u02_tourist_place_order_e2e/) | TT-U02 · 下单 E2E |
| B-460 | [`evidence/b460_tt_u03_order_lifecycle_review_e2e/`](../b460_tt_u03_order_lifecycle_review_e2e/) **+** **[`evidence/b473_seal_b460_tt_u03/`](../b473_seal_b460_tt_u03/)** | TT-U03 · 生命周期 + 评价；**封口** **见** **`TT-B473`** **`b473-seal-*`** |
| B-463 | [`docs/AI任务卡索引.md`](../../docs/AI任务卡索引.md) **#tt-doc-b463-**… | TT-DOC-B463 · 87/30/04 附录对齐（**文档**） |
| B-465 | [`evidence/b465_bilateral_review_ui_e2e/`](../b465_bilateral_review_ui_e2e/) | 双边 UI 评价可见 |
| B-467 | [`evidence/b467_full_ui_order_journey_e2e/`](../b467_full_ui_order_journey_e2e/) | 全 UI 主旅程（`/orders/new` 起点） |
| B-468 | [`evidence/b468_market_entry_full_journey_e2e/`](../b468_market_entry_full_journey_e2e/) | `/market` 发现 → 建单 → 履约 |
| B-469 | [`evidence/b469_guides_drawer_booking_e2e/`](../b469_guides_drawer_booking_e2e/) | 抽屉 + `/guides/[id]` 与 B-468 收敛 |
| B-470 / B-471 | [`docs/runbook/TT-B472-TOURIST-P0-JOURNEY-CLOSEOUT-BUNDLE-001.md`](../../docs/runbook/TT-B472-TOURIST-P0-JOURNEY-CLOSEOUT-BUNDLE-001.md) **§3.1**；[`frontend/lib/guideDisplayName.ts`](../../frontend/lib/guideDisplayName.ts) | 数据链核对 + `formatGuideDisplayName` 单点真值 |
| **本包** | [`pass_fail.md`](./pass_fail.md) | 统一总表与总判 |

**相关 Runbook（非证据目录）**：[`TT-U01`](../../docs/runbook/TT-U01-TOURIST-REGISTER-LOGIN-E2E-001.md) · [`TT-U02`](../../docs/runbook/TT-U02-TOURIST-PLACE-ORDER-E2E-001.md) · [`TT-U03`](../../docs/runbook/TT-U03-ORDER-LIFECYCLE-COMPLETE-REVIEW-E2E-001.md) · [`TT-B473`](../../docs/runbook/TT-B473-SEAL-B460-TT-U03-001.md)
