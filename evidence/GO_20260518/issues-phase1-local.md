# 阶段一 · PI-1 问题清单 · TravelTrust v6（① 本地闭卷）

**Version:** 1.0.0  
**最后更新：** 2026-05-18  
**阶段：** **① 本地**  
**明细：** [issues-phase1-ui-ux-traveltrust-v6.md](issues-phase1-ui-ux-traveltrust-v6.md)  
**审计 SSOT：** [TT-PH1-TRAVELTRUST-V6-HOMEPAGE-AUDIT-001](TT-PH1-TRAVELTRUST-V6-HOMEPAGE-AUDIT-001.md)  
**模板：** [GO_10DAY_PUBLISH-issues-phase1-local](evidence-templates/GO_10DAY_PUBLISH-issues-phase1-local.md)

> **闭卷判据：** 下表 **P0 全部为 closed**；**P1** 为 **closed** 或 **defer** 并写明阶段。  
> **不**用本文宣称 ② 测试网或 ③ 生产已验。

---

## P0

| ID | 页面 | 现象 | 处理 / 证据 | defer | 状态 |
|----|------|------|-------------|-------|------|
| TT-PH1-030b | `/traveltrust` | 无生产实拍 MP4 | tier-1 占位 + `media:traveltrust-tier1`；契约测 MP4 存在 | 生产片 **②** | **closed ①** |
| TT-PH1-050 | `/traveltrust` | 无埋点落库 | `app/api/traveltrust/analytics/route.ts` + dev beacon | 生产 ingest **②** | **closed ①** |

---

## P1（节选 · 全表见 UI/UX 明细）

| ID | 优先级 | 现象 | 处理 | defer | 状态 |
|----|--------|------|------|-------|------|
| TT-PH1-003 | P1 | 顶栏白底冲突 | `Header.tsx` traveltrust 深色条 | 13-1 脚注 **② 文档** | **closed ①** |
| TT-PH1-004 | P1 | 壳色漂移 | `#14100d` layout 有意 | 85 字面 **② 文档** | **closed ①** |
| TT-PH1-010 | P1 | 85 17 段 IA | v6 电影 scope | 产品 | **defer ①** |
| TT-PH1-011 | P1 | 缺 trust/faq/settlement | 全段合入 | — | **closed ①** |
| TT-PH1-051 | P1 | analytics 漂移 | 五事件对齐 | — | **closed ①** |
| TT-PH1-060 | P1 | Hero 无钱包 | 多 connector | — | **closed ①** |
| TT-PH1-073 | P1 | 无 OG | 动态 PNG | 品牌图 **②** | **closed ①** |
| TT-PH1-090 | P1 | WebGL 常开耗电 | hero IO + tab hidden | — | **closed ①** |
| TT-PH1-120/121 | P1 | 缺 pulse/liquidity | 已合入 | — | **closed ①** |
| TT-PH1-122 | P1 | PULSE CMS | 静态 seed | **②** | **defer ②** |
| TT-PH1-123 | P1 | 真 swap | 预览按钮 | **②③** | **defer ②③** |
| TT-PH1-130～147 | P1 | 电影 UX 批 | 见审计 §9 | — | **closed ①** |
| TT-PH1-141 | P1 | FAQ 错文案 | locale 去重 + test | — | **closed ①** |

---

## 阶段一出口核对（PH-1 签字前）

- [x] 上表 **P0** 全部为 **closed**（030b = ① 接受 tier-1；050 = ① 本地 ingest）
- [x] **P1** 无未说明 **open**（010/122/123/101 已 defer）
- [ ] `local-smoke.md`（若本 GO 窗口使用 evidence 包则更新）
- [ ] `phase-signoff.md` **PH-1** 待签

**维护者：** ________　**日期：** ________

---

## ① 验收命令（自留 exit 0）

```bash
bash scripts/gates/traveltrust-ph1-homepage-local.sh
# 浏览器手验前（:3012 已起）：
TRAVELTRUST_PH1_E2E=1 bash scripts/gates/traveltrust-ph1-homepage-local.sh
# API 起后全量 E2E：
cd frontend && npm run e2e:pi1-traveltrust
```

**证据包：** `evidence/GO_20260518/`（`local-smoke.md` · `phase-signoff.md`）
