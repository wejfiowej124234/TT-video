# TT-ADMIN-FUNCTIONAL-USABILITY-AUDIT · Functional Audit（唯一状态）

**Version:** 3.1.0 · **生效：** 2026-07-01  
**角色：** 四份永久文档之 **②** — **只维护 Complete / Partial / Missing**  
**全量映射：** [`TT-ADMIN-FEATURE-SSOT.md`](TT-ADMIN-FEATURE-SSOT.md) §2（SSOT · Gate · Checklist）  
**机读：** [`registry/admin-functional-usability-audit.v1.yaml`](../../registry/admin-functional-usability-audit.v1.yaml)

---

## 四份永久文档

| # | 文档 | 作用 |
|---|------|------|
| ① | [`TT-ADMIN-THREE-CENTERS-ARCHITECTURE`](TT-ADMIN-THREE-CENTERS-ARCHITECTURE.md) | Architecture · **永久冻结** |
| ② | **本文** | **唯一状态** |
| ③ | [`TT-ADMIN-FEATURE-SSOT`](TT-ADMIN-FEATURE-SSOT.md) | **唯一技术真源** + **唯一 Gate** |
| ④ | [`TT-ADMIN-CHECKLIST`](TT-ADMIN-CHECKLIST.md) | 进度 ☐/☑ · **不能起手** |

---

## 开发入口（写死）

**永远从本文开始** · **不要**从 Checklist · **不要**从灵感。

1. 打开 **Functional Audit** → 2. 选 **Partial/Missing** → 3. **[Feature SSOT](TT-ADMIN-FEATURE-SSOT.md)** → 4. AI 实现 → 5. **Gate** → 6. 本文 **Complete** → 7. **Checklist ☑**

---

## 功能状态（唯一状态表）

| ID | 功能 | 中心 | 状态 | Feature SSOT | Gate |
|----|------|------|------|--------------|------|
| F-UM-01 | Users / 角色审批 | User Mgmt | **Complete** | [§2.1](TT-ADMIN-FEATURE-SSOT.md#21-user-management) | G-L5-U02 |
| F-UM-02 | Acquisition 发布暂停 | User Mgmt | **Complete** | §2.1 | G-L5 |
| F-UM-03 | Orders / Disputes / Reviews | User Mgmt | **Complete** | §2.1 | G-L5 |
| F-UM-04 | Guide Applications | User Mgmt | **Complete** | §2.1 | G-L5 |
| F-UM-05 | Guide 注册审核 UI | User Mgmt | **Complete** | §2.1 | G-L5-U02 |
| F-CC-01 | Countries / Cities / POIs | Content | **Complete** | [§2.2](TT-ADMIN-FEATURE-SSOT.md#22-content-center) | G-L5 |
| F-CC-02 | Pricing / Routes / Hotel / Transport | Content | **Complete** | §2.2 | G-L5 |
| F-CC-03 | POI Images | Content | **Complete** | §2.2 | G-L5 |
| F-CC-04 | Revisions / Import / Catalog / Geo | Content | **Complete** | §2.2 | G-L5 |
| F-CC-05 | Country Market | Content | **Complete** | §2.2 | G-L5 |
| F-CC-06 | Landing Background | Content | **Complete** | §2.2 | G-L5 |
| F-CC-07 | Media Assets | Content | **Complete** | §2.2 | G-L5 |
| F-CC-08 | Publish Queue | Content | **Complete** | §2.2 | G-L5 |
| F-CC-09 | Translation | Content | **Complete** | §2.2 | G-L5 |
| F-CC-10 | SEO | Content | **Complete** | §2.2 | G-L5 |
| F-OO-01 | Official Accounts | Official Ops | **Complete** | [§2.3](TT-ADMIN-FEATURE-SSOT.md#23-official-ops) | G-L5 |
| F-OO-02 | Itinerary Templates | Official Ops | **Complete** | §2.3 | G-L5 |
| F-OO-03 | Official Guides | Official Ops | **Complete** | §2.3 | G-L5 |
| F-OO-04 | Cold Start | Official Ops | **Complete** | §2.3 | G-L5 |
| F-OO-05 | Public Operations Stats | Official Ops | **Complete** | §2.3 | G-L5-PUB |
| F-OO-06 | Publish / Unpublish | Official Ops | **Complete** | §2.3 | G-L5-PUB |
| F-OO-07 | Featured | Official Ops | **Complete** | §2.3 | G-L5-PUB |
| F-OO-08 | Priority | Official Ops | **Complete** | §2.3 | G-L5-PUB |
| F-OO-09 | Surface | Official Ops | **Complete** | §2.3 | G-L5-PUB |
| F-OO-10 | Schedule | Official Ops | **Complete** | §2.3 | G-L5-PUB |
| F-OO-11 | Preview | Official Ops | **Complete** | §2.3 | G-L5-PUB |
| F-OO-12 | Version History | Official Ops | **Complete** | §2.3 | G-L5-PUB |
| F-OO-13 | Test Policy | Official Ops | **Complete** | §2.3 | G-L5-PUB |
| F-OO-14 | Homepage Campaign | Official Ops | **Complete** | §2.3 | G-L5-PUB |
| F-OO-15 | Market Campaign | Official Ops | **Complete** | §2.3 | G-L5-PUB |
| F-OO-16 | Community Campaign | Official Ops | **Complete** | §2.3 | G-L5-PUB |
| F-OO-17 | Festival Campaign | Official Ops | **Complete** | §2.3 | G-L5-PUB |
| F-OO-18 | Holiday Campaign | Official Ops | **Complete** | §2.3 | G-L5-PUB |
| F-OO-19 | Regional Campaign | Official Ops | **Complete** | §2.3 | G-L5-PUB |
| F-PC-01 | Config / Flags / Policies | Platform | **Complete** | [§2.4](TT-ADMIN-FEATURE-SSOT.md#24-platform-center) | G-L5 |
| F-PC-02 | Permissions / RBAC | Platform | **Complete** | §2.4 | G-L5-RBAC |
| F-PC-03 | Audit / Observability / Jobs | Platform | **Complete** | §2.4 | G-L5 |
| F-PC-04 | Compliance DSAR | Platform | **Complete** | §2.4 | G-L5 |
| F-PC-05 | 2FA Policy 写面板 | Platform | **Complete** | §2.4 | G-L5 |
| F-PC-06 | Backup 专页 | Platform | **Complete** | §2.4 | G-L5 |

**统计：** Complete **40** · Partial **0** · Missing **0** · 合计 **40**  
**Capability Complete = true** · 进度见 [Checklist](TT-ADMIN-CHECKLIST.md)

---

## Final Validation Evidence（机读 + 人工）

| 槽 | 结果 | 证据 |
|----|------|------|
| 映射一致性 | **PASS** | `scripts/gates/check-admin-functional-audit-mapping.py` |
| G-L5 | **PASS** | `scripts/dev/run-admin-l5-green.sh` |
| G-L5-PUB | **PASS** | `scripts/gates/check-official-ops-public-operations-ssot.sh` |
| **ADM-U01 本地** | **PASS** | `scripts/dev/smoke-admin-rbac-matrix-local.sh` |
| **ADM-U02 本地** | **PASS** | `scripts/dev/smoke-admin-adm-u02-local.sh` |
| **Admin pages 本地 smoke** | **PASS** | `scripts/dev/smoke-admin-pages-local.sh` |
| Staging L5 审计 | **WARN_P0_CLEAR** | `evidence/GO_staging_admin_l5_audit/`（`steward_apps` 404 非 P0） |
| **Staging 浏览器人工** | **PASS** | `evidence/GO_staging_admin_final_validation_walkthrough/20260702T003523Z/`（26/26 Tab · Content · Campaign 六类 · Test Policy 写入） |
| 全链编排 | **PASS_MACHINE** | `bash scripts/gates/run-admin-platform-40-verification.sh` |

**最新 bundle：** `evidence/GO_admin_platform_40_complete/20260701T180425Z/` · Staging 人工 `20260702T003523Z`

**Phase② Admin Final Validation：** **GO**（机器 PASS_MACHINE + Staging 浏览器 26/26 + API 写入探针）

**Enterprise Capability Complete：** **40/40** · **Dev & Validation：** **CLOSED** — [`TT-ADMIN-PLATFORM-CLOSURE-20260702.md`](TT-ADMIN-PLATFORM-CLOSURE-20260702.md)

---

**TT_ADMIN_FUNCTIONAL_AUDIT: CLOSED**
**TT_ADMIN_PLATFORM_DEV_VALIDATION: CLOSED**
**TT_PHASE2_ADMIN_FINAL_VALIDATION: GO**
