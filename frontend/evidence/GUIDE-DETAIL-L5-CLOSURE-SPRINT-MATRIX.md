# Guide Detail L5 Closure Sprint · Matrix

**Program ID:** `guide-detail-l5-closure-sprint-20260608`  
**阶段口径：** ① 本地 → Soak / Token Debt / 真人 UAT  
**通过标准：** 首次游客 **3 秒**内理解 — **是否适合我 · 为何可信 · 如何预约**  
**机读 SSOT：** `frontend/lib/l5/guideDetailL5ClosureSprintModel.ts` · `guideDetailL5Closure.contract.test.ts`  
**UI 状态：** **冻结**（`data-tt-guide-detail-l5-closure="consumer-grade"` · `data-tt-ui-frozen="guide-detail-l5-closure-20260608"`）

---

## 3 秒 clarity

| 问题 | 页面回答 | SSOT key / 探针 |
|------|----------|----------------|
| 这位向导是否适合我？ | Hero：城市 · 语言 · 专长 · 评分/完成单/响应（有则显） | `guide_detail_hero_signals_aria` |
| 为什么可信？ | 平台认证 + 消费者信任段 | `guide_detail_didVerified` · `guide_detail_consumer_trust_body` |
| 下一步如何预约？ | 一步提示 + 主 CTA | `guide_detail_conversion_next` · `guide_card_book` |

---

## Findings（7/7 ✅）

| ID | 严重度 | 问题 | 修复 |
|----|--------|------|------|
| GD-L5-P0-01 | P0 | 档期 intro 含托管/API/同源 | 消费者 intro |
| GD-L5-P0-02 | P0 | 分区标题 uppercase 金标 | `GUIDE_DETAIL_SECTION_LABEL_CLASS` = drawer meta |
| GD-L5-P1-01 | P1 | Hero 缺决策信号 | 评分/完成单/响应 + 语言/专长 |
| GD-L5-P1-02 | P1 | 空介绍无转化 | `guide_detail_bioEmpty` + 预约后沟通 |
| GD-L5-P1-03 | P1 | 三个月日历占屏 | 默认本月 + 查看完整档期 |
| GD-L5-P1-04 | P1 | 占用区间 ops 标签 | 消费者视图移除 |
| GD-L5-P1-05 | P1 | 信任段提运营审核 | 消费者信任 copy |

---

## 冻结范围

- `app/guides/[id]/GuideDetailPageLoaded.tsx`
- `components/guides/GuideOccupiedScheduleBlock.tsx`
- `app/guides/[id]/guideDetailPageConstants.ts`
- 相关 locale keys（`GUIDE_DETAIL_L5_LOCALE_KEYS`）

**禁止：** 新增业务功能 · 改预约/档期 API · 改路由结构
