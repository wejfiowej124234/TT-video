# GO_95 · §10.3-3 · `@deprecated` API 与 **04**（有界对拍 · 2026-04-22）

## 1. 定位

对应 **《95》§10.3** 第三行：**`deprecated` API** — 保留期、迁移路径与 **04** 一致或已移除。

本包为 **有界 `[x]`**：**①** 全量枚举当前仓库 **`frontend` `*.ts`/`*.tsx`** 之 **`@deprecated`**（**`crates`** **`#\[deprecated\]`** **0**）；**②** 每条均有 **JSDoc 内迁移/兼容说明**；**③** 与 **[14-合约-API-ABI-前后端对齐](../../docs/spec/14-合约-API-ABI-前后端对齐.md)** / **[04-后端与API](../../docs/spec/04-后端与API.md)** 做 **锚点级** 对读（**非**逐符号 **04 §3.4** 表行审计）；**④** **`run-check-04-routes.sh` exit 0**。

**诚实边界**：**不**写 **日历保留期**（月/季度）；**不**承诺 **下一 major** 必删；**不**替代 **C-4** 全 **`api.ts`**/**页面** 导出审计。

## 2. 机读：`@deprecated` 清册（**9** 处 · **6** 文件组）

| 文件 | 行约 | 摘要 |
|------|------|------|
| `frontend/lib/stakingAbi.ts` | ~99 | `erc20DecimalsAbi` → **`erc20TokenAbi` + `decimals`** |
| `frontend/lib/cityDetails/attractions.ts` | ~262 | 旧详情 API → **`ATTRACTIONS_DETAILS_BY_CITY` + `getAttractionDetails`** |
| `frontend/locales/en.ts` | ~4719 | i18n **键名保留**；UI 见 **`auth_reset_token_help`** |
| `frontend/locales/zh.ts` | ~4609 | 同上 |
| `frontend/components/me/communityMeNotes/CommunityMeNotesPostThumbGrid.tsx` | ~34 | UI → **`cardMenu`** |
| `frontend/components/market/CustomItineraryModal/itinerarySubmitLogic.ts` | ~16 | 类型别名 → **`LocaleTranslateFn`** |
| `frontend/components/market/CustomItineraryModal/types.ts` | ~26–44 | **`GuideDayPlan`** 与字段：历史/持久化 **兼容**；平台化后字段保留 |

**Rust**：**`#\[deprecated\]`** 于 **`crates/**/*.rs`** — **0**（与 **`…section10_3_legacy_cleanup_audit`** 一致）。

## 3. **04 / 14** 锚点级对读（非穷举）

- **质押 ABI**：**[14](../../docs/spec/14-合约-API-ABI-前后端对齐.md)** 表/正文写明 **`frontend/lib/stakingAbi.ts`**（**`identityStakingPoolAbi`** 等）为 **viem 镜像**；本条 **`@deprecated`** 仅指向 **同箱** **`erc20TokenAbi`** 读 **`decimals`** — **不**与 **14** 冲突。
- **自定义行程 / 56**：**[04](../../docs/spec/04-后端与API.md)** **`POST /api/v1/itineraries/custom`** 叙述 **day_plans**/**guide_day_plans** 与 **52/56** 统一结构；**`types.ts`** 中 **`GuideDayPlan`** 标 **兼容历史持久化** — 与 **04**「扩展字段 / hydrate」语义 **相容**（**不**要求 **04** 逐字段列出 **`vehicleImage`** 等旧名）。

## 4. 契约闸

```bash
bash scripts/run-check-04-routes.sh
# → exit 0（登记时复跑）
```

## 5. 与 **§10.3** 余行

- **§10.3** 末行 **Feature flag / 死开关** → **v1.4.142** **`evidence/GO_95_20260422_section10_3_feature_flag_dead_branch_bounded/README.md`**（**§10.3** 四子条 **全 `[x]`**）。
- **§9**：本轮 **未**新立 **ISS-**。
