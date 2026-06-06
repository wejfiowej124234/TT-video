# 主题 V1 + 9618 · 建议顺序复验（① 本地）

**日期：** 2026-05-22  
**阶段：** ① 本地 only（不宣称 ② 测试网 / ③ 生产）

## 1. 目视（§6.2 · 机采旁证）

命令：

```bash
cd frontend && npm run e2e:site-theme-v1-capture
```

结果：**1 passed**（9 路由 · 1280×800）→ `POST-screenshots/<slug>/desktop-1280x800.png`  
日志：`VERIFY-e2e-post-capture-20260522.log`

| slug | 路径 | 目视入口 |
|------|------|----------|
| market | `/market` | `POST-screenshots/market/` |
| did-rank | `/did-rank` | `POST-screenshots/did-rank/` |
| community | `/community` | `POST-screenshots/community/` |
| explore | `/community/explore` | `POST-screenshots/explore/` |
| friends | `/community/friends` | `POST-screenshots/friends/` |
| messages | `/community/messages` | `POST-screenshots/messages/` |
| me | `/community/me` | `POST-screenshots/me/` |
| feedback | `/community/feedback` | `POST-screenshots/feedback/` |
| tt | `/community/tt` | `POST-screenshots/tt/` |

**请你本地打开上述 PNG**，对照首页 `/` 与 runbook [TT-PH1-SITE-THEME-V1-UPGRADE-001](../../../docs/runbook/TT-PH1-SITE-THEME-V1-UPGRADE-001.md) §1.6（暖金 Hub/主 CTA、深条 L0、无首页全屏摄影误套）。

## 2. 机读（§6.1）

```bash
cd frontend && npm run test -- --run \
  lib/uiSystem.test.ts lib/marketingUi.test.ts \
  'app/(home)/homeMarketing.contract.test.ts' \
  components/market/marketTheme.contract.test.ts \
  components/did-rank/didRankTheme.contract.test.ts \
  components/community/communityShellTheme.contract.test.ts \
  components/community/communityPageTheme.contract.test.ts \
  components/guides/guidesTheme.contract.test.ts \
  app/traveltrust/traveltrustErrorTheme.contract.test.ts \
  components/auth/authHelpBridgeTheme.contract.test.ts
```

结果：**10 files · 42 passed · exit 0**  
日志：`VERIFY-theme-v1-20260522.txt`

## 3. 9618（独立轨 · PG）

```bash
export DATABASE_URL='…'   # 已迁移本地 PG
bash scripts/gates/tt-9618-onboarding-pg-evidence.sh
```

结果：**exit 0 · OK**（与主题 V1 分开记结论）  
日志：`../GO_local_9618_onboarding/VERIFY-9618-rerun-20260522.log`

## 4. 下一阶（未做）

- **② 测试网**：staging + TT-9618 §3.1 步 1～4 + 目视三页（可选重复 §6.1）
- **③ 生产**：另闸
- 可选：`CHECK_FRONTEND_NPM_BUILD=1`、安装 `promtool` 补 gate 提示

## 书面 defer（若目视仍觉「不像首页」）

- D2：Feed 帖内霓虹未改  
- D3：Market 抽屉内 cyan focus 保留  
- `/`、`/traveltrust` 非 marketDark 大改范围

若不满意，请点名 **具体 slug/组件**，再开 ① 小批修补（勿与 9618 混批）。
