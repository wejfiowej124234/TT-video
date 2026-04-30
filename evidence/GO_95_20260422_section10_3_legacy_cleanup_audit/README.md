# GO_95 · §10.3 清理旧代码 — 机读盘点（2026-04-22）

## 1. 定位

**《95》§10.3** 四条仍为 **`[ ]`**。本包为**只读盘点 + 契约闸**，**不**宣称 **§10.3** 已闭；**不**替代 **Owner triage** / **§9 ISS** 排期。

## 2. 机读：`TODO` / `FIXME` / `HACK`（词边界）

**工具**：仓库内 **`functions.grep`**（**Cursor ripgrep**），路径/ glob 如下。

| 扇面 | 模式 | 结果 |
|------|------|------|
| **`crates/api/src/**/*.rs`** | `\bTODO\b` | **0** |
| **`crates/api/src/**/*.rs`** | `\bFIXME\b` | **0** |
| **`frontend/**/*.ts`/`*.tsx`**（不含 **node_modules**） | `\bTODO\b` | **0** |

（**不**扫 **`locales/*.ts`** 内非注释自然语言；**不**扫 **`contracts/`**/**`evidence/`**。）

## 3. 机读：`@deprecated`（前端）

**命中文件（节选）**：

- `frontend/lib/stakingAbi.ts`
- `frontend/lib/cityDetails/attractions.ts`
- `frontend/locales/en.ts` / `frontend/locales/zh.ts`（**i18n 键**保留说明）
- `frontend/components/me/communityMeNotes/CommunityMeNotesPostThumbGrid.tsx`
- `frontend/components/market/CustomItineraryModal/itinerarySubmitLogic.ts`
- `frontend/components/market/CustomItineraryModal/types.ts`（**多条**字段兼容说明）

**结论（v1.4.141 更新）**：**`@deprecated` 清册 + 04/14 锚点有界对拍** 已 **`evidence/GO_95_20260422_section10_3_deprecated_api_04_reconcile/README.md`**；**95 · §10.3** **`deprecated` 行 → `[x]`**（**有界**；**不**逐 **04 §3.4** 符号）。**§10.3** **`dead_code`** 扇面见 **§4**（**v1.4.142** 与 **`…feature_flag_dead_branch_bounded/`** 对读）。

## 4. 机读：`dead_code` / `allow(dead_code)`（Rust API 箱）

**机读合计** **13** 文件、**23** 行 **`#\[allow(dead_code)\]`** / **`#!\[allow(dead_code)\]`**（**`crates/api/src`**；明细见 **`evidence/GO_95_20260422_section10_3_feature_flag_dead_branch_bounded/README.md` §3**）。

**结论（v1.4.142）**：**§10.3** **「Feature flag / 死开关」** 行在 **95** 标 **有界 `[x]`** — **字面 `if/while false` 无命中**；**`allow(dead_code)`** 按证据包判读为 **编译期 unused 抑制**（**非**清单所斥之「**运行时** 永 **`false`** 开关仍占热路径」）。**未**逐符号论证每个被抑制项是否真死。

## 5. 删除模块残留

**v1.4.139**：**有界机读闸**（**`cargo check`/`cargo test --no-run`/`run-check-04`/`npm run lint`**）已落盘 **`evidence/GO_95_20260422_section10_3_bounded_no_dangling_wiring/README.md`** — **§10.3-1** 在 **95** 标 **`[x]`**（**有界语义**）。**未**跑 **rust-analyzer unused** / **eslint unused-imports 全仓**；**大删模块 PR** 仍须 **Owner** 复跑该证并更新路径日期。

## 6. 契约闸（防文档编辑破坏路由窗）

```bash
bash scripts/run-check-04-routes.sh
# → exit 0
```

## 7. 与 **§9** 关系

本轮 **未**发现须**立即**单独立 **ISS-** 的 **P0** 证据；**deprecated 清册** 可作为后续 **§10.3** 工单输入。
