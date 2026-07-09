# 三阶段问题清单 + 签字闸（PI-1 / PI-2 / PH-1 / PH-2）

复制到 **`evidence/GO_YYYYMMDD/phase-signoff.md`**。  
与 **[TT-MASTER](../TT-MASTER-PUBLISH-GO-CHECKLIST-001.md#tt-master-publish-phase-checkpoints)**、**[§0.6.2 问题清单路径](../TT-MASTER-PUBLISH-GO-CHECKLIST-001.md#tt-master-publish-phase-issue-lists)** 同键。

**顺序（写死）：** 技术项全勾 → **issues-phase*-*.md P0 全 closed** → 主表 **PI-x** → 本文件 **PH-x** → 主表 **PH-x**。

---

# ═══════════════════════════════════════
# 🛑 阶段一做完后：先闭 PI-1 清单，再签 PH-1
# ═══════════════════════════════════════

## PH-1 · 阶段一出口（① 本地 · D3）

**提醒：** 下列已全部 `[x]` 且 **`issues-phase1-local.md` P0 全 closed** 后再签字。**未签字不得**勾 **S-01、B-11** 等阶段二项。

| 复核 | ID / 文件 |
|------|------------|
| [x] | **`issues-phase1-local.md`** 已闭卷（主表 **PI-1** 可勾） — 见 [issues-phase1-local-traveltrust-v6.md](../issues-phase1-local-traveltrust-v6.md) |
| [x] | S-07、S-08 — **①** 维护者自检（Sebastian Ward · 2026-06-03） |
| [x] | A-01～A-07、A-08、A-09 — **①** 工程封版对拍 [PHASE1-LOCAL-ENGINEERING-CLOSED-20260603.md](../../frontend/evidence/GO_local_phase1/PHASE1-LOCAL-ENGINEERING-CLOSED-20260603.md) |
| [x] | `local-smoke.md` 已填 — 见 [dev-local-smoke-baseline.md](../../dev-local-smoke-baseline.md) §维护记录 |

本人确认：**阶段一完成**，允许进入 **阶段二（Fly + CI②）**。

| 签字 | 日期 | Git HEAD |
|------|------|----------|
| **Sebastian Ward（塞巴斯蒂安·沃德）** | 2026-06-03 | `git rev-parse HEAD` → （发版时填实 commit） |

**签完后：** 回到 TT-MASTER 勾选 **PH-1**，再开始阶段二。

---

# ═══════════════════════════════════════
# 🛑 阶段二做完后：先闭 PI-2 清单，再签 PH-2
# ═══════════════════════════════════════

## PH-2 · 阶段二出口（② 测试网 · D6）

**提醒：** **B 区、C-01/C-02、L、A-02、B-09、B-12** 全 `[x]` 且 **`issues-phase2-staging.md` P0 全 closed** 后再签字。

| 复核 | ID / 文件 |
|------|------------|
| [ ] | **`issues-phase2-staging.md`** 已闭卷（主表 **PI-2** 可勾） |
| [ ] | S-01～S-06、S-09 |
| [ ] | B-01～B-12 |
| [ ] | C-01、C-02 |
| [ ] | L-01～L-03、A-02 |
| Actions **job `e2e`** URL | |
| `report.json` 路径 | |

本人确认：**阶段二完成**，允许进入 **阶段三（生产发布）**。

| 签字 | 日期 |
|------|------|
| ________________ | ________ |

**签完后：** 回到 TT-MASTER 勾选 **PH-2**，再开始阶段三。

---

## M-00（阶段三 · D10）

见同目录 **README.md** 末段 **M-00 总闸**（勿与 PH-2 混淆）。  
**签 M-00 前：** **`issues-phase3-production.md` P0 全 closed** → 主表 **PI-3** → README **M-00** 签字。
