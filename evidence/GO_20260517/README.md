# 十日首发 · 发布证据包 · GO_20260517

**阶段：** ① **PI-1 清单已收口** · ② **PI-2 行均已 closed/defer（无 open）** · ③ **PI-3 全部 defer** · 签字随时  
**真源：** docs/runbook/TT-MASTER-PUBLISH-GO-CHECKLIST-001.md v1.0.9

## D0 必填

| 项 | 值 |
|----|-----|
| **D0 起始日** | 2026-05-17 |
| **D10 目标日** | 2026-05-27（可 S-10 延至 2026-05-29） |
| **模式** | 单人 · 无 PR · 阶段一无 CI · 阶段二 CI e2e |
| **Fly staging** | API/FE: https://____.fly.dev（D4+ 填） |
| **Git tip** | dd52fe246d237b4f203a178a3ea3d9be6e626ab8 |

## 范围锁定

- [x] S-07、S-08（2026-05-17）
- [ ] S-01～S-06、S-09 — PH-1 后阶段二

## 逐日日志（阶段一）

| 日 | ID | 证据 |
|----|-----|------|
| D0 | S-07/08, A-06 | README, SCOPE |
| D1 | A-03 | artifacts/a03-cargo-test-api.log |
| D2 | A-07, J-01 | artifacts/a07-*.log, j01-run-check-04-routes.log |
| D3 | A-04/05/09 | artifacts/a04-*.md, a05-*, a09-* |
| D3 | A-08, PI-1 | local-smoke.md 全勾 · issues-phase1-local 闭卷 |
| D3 | PH-1 | 待签（PH1-FE-01～03 手验） |

CY 全矩阵 A-01: ../local-full-chromium-matrix-20260517-cx/matrix-console-rerun.txt

## M-00 总闸

未达成。签字：________ 日期：________

## D3 追加（A-08）

- 一键栈：`scripts\start-api-with-seed.bat`（Step 0a 端口 · 6d capabilities · 6e 匿名 GET 非 401）
- A-08：`local-smoke.md` 九行 [x]
- Playwright：smoke 31 + community 23 + admin 20 passed
- HTTP：smoke-ab-core-chain + vertical-slice 02/04
- TT-9618 PG：`a08-tt9618-pg-evidence.log`
- **PH-1：证据齐（FE-01～05）；`phase-signoff.md` 待签字（2026-05-18）**

## 阶段一出口（2026-05-17）

| 闸 | 状态 |
|----|------|
| PI-1 | issues-phase1-local.md P0/P1 全 closed |
| PH-1 | **待签**（见 phase-signoff.md） |
| 机读 | artifacts/pi1-closure-verify-20260517.log |
| 前端审计 | [issues-phase1-frontend-audit-20260517.md](./issues-phase1-frontend-audit-20260517.md) |
| 启动真源 | scripts/start-api-with-seed.bat → dev/start-api-with-seed.bat |

## 阶段二筹备（D4 · PH-1 签字后勾主表）

| 文件 | 用途 |
|------|------|
| `fly-api-staging.toml` / `deploy/fly/tt-api-staging/fly.toml` | B-11 |
| `fly-secrets.md` | B-12 清单 |
| `staging-env.md` | B-01 模板 |
| `staging-smoke.md` | ② 手验勾选 |
| `issues-phase2-staging.md` | PI-2 问题登记 |
| `RELEASE-SCOPE.md` | S-09 |
| `chain-addresses.md` | E-02 占位 |

**阶段二入口：** **须先** `phase-signoff.md` **PH-1 签字** → S-01、B-11… → 按 [issues-phase2-staging.md](./issues-phase2-staging.md) 闭卷 → **PH-2**。

- `artifacts/pi1-closure-verify-20260517.log` — PI-1 闭卷烟测


## 清单收口（2026-05-18）

- **PI-1**：`issues-phase1-local.md` 全行 closed
- **PI-2**：无 open；Fly 真网项为 **defer**
- **PI-3**：全部 **defer** 至生产窗
- **手跑**：`artifacts/local-ci-handrun-20260518.log`、`staging-r003-*`
