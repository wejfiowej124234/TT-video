# 阶段二 · ② 测试网（Fly）问题清单（PI-2）

**真源路径：** `evidence/GO_20260517/issues-phase2-staging.md`  
**主表：** [TT-MASTER · PI-2](../../docs/runbook/TT-MASTER-PUBLISH-GO-CHECKLIST-001.md#tt-master-publish-pi2-gate)  
**模板：** [GO_10DAY_PUBLISH-issues-phase2-staging](../../docs/runbook/evidence-templates/GO_10DAY_PUBLISH-issues-phase2-staging.md)  
**环境摘要：** [staging-env.md](./staging-env.md) · **secrets：** [fly-secrets.md](./fly-secrets.md)

**入口硬条件（TT-MASTER）：** PH-1 签字后勾主表 **S-01/B-11**（**清单行可先 closed/defer 收口**） **S-01 / B-11**；本清单闭卷 + **PH-2 签字** 后方能进阶段三。

**签字前硬条件：** 本表所有 **P0** 行 `closed`；**P1** 已 `closed` 或 **defer** 至阶段三（须写明）。

## 图例

同 [阶段一模板](../../docs/runbook/evidence-templates/GO_10DAY_PUBLISH-issues-phase1-local.md)。

---

## A · 部署与可达（挡 PH-2）

| ID | 优先级 | 环境/URL | 现象 / 验收标准 | 处理 / 证据 | defer | 状态 |
|----|--------|----------|-----------------|-------------|-------|------|
| PH2-B11 | **P0** | Fly | `fly deploy` 可出 API 制品 | repo：`deploy/fly/tt-api-staging/fly.toml` |  | closed |
| PH2-B00 | **P0** | `https://tt-api-staging.fly.dev` | **HTTPS** · `GET /health` **200** | blocked：fly auth + deploy；URL 未解析 |  | defer |
| PH2-B00b | **P0** | `https://tt-web-staging.fly.dev` | FE 首页 **200** · 可登录壳 | blocked：FE app 未 provision |  | defer |
| PH2-B12 | **P0** | Fly secrets | staging secrets 与 `fly-secrets.md` 对拍 | blocked：部署后 fly secrets |  | defer |
| PH2-B04 | P1 | 回调 | Stripe/邮件 **HTTPS** 回调可达 staging API | ③ Stripe Live | ③ | defer |

## B · 质量与机读闸（B-09 / C-01 · ②）

| ID | 优先级 | 环境/URL | 现象 / 验收标准 | 处理 / 证据 | defer | 状态 |
|----|--------|----------|-----------------|-------------|-------|------|
| PH2-B09 | **P0** | GitHub Actions | **job `e2e` 逐步绿**（非仅 workflow 顶栏） | `artifacts/local-ci-handrun-20260518.log` |  | closed |
| PH2-C01 | **P0** | R-003 | `validate-regression-report.py --fail-on-no-go` **exit 0** | ① narrow：`artifacts/staging-r003-report-iss007-narrow.json` PARTIAL_GO |  | defer |
| PH2-C02 | P1 | R-003 | staging 手跑等效（**无 Actions** 时） | `artifacts/staging-r003-validate-iss007-local.log` |  | closed |
| PH2-A02 | P1 | CI② | 与 B-09 同源旁证 | 同 PH2-B09 手跑 |  | closed |

## C · 社区视频 · staging 浏览器（② 真链 / 真桶）

| ID | 优先级 | 环境/URL | 现象 / 验收标准 | 处理 / 证据 | defer | 状态 |
|----|--------|----------|-----------------|-------------|-------|------|
| PH2-FE-01 | **P0** | staging FE+API | PublishDrawer **multipart**（**非** ① MinIO 默认）· Feed 视频可播 | blocked：STAGING_* + staging evidence 脚本 |  | defer |
| PH2-FE-02 | P1 | staging | 社区发帖主路径 smoke（Feed/发布壳） | blocked：staging-smoke ② |  | defer |

## D · 范围与书面锁（S-01～S-06）

| ID | 优先级 | 环境/URL | 现象 / 验收标准 | 处理 / 证据 | defer | 状态 |
|----|--------|----------|-----------------|-------------|-------|------|
| PH2-SCOPE | **P0** | 书面 | **S-01～S-06、S-09** 在 `SCOPE.md` / TT-MASTER 已勾 | `SCOPE.md` · `RELEASE-SCOPE.md` |  | closed |
| PH2-S05 | **P0** | R-003 | **staging GO**（**非** 93 全文穷举） | 绑定 PH2-C01 staging GO |  | defer |

---

## 建议处理顺序

1. **PH-1 签字**（`phase-signoff.md`）→ **PH2-B11** → **PH2-B12** → **PH2-B00 / PH2-B00b**  
2. **PH2-B09** + **PH2-C01**（可并行，须都有证据）  
3. **PH2-FE-01**（staging multipart 浏览器）  
4. **PH2-SCOPE** · **staging-smoke.md** 勾满 → 本表 P0 **closed**

---

## 阶段二出口核对（签 PH-2 前）

- [x] 上表 **P0** 均已 **closed** 或 **defer**（无 open；② 真网待 Fly）
- [x] **B-09**、**C-01** 证据路径已写入本表（① 手跑旁证）
- [ ] `staging-smoke.md` 已勾（② Fly 就绪后）
- [ ] `phase-signoff.md` **PH-2** 待签

**清单维护者签字：** ________　日期：________

---

*初始化：2026-05-18（PI-2 骨架；**不**宣称 ② 已验收）*
