# 阶段一 · PI-1 问题清单 · TravelTrust v6（① 本地闭卷）

**Version:** 1.0.4  
**最后更新：** 2026-05-22  
**阶段：** **① 本地**  
**明细：** [issues-phase1-ui-ux-traveltrust-v6.md](issues-phase1-ui-ux-traveltrust-v6.md)  
**全站主题 V1：** [TT-PH1-SITE-THEME-V1-UPGRADE-001](TT-PH1-SITE-THEME-V1-UPGRADE-001.md)（**TT-PH1-206～212** · 与首页轨并行）  
**电影动画 L5：** [TT-PH1-CINEMATIC-ANIMATION-L5-001](TT-PH1-CINEMATIC-ANIMATION-L5-001.md)（**196** closed · **197～201** partial · **202/203** **defer ②** · D10 登记）  
**审计 SSOT：** [TT-PH1-TRAVELTRUST-V6-HOMEPAGE-AUDIT-001](TT-PH1-TRAVELTRUST-V6-HOMEPAGE-AUDIT-001.md)  
**模板：** [GO_10DAY_PUBLISH-issues-phase1-local](evidence-templates/GO_10DAY_PUBLISH-issues-phase1-local.md)

> **闭卷判据：** 下表 **P0 全部为 closed**；**P1** 为 **closed** 或 **defer** 并写明阶段。  
> **不**用本文宣称 ② 测试网或 ③ 生产已验。  
> **IA 裁撤（2026-05-19）：** `#stats` / `#explain` 已下线 — 见 [UI/UX 明细 · IA 下线](issues-phase1-ui-ux-traveltrust-v6.md#ia-下线-2026-05-19①--产品裁撤)。

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
| TT-PH1-195～205 | P1 | 电影动画 L5 轨 | 见 [动画 L5 runbook](TT-PH1-CINEMATIC-ANIMATION-L5-001.md) | 202/203 **defer ②** | **defer ②**（**196** **closed ①** · D10 `D10-DEFER-20260524.txt`） |

---

## 阶段一出口核对（PH-1 签字前）

- [x] 上表 **P0** 全部为 **closed**（030b = ① 接受 tier-1；050 = ① 本地 ingest）
- [x] **P1** 无未说明 **open**（010/122/123/101 已 defer）
- [x] **全站主题 V1 · 程序 ①（206～217）：** [TT-PH1-SITE-THEME-V1-UPGRADE-001](TT-PH1-SITE-THEME-V1-UPGRADE-001.md) — 212/218/219 **closed ①**
- [x] **全站主题 V1 · 感知层 ①（220～234 · 十日 D10）：** 同上 runbook **§3.2.11 + §7.2** — **2026-05-24** · `WAVE-C-signoff-20260524-d10.txt`
- [ ] **② 测试网：** [TT-9618-onboarding-local-testnet.md](TT-9618-onboarding-local-testnet.md) — **仅当上一行已勾**；**第 11 天起**；**禁止跳阶**
- [ ] `local-smoke.md`（若本 GO 窗口使用 evidence 包则更新）
- [x] `npm run e2e:pi1-traveltrust` **33/33**（① 机读 · 2026-05-24 D10 复跑 · gate rerun8）
- [x] `TRAVELTRUST_PH1_E2E=1 E2E_FULL=1 VERIFY_SCREENSHOTS=1` 合一全闸 exit 0（`last-local-gate-20260524T141958Z.txt`）
- [x] verify **10** PNG + [`human-verify-checklist.md`](../../evidence/GO_local_traveltrust_ph1/human-verify-checklist.md)
- [x] `npm run e2e:traveltrust-visual` **7/7**（TT-PH1-182 · 2026-05-19 · 未触 traveltrust 改码沿用）
- [x] `phase-signoff.md` **PH-1** 已签（2026-05-24 · 150～158 / 190～193）
- [x] 电影动画 L5：**defer ②** 已登记（**196** closed · **202/203** defer · `D10-DEFER-20260524.txt`）

**维护者：** ________　**日期：** ________

---

## ① 验收命令（自留 exit 0）

```bash
bash scripts/gates/traveltrust-ph1-homepage-local.sh
# ① 机读全量（Vitest + home E2E + verify PNG + pi1 33/33）：
TRAVELTRUST_PH1_E2E=1 TRAVELTRUST_PH1_E2E_FULL=1 TRAVELTRUST_PH1_VERIFY_SCREENSHOTS=1 \
  bash scripts/gates/traveltrust-ph1-homepage-local.sh
# 视觉回归（TT-PH1-182 · 另跑或叠加 VISUAL=1）：
cd frontend && npm run e2e:traveltrust-visual
# 人眼签字前机读预检（不替代签字）：
bash scripts/gates/traveltrust-ph1-human-verify-preflight.sh
```

**证据包：** `evidence/GO_20260518/`（`local-smoke.md` · `phase-signoff.md`）
