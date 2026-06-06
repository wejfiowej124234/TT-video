# GO_local_site_theme_v1 · 全站主题 V1 ① 证据

**阶段：** ① 本地 only  
**Runbook：** [TT-PH1-SITE-THEME-V1-UPGRADE-001](../../docs/runbook/TT-PH1-SITE-THEME-V1-UPGRADE-001.md) v1.8.4  
**波次 C 勾选：** [V1-PERCEPTION-CHECKLIST.md](V1-PERCEPTION-CHECKLIST.md)（§3.2 · **§3.2.6 不合规总表** · §4.2）
**控件矩阵：** [TT-PH1-SITE-THEME-V1-CONTROL-MATRIX](../../docs/runbook/TT-PH1-SITE-THEME-V1-CONTROL-MATRIX.md)

## 机读基线

| 文件 | 说明 |
|------|------|
| `POST-212-closure-20260522.txt` | 历史 **30/30**（212 首次闭卷） |
| `POST-baseline-20260524-d8.txt` | **119/119**（v26 基线 + 波次 C：`homeMarketing` · `siteThemeV1StateFamily` · `marketModalsG4` · `communityMainPathRg` · D8 **225-G**） |
| `POST-baseline-20260522-v26.txt` | **86/86**（Hero/Footer/筛选壳、CustomItinerary 全节、子站合规/Masonry） |
| `POST-baseline-20260522-v25.txt` | **84/84**（MarketContent 排序/空态/加载更多、GuidesSection、StickyFilterBar 分隔线） |
| `POST-baseline-20260522-v24.txt` | **81/81**（CustomItinerary、子站 Masonry/详情/筛选、抽屉类、Studio 布局） |
| `POST-baseline-20260522-v23.txt` | **77/77**（Studio 双弹窗 + 订单上下文卡；`MARKET_GLASS` 暖 focus） |
| `POST-baseline-20260522-v22.txt` | **74/74**（筛选条/Hero/弹层、榜行/骨架、Login/Activity 侧栏） |
| `POST-baseline-20260522-v21.txt` | **67/67**（满分收敛：Market 卡/空态、Did-rank 榜壳、Community 侧栏/L1） |
| `POST-baseline-20260522-v20.txt` | **62/62**（PostDetail + Report 抽屉暖色；`communityDrawerTheme` 6 用例） |
| `POST-baseline-20260522-v19.txt` | **61/61**（Publish 抽屉 + Feed 内联条；`communityDrawerTheme` 5 用例） |
| `POST-baseline-20260522-v18.txt` | **55/55**（底色叠层 + Market 主 CTA；含 `marketDarkRouteScene`） |
| `POST-baseline-20260522-v17.txt` | 历史 **49/49**（§6.1 原 11 文件） |
| `POST-baseline-20260522-v16.txt` | 历史 **46/46** |

生成命令见 runbook **§6.1**。

## 目视（§6.2）

| 目录 | 说明 |
|------|------|
| `POST-screenshots/<route-slug>/` | **home** + market 子站 + 九社区路由 + did-rank（`desktop-1280x800` · 部分 `mobile-390x844`） |
| `POST-visual-20260524-d9.txt` | D9 · `e2e:site-theme-v1-capture` **2/2**（含 **home** + mobile 四路由） |
| `POST-visual-20260522.txt` | 历史 Playwright 日志 |
| `WAVE-C-signoff-20260524-d9.txt` | D9 起草 |
| `WAVE-C-signoff-20260524-d10.txt` | D10 感知层机读签字 · PI-1 待复跑 |
| `POST-baseline-20260524-d10.txt` | D10 · §6.1 **122/122** |
| `PI1-e2e-20260524-d10.txt` | D10 · pi1 **1 failed**（meta `governor_address`） |
| `D10-DEFER-20260524.txt` | G20/G21/227 等 defer P3 |

## 闭卷分层

- **§7.0** — TT-PH1-212 首次（2026-05-22）· 页面 UI L5 机读
- **§7.1** — 218/219 机读 + 矩阵对照；目视/evidence 维护者按需更新本目录
- **§7.2** — 波次 C 感知层（**TT-PH1-220～228** · [V1-PERCEPTION-CHECKLIST](V1-PERCEPTION-CHECKLIST.md)）· **open**

**禁止假完成：** ① 测试绿 ≠ ② 测试网 ≠ R-002 全矩阵 GO。
