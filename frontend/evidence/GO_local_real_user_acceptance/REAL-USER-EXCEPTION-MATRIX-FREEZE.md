# Real User Exception Matrix Sprint · ① 本地异常流矩阵（2026-06-09 · ACTIVE）

**阶段：① 本地** — 全新 `@traveltrust.acceptance` 账号 · **API 异常流矩阵**；矩阵 **exit 0** 后同批 **主链 UAT 复验**。**不**表示 ② 测试网 / ③ 生产 GO。

**代码真源：** `frontend/e2e/real-user-exception-matrix-sprint.spec.ts` · `frontend/e2e/helpers/realUserExceptionMatrixCorridor.ts`

**主链已冻结（禁止回流重构）：** [REAL-USER-ACCEPTANCE-SPRINT-FREEZE.md](./REAL-USER-ACCEPTANCE-SPRINT-FREEZE.md)

---

## 冻结结论（ACTIVE · 已收口）

| 项 | 状态 |
|----|------|
| **账号** | `*@traveltrust.acceptance` 全新注册；**禁止** seed / trust-gate |
| **矩阵** | 13 类异常/门闸（见下表）+ Step C 主链 UAT 复验 |
| **冻结日** | **2026-06-09** |
| **权威证据** | [`REAL-USER-EXCEPTION-MATRIX-SPRINT-20260609T235032Z.log`](./REAL-USER-EXCEPTION-MATRIX-SPRINT-20260609T235032Z.log) |
| **机读 OK** | `TT_REAL_USER_EXCEPTION_MATRIX_SPRINT_EVIDENCE: OK 20260609T235032Z` |

**维护期纪律：** 仅 bugfix · 数据链路 · i18n/a11y · 门闸对齐；**禁止**削弱矩阵或改写主链 10 步。

---



## 矩阵用例（与 Playwright 一致）



| # | 类别 | 断言 |

|---|------|------|

| 1 | 拒单 | 非指派向导 `accept` → `not_assigned_guide` 403 |

| 2 | 取消 | 接单前游客 `cancel` 200 |

| 3 | 取消幂等 | 第二次 `cancel` → `invalid_state` 409 |

| 4 | 超时 | `accept_window_expired` 410（短 `P3_ACCEPT_TTL_SECS`） |

| 5 | 超时 | `payment_window_expired` 410（短 `P3_PAYMENT_TTL_SECS`） |

| 6 | 重复支付 | escrowed 后再 `mock-pay` → `invalid_state` |

| 7 | 重复评价 | 第二次 `POST …/reviews` → `already_reviewed` |

| 8 | 完成幂等 | 第二次 `confirm-completion` → `invalid_state` |

| 9 | 冲突预约 | `guide_has_active_order` · `schedule_conflict` |

| 10 | 终版乐观锁 | `version_conflict` + `already_confirmed` |

| 11 | 未登录 | 写接口 401 |

| 12 | 非参与方/错角色 | `not_guide` · `not_tourist` · `forbidden` |



参考形态（**非**账号 SSOT）： [`escrow-p03-p06-exception-flows.spec.ts`](../../e2e/escrow-p03-p06-exception-flows.spec.ts)



---



## 机读验收（须 exit 0）



```bash

bash scripts/dev/record-real-user-exception-matrix-sprint-evidence.sh

```



**Step A：** `npx vitest run lib/escrow/realUserExceptionMatrixSprint.contract.test.ts`  

**Step B：** Playwright 异常矩阵（API 短 TTL）  

**Step C：** Playwright 主链 UAT 复验（`real-user-acceptance-sprint.spec.ts` · 默认 TTL）



末行须含：`TT_REAL_USER_EXCEPTION_MATRIX_SPRINT_EVIDENCE: OK`



---



## Phase ② 准入（矩阵 OK 后仍须清闸）



| 闸 | SSOT |

|----|------|

| G-0～G-4 | [`PHASE2-START-CHECKLIST.md`](../../../docs/runbook/PHASE2-START-CHECKLIST.md) |

| ② Not Started | [`PHASE2-REPOSITORY-STATUS.md`](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md) |



**诚实边界：** ① 异常矩阵 OK **≠** ② staging GO **≠** ③ Production GO。



---



## 互指



| 读者 | 文档 |

|------|------|

| 目录 | [README.md](./README.md) |

| 主链 sprint | [REAL-USER-ACCEPTANCE-SPRINT-FREEZE.md](./REAL-USER-ACCEPTANCE-SPRINT-FREEZE.md) |

| 机读模型 | `frontend/lib/escrow/realUserExceptionMatrixSprintModel.ts` |

