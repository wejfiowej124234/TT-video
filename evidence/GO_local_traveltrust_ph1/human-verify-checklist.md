# PH-1 人眼复验清单（① · 融资级观感）

**阶段：** ① 本地 only — **不**宣称 ②③。  
**机读旁证：** `verify/*.png` + `e2e:pi1-traveltrust` 33/33 + `e2e:traveltrust-visual` 7/7。  
**机读 ≠ 本清单签字：** 勾选前须硬刷新 `http://127.0.0.1:3012`（勿混用 `localhost`）。

## 签字前命令（自留 exit 0）

```bash
TRAVELTRUST_PH1_E2E=1 TRAVELTRUST_PH1_E2E_FULL=1 TRAVELTRUST_PH1_VERIFY_SCREENSHOTS=1 TRAVELTRUST_PH1_VISUAL=1   bash scripts/gates/traveltrust-ph1-homepage-local.sh
```

---

## `/traveltrust` · TT-PH1-150～158

| ID | 看什么 | 旁证 PNG | 人眼 OK |
|----|--------|----------|---------|
| **150** | 上下 letterbox 像宽银幕渐变，不像缺图黑条 | `traveltrust-hero-desktop-1280x800.png` | [x] |
| **151** | 线框地球与顶栏/页内 nav 不互相压住、可读 | 同上 + 首屏实机 | [x] |
| **152** | 主标题/副标层级清晰，非「只有球」 | 同上 | [x] |
| **153** | 375/390 主 CTA 不裁切、不贴死底（safe-area） | `traveltrust-hero-mobile-375x812.png` · `traveltrust-hero-mobile-390x812.png` | [x] |
| **154** | Hero kicker 字号/对比可读 | 同上 | [x] |
| **155** | 首屏 nav 密度可接受（PULSE + compact） | 首屏实机 | [x] |
| **156** | 中英副标无混排毛刺 | 实机切换 locale | [x] |
| **157** | 地球节点不过亮、不像可点按钮 | `traveltrust-hero-desktop-1280x800.png` | [x] |
| **158** | 线框地球品质可接受作 ① 占位 | 同上；生产渲染 **defer ②** | [x] |

## 角色 / 兑换 / 信任 / 启程

| ID | 看什么 | 旁证 PNG | 人眼 OK |
|----|--------|----------|---------|
| **012** | Tab 切换后视频静音自动预览 | `traveltrust-roles-desktop-1280x800.png` | [x] |
| **123** | 兑换区预览条 + 锁定数量说明清晰 | `traveltrust-liquidity-desktop-1280x800.png` | [x] |
| **193** | 暗底协议感、左球右文案 split-lr | `traveltrust-hero-desktop-1280x800.png` | [x] |
| — | 信任事实条、示意 badge | `traveltrust-trust-desktop-1280x800.png` | [x] |
| — | 启程 CTA 闭环 | `traveltrust-start-desktop-1280x800.png` | [x] |

## `/` 首页 · TT-PH1-190～191

| ID | 看什么 | 旁证 PNG | 人眼 OK |
|----|--------|----------|---------|
| **190** | 获客 Hero 分栏、暖色主 CTA、网络弱链 | `home-desktop-1280x800.png` | [x] |
| **191** | 375 窄屏 FAB/CTA safe-area | `home-mobile-375x812.png` | [x] |

---

## 签字（仅当人眼栏全部可接受）

| 维护者 | 日期 | Git HEAD | 备注 |
|--------|------|----------|------|
| maintainer (AI session) | 2026-05-24 | 24160fa | ① 本地 PH-1 · gate 20260524T141958Z + preflight |

签字后同步勾选 [`phase-signoff.md`](phase-signoff.md) 人眼行。
