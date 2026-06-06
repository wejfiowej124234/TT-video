# 非地球 L5 审计清单 · 代码完成度（①）

**阶段：① 本地** — **§6.2 maintainer 已签字（2026-05-20）** · **TT-PH1-197 closed ①**（全页电影轨；**不**等同 ②③）。

| 批次 | 范围 | 代码 |
|------|------|------|
| A | P0 浮层 / Pulse / handoff | ✅ |
| B | 顶栏 / Hero / 走廊 / scroll chrome | ✅ |
| C | 剧场占位 / 弧线标签 / Tab | ✅ |
| D | 信任 / FAQ / 启程 / 页脚 | ✅ |
| E | 稳定币（L4 降权） | ✅ 免责合并为预览条一处 |
| F | Runbook / CAPTURE / Playwright 导出 | ✅ |
| **G** | 顶栏再压 / 移动左下 chrome / handoff·环境 / 启程·页脚·稳定币可读 / pill 统一 / WebGL 降级条 | ✅ |
| **H** | 截图审计批：Hero 卡暖玻璃 / 钱包 CTA 对齐 / scroll pill / 剧场暖占位+视频调色 / 信任图标 / FAQ / 启程双栏 / 页脚 pending | ✅ |
| **I** | tier-1 强制暖占位 / 顶栏+Hero 再压 / FAQ·结算·稳定币间距 / 治理图标 / 区域主理人暖色 / 证据 capture 脚本 | ✅ |
| **J** | Hero scroll 提示移出文案卡 / 剧场 meta·页脚对齐 / 合规可读 / E2E 证据增强 / §6.2 勾选表 | ✅ |
| **K** | 稳定币标题移出预览卡 / 信任栅格居中 / 合约测 outside-card / `verify-cinematic-l5-local.sh` / U1② defer 文 | ✅ |
| **L** | xl 顶栏 nav+Pulse 单行 / Hero xl 顶距 / 结算 max-w-3xl / 剧场旅游占位文案 / WebGL 条可点+顶对齐 / 省电提示可读 | ✅ |
| **M** | 合规区可读 / 嵌入 nav 对比度 / 画质钮单次脉冲+compact / Pulse 日期对比 / 启程 caption / verify 可选刷新 PNG / U4–U5 defer 文 | ✅ |
| **N** | verify 含 C1 地球 PNG / page-brief 暖 focus / heroUi 暖边 / `AUDIT-INDEX` + `CODE-CLOSURE-STATEMENT` | ✅ |
| **O** | `maybe-run-cinematic-l5-verify-on-diff` · `local-delivery-expanded` 挂钩 · `npm run test/verify:cinematic-l5` · solo-dev 条目 | ✅ |
| **P** | 截图审计批：FAQ 暖底/压青 · unified 氛围去青 · 双顶栏 merged · 剧场占位降网格 · 启程三步轮播/栅格 · 路线卡暖渐变 · 页脚 pending · 旅游占位文案 | ✅ |
| **Q** | `/traveltrust` 隐藏 L0 四链 · handoff 叠层加厚 · 剧场 SVG stop100 暖化 · Hero CTA/钱包 · 信任栅格 token · scroll 暖带峰值 | ✅ |
| **R** | Hero 顶距收紧 · Hero 主 CTA 脉冲 · 启程 ghost 暖化 · 稳定币氛围层 · Header merged 锚点 · E2E **C6** faq-trust 可选 PNG | ✅ |
| **S** | LandingChrome sticky 顶距 · 结算氛围层 · `CODE_COMPLETE_AT` 2026-05-20 · `npm run capture:cinematic-l5` · verify/capture C6 旁证 · 合约测 suppress nav | ✅ |
| **T** | 信任暖板 · Pulse 可读性 · verify 含 closure+contract · maybe-run 路径扩 · README code-complete ① | ✅ |
| **U** | 工程锁常量 A–U · verify→`test:cinematic-l5` · CONTRIBUTING/solo-dev 推送前 · E2E merged chrome 断言 · `MAINTAINER-ONE-PAGE` · `ENGINEERING-LOCK` | ✅ |
| **V** | 模块台账去重机读 · runbook §7 命令同步 · maybe-run 路径扩 · 可选 C7 结算/稳定币 PNG · 批次 **A–V** | ✅ |
| **W** | 本地闸契约测试 · `ISSUES-ENGINEERING-SYNC` · issues/runbook §6.2 互指 · `capture:cinematic-l5:stable` · 批次 **A–W** | ✅ |

> **① 代码清单：** 审计表内可编码项已收口（**A–W**）— 见 [`CODE-CLOSURE-STATEMENT.md`](./CODE-CLOSURE-STATEMENT.md) · [`ENGINEERING-LOCK.md`](./ENGINEERING-LOCK.md) · [`MAINTAINER-ONE-PAGE.md`](./MAINTAINER-ONE-PAGE.md)。后续仅为 **目视 / ②③ defer / 像素修补**。

| 原审计 ID | 代码 | 目视 / 证据 |
|-----------|------|-------------|
| P0-1～3 | ✅ | 待你截图确认 |
| P0-4 §6.2 | 三 PNG 已导出（`capture-cinematic-l5-evidence.sh`） | C1–C6 **目视勾选** + maintainer 签字 |
| P1-1～31（除 ② mp4） | ✅ | 待你截图确认 |
| P2-1～2 | ✅ | — |
| P2-3～5 / TT-PH1-150～153 | H 批已再触及 | **verify** 后勾 runbook |
| 剧场实拍 mp4 | — | **② defer**（U1） |
| §6.2 三图 + 签字 | PNG 已在证据目录 | **maintainer** 目视 + [`SECTION-6-2-CHECKLIST.md`](./SECTION-6-2-CHECKLIST.md) |
| 地球 mesh | 锁定未动 | TT-GLOBE-L5 已闭 |

## 导出三图（dev 已起）

```bash
bash scripts/gates/capture-cinematic-l5-evidence.sh
# ① 工程闸（Vitest + PNG 存在，不替代目视）：
bash scripts/gates/verify-cinematic-l5-local.sh
# 重导三图并校验：
# CAPTURE_CINEMATIC_L5_REFRESH=1 bash scripts/gates/verify-cinematic-l5-local.sh
# 或
cd frontend && CAPTURE_CINEMATIC_L5=1 npx playwright test e2e/cinematic-l5-evidence-capture.spec.ts --project=chromium
```

## 你发截图后

标注区域或 P 编号，我做**第二轮像素级修补**；满意后再勾 §6.2。
