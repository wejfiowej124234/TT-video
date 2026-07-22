# TT · PSG · Staging Display + Wallet Drift Audit（LATEST）

**阶段：** ② Staging 深检 · **≠** Reality Closure PASS · **≠** 任何 GO  
**recorded_utc：** 2026-07-22  
**Owner 问：** 钱包是否又变弹窗 · CMS/COS/展示 · SSOT/PSG 旧数据 · 流程证据 · 脏包

---

## 0 · 一句话

| 面 | 结论 |
|----|------|
| **公开展示 10×4 + COS** | **对** · Staging `LOCKED_10X4` · `QUALITY_OK_10X4` |
| **Attestation tip** | **对** · Web/API `a9730cda` · `identity_source=docker-bake`（已清 Fly 旧 secret `7c84ca23`） |
| **钱包 UI** | **设计=下拉（①）** · **Git tip=`a9730cda` 仍是 createPortal 弹窗** · **本地未提交工作区=下拉** · Staging 当前包含下拉 chunk · **未进 tip → 下次 clean tip 部署会再丢** |
| **Reality Closure / GO** | **未过** · Inventory 七域未 READY · Readiness/GO **禁止** |

---

## 1 · 钱包（PSG / ① 设计矩阵）

**SSOT（①）：**

- `frontend/evidence/GO_local_wallet_connection_l5/WALLET-DROPDOWN-UI-20260718.md` — 弹窗→下拉 PASS
- `MANUAL-UAT.md` A2 — absolute 下拉 · `data-tt-wallet-dropdown=1`
- `HEADER-UTILITY-MENU-L5-FREEZE` — 与语言/用户菜单同壳
- 本地：`bash scripts/dev/smoke-wallet-connection-l5-local.sh` → **TT_WALLET_L5_SMOKE: PASS**（本轮已跑）

| 层 | 形态 | 证据 |
|----|------|------|
| 设计 / 本地工作区 | **下拉** | `WalletStatusMini` absolute · Sheet `wallet-header-dropdown` · **无** `createPortal` |
| **Git tip `a9730cda`** | **弹窗** | tip `TravelTrustWalletSheet` 仍 `createPortal` + `fixed inset-0 z-[320]` + `aria-modal` |
| Staging 现行镜像 | **下拉 chunk 在** | 探针命中 `wallet-header-dropdown` · 未命中 modal `z-[320]`（来自脏树 no-cache 部署） |

**根因（你说的「部署弄没了」）：**  
下拉改造在 **未提交工作区**（及/或未进当前 tip）。用 **clean tip worktree** 部署会只带 tip=弹窗；用脏树部署可暂时带下拉，但 **tip 未钉死 → 复发**。

**永久解法（须 Owner 授权 commit）：** 把钱包下拉相关 `frontend/components/trust/*` · `frontend/lib/wallet/**` 提交进 tip，再部署；**禁止**再只从无下拉的 tip clean 部署覆盖。

**PSG Wallet Coverage：** [TT-PSG-WALLET-COVERAGE-SPLIT-LATEST](./TT-PSG-WALLET-COVERAGE-SPLIT-LATEST.md) — Extension PASS_SLICE · WC DEFERRED · **≠** GO。下拉=① UI 壳，**不**解锁 OA-01/OA-02。

---

## 2 · CMS / COS / 公开展示（PSG Display 矩阵）

| 检查 | 结果 | 证据 |
|------|------|------|
| Guides/Provider/Acquisition/Community = 10 | ✅ | `check-public-display-10x4-counts.py` → `LOCKED_10X4` |
| 文案乱码 / Unsplash 封面 | ✅ 0 | `evidence/GO_public_display_10x4_lock/DEEP-QUALITY-LATEST.json` → `QUALITY_OK_10X4` |
| Ambient Catalog bake | ✅ | Web `cms_baseline=public_display_10x4 + catalog_bake=1` |
| 首页 Unsplash | 工程已禁静默回退 | `landingAmbientByCountry` COS SSOT · 部署闸 Catalog=1 |
| 向导 SQL 修复 | ✅ | `archive-and-repair-staging-ocs-guides.cjs` + API restart |
| 收购角标色 | ✅ 代码 | `globals.css` Link/` :visited` `#f9d779 !important` |
| Ambient 双刷 | ✅ 代码 | `useLandingAmbientUrl` 禁 null-flash · Ken Burns 不 remount |

**PSG 文档已更新（本轮）：**

- `TT-PSG-PUBLIC-DISPLAY-10X4-LOCK-LATEST.md`（tip SHA 强制 · secrets · bake.json · post 10×4）
- `TT-PSG-DEPLOY-FRESHNESS-GATE-LATEST.md`（attestation + post 10×4 项）

---

## 3 · SSOT / PSG 里有没有「旧数据」？

| 真源 | 旧数据？ | 说明 |
|------|----------|------|
| PSG Archive `v1.1.0-psg-go.20260717` | 历史冻结 | **不可改** · **不是** Staging 展示内容源 |
| OCS `dataset.v1.json` / state | 当前 10×4 真源 | Staging 应对齐此 · 非 Unsplash showcase |
| Fly `TRAVELTRUST_GIT_SHA` secret | **曾旧**（`7c84ca23`） | **已覆盖为 tip** · bake.json 优先 |
| Git tip 钱包 UI | **旧（弹窗）** | **相对 ① 下拉设计过期** · 最大复发点 |
| Feature Inventory | 诚实 NOT_ALL_READY | 7 域未 production_ready · **禁止假 READY** |

---

## 4 · 今天流程有没有证据？PSG 更新了吗？还有脏包吗？

| 项 | 状态 |
|----|------|
| W0–W7 / Reality Closure 证据 | 有 · **Closure = JUDGED_NOT_PASS** |
| 10×4 / Deep quality | 有 · `GO_public_display_10x4_lock/` |
| Deploy Freshness | 有 · `GO_deploy_freshness_gate/20260722T001926Z/` |
| Web tip / bake | 线上 `a9730cda` · `docker-bake` |
| **脏工作区** | **有** · 大量未提交（含钱包下拉、admin、docs）· tip 与工作区漂移 |
| **脏展示数据（Staging 公开）** | **当前否**（10×4 + QUALITY_OK） |
| **脏 tip 身份** | **当前否**（secrets+bake 已修） |

---

## 5 · 是否符合 PSG 标准？

| 标准条 | 符合？ |
|--------|--------|
| 展示面 OCS 10×4 + Freshness | ✅ Staging 现行 |
| 禁止 showcase 再种 / Catalog bake | ✅ 工程闸 |
| Wallet ① 下拉设计 | ✅ 本地/现行 Staging 包 · ❌ **未钉 tip** |
| Extension Wallet Coverage | PARTIAL / PASS_SLICE · WC Deferred |
| Reality Closure / Production GO | ❌ 未过 · 正确保持锁定 |

**诚实：** 展示与 tip 身份本轮修复方向对；钱包下拉 **未合入 tip = 不符合「可重复部署仍保持 PSG/① UI」**，必须提交后再部署才算钉死。

---

## 6 · Owner 下一步（写死）

1. **授权 commit** 钱包下拉相关文件进 tip（永久防弹窗回流）  
2. 再 `deploy-tt-web-staging`（已有 tip SHA + secrets sync + post 10×4）  
3. 硬刷新浏览器验证顶栏钱包=下拉  
4. **勿**在未提交下拉时用 clean tip worktree 部署  

**禁止：** 宣称 Closure PASS / Staging-grade GO / Production GO。
