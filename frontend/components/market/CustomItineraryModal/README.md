# CustomItineraryModal

自由市场：自定义行程弹窗。先选总天数与国家，再按天选城市→景区→美食→酒店，确认后作为新订单出现在市场。支持「游客创建」与「向导创建」两种模式。

## 入口与对外

- **入口**：`index.tsx`（组合 useItineraryForm、角色切换、TouristForm/GuideForm、详情浮层、底部按钮）
- **对外**：`import CustomItineraryModal from "@/components/market/CustomItineraryModal"`
- **类型导出**：`TransportType`、`CityTransportType`、`GuideLevel`、`DayPlan` 由 `index.tsx` 再导出，与 42-自定义行程弹窗 实现位置一致

## 目录职责

| 文件/目录 | 职责 |
|-----------|------|
| `index.tsx` | 弹窗壳、角色切换、挂载 TouristForm/GuideForm、4 个详情浮层、底部按钮 |
| `constants.ts` | 天数/交通/向导选项、价格常量、校验上限 |
| `types.ts` | DayPlan、GuideDayPlan、CustomItineraryForm、TouristFormProps、GuideFormProps |
| `utils.ts` | sanitizeDecimalInput |
| `useQuoteCalculation.ts` | 报价/预算派生（budgetBreakdown、guideQuoteBreakdown 等） |
| `useItineraryForm.ts` | 表单 state、setDayPlan/setGuideDayPlan、handleSubmit、useEffects |
| `DetailOverlay.tsx` | 景区/美食/车辆/酒店点击后的大图+介绍浮层 |
| `sections/TouristForm.tsx` | 游客分支：按天卡片、报价清单、标题/预算/人数/描述/封面 |
| `sections/GuideForm.tsx` | 向导分支：按天卡片（上传+文案）、服务费与交通、报价清单、元信息 |

## 依赖方向

- index → useItineraryForm、sections、DetailOverlay、constants、types
- sections → types、constants、utils、GlassSelect、lib（geoOptions、cityDetails）
- useItineraryForm → useQuoteCalculation、types、constants、lib（apiClient、geoOptions）
