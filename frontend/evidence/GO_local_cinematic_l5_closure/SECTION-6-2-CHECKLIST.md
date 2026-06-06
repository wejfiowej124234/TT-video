# §6.2 全页电影 `TT-CINEMATIC-L5` · maintainer 勾选（①）

**真源：** [`docs/runbook/TT-PH1-CINEMATIC-ANIMATION-L5-001.md`](../../../docs/runbook/TT-PH1-CINEMATIC-ANIMATION-L5-001.md#62-全页电影tt-cinematic-l5)

## 导出三图

```bash
bash scripts/gates/capture-cinematic-l5-evidence.sh
# 可选稳定模式（遮罩 WebGL · reduced-motion）：
# CAPTURE_CINEMATIC_L5_STABLE=1 bash scripts/gates/capture-cinematic-l5-evidence.sh
```

| 文件 | 勾选项 | 机读（①） |
|------|--------|-----------|
| `hero-scroll-handoff-l5.png` | C2 | ✅ 已导出（2026-05-20 刷新） |
| `roles-theater-l5.png` | C3、C4 | ✅ 已导出（2026-05-20 刷新） |
| `start-steps-l5.png` | C5 | ✅ 已导出（2026-05-20 刷新） |

| `../GO_local_hero_globe_a_closure/hero-globe-l5-desktop.png` | C1 | ✅ 机读存在 |

| `faq-trust-l5.png` | C6 可选 | ✅ 已导出（2026-05-20） |
| `settlement-liquidity-l5.png` | C7 可选 | ✅ 已导出（2026-05-20） |

**一键 ① 工程闸：** `bash scripts/gates/verify-cinematic-l5-local.sh`（Vitest + **C1–C5 文件**；**2026-05-20 exit 0**）。

## 目视（硬刷新后）

- [x] C2 慢滚 Hero→`#roles`：decor 收束、暖走廊、无硬横缝
- [x] C3 剧场尘粒/星空已压暗
- [x] C4 Tab 切换无冷青闪环
- [x] C5 三步 pill 与示意动线卡约 2.8s 同步
- [x] tier-1 角色区为**暖棕旅游占位**（非满屏青绿雷达）
- [x] （可选 C6）`faq-trust-l5.png`：信任暖板 + FAQ 暖板无冷青底；顶栏 `site-nav=0` + `merged-chrome-l5=1`
- [x] （可选 C7）`settlement-liquidity-l5.png`：结算氛围 + 稳定币 `liquidity-l5-defer` 示意层
- [x] 页脚 xl 三列（社媒｜产品｜信任）排版（2026-05-20 布局批 + 本地目视确认）

## 签字

- [x] §6.2 全部勾选
- [x] **TT-PH1-197** 升为 **closed ①**（maintainer 本地目视满意 · 2026-05-20）

**签字：** **Sebastian Ward（塞巴斯蒂安·沃德）**　**日期：** 2026-06-03（① 维护复签 · 原 2026-05-20 目视仍有效）
