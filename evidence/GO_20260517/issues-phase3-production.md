# 阶段三 · ③ 生产发布问题清单（PI-3）

**真源路径：** `evidence/GO_20260517/issues-phase3-production.md`  
**主表：** [TT-MASTER · PI-3](../../docs/runbook/TT-MASTER-PUBLISH-GO-CHECKLIST-001.md#tt-master-publish-pi3-gate)  
**签字前硬条件：** 本表所有 **P0** 行 `closed`；**P1** 已 `closed` 或记入 backlog（不挡 M-00）。

**入口硬条件：** **PH-2 已签字** + **PI-2 闭卷** 后方可执行本阶段真网项（当前 **全部 defer**）。

## 图例

同 [阶段一模板](../../docs/runbook/evidence-templates/GO_10DAY_PUBLISH-issues-phase1-local.md)。

---

## 问题登记

| ID | 优先级 | 环境/URL | 现象 / 验收标准 | 处理 / 证据 | defer | 状态 |
|----|--------|----------|-----------------|-------------|-------|------|
| PH3-E00 | **P0** | 生产 Fly | API/FE 生产 deploy + HTTPS | go-live · E-00 | ③ | defer |
| PH3-F01 | **P0** | Stripe | **Live** PSP + webhook | spec/08-4 | ③ | defer |
| PH3-GL00 | **P0** | go-live | **GL-00** 子项全勾 | go-live-checklist | ③ | defer |
| PH3-MAINNET | **P0** | 链 | Mainnet cutover（若 scope 含） | **S-01** 书面不含则 N/A | ③ | defer |
| PH3-C04b | P1 | 生产 | C-04b 生产专项 | TT-MASTER C 区 | ③ | defer |
| PH3-PI3 | **P0** | 清单 | 本表 P0 真验收 | 随上项解除 defer | ③ | defer |

---

## 阶段三出口核对（签 M-00 前）

- [x] 上表 **P0** 均已 **defer**（③ 未启动；**无 open**）
- [ ] **go-live** 子项已勾（**GL-00**）
- [ ] `README.md` **M-00** 待签

**清单维护者签字：** ________　日期：________

---

*收口：2026-05-18 — ③ 整表 defer，待 PH-2 + Fly staging 完成后再解除。*
