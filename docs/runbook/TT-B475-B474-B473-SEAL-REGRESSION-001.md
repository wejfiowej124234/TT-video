# TT-B475-B474-B473-SEAL-REGRESSION-001 · **B-474** **/** **B-476** **封口** **回归** **诊断**

**母表**：B-475（本 Runbook） **承载** **B-474** **证据** **口径** **与** **B-476** **编排** **封口** **回归** **说明**  
**对象封口**：**B-473** **[`TT-B473-SEAL-B460-TT-U03-001`](./TT-B473-SEAL-B460-TT-U03-001.md)** · `bash scripts/ops/b473-seal-b460-tt-u03.sh`

---

## §1 · 诊断结论（必读）

| 维度 | 说明 |
|------|------|
| **瓶颈** | **GET `/meta` 冷路径**（`e2e/epic-f-normal-release-real.spec.ts` **第一步**）。全栈串联跑时，**首包** **meta** **探测** **易** **吃满** **默认** **用例** **超时**，表现为 **Test timeout**。 |
| **非根因** | **`releaseSeedGuideSlotIfBlocked`** — **不是** **主导** **失败** **路径**。 |
| **非根因** | **业务断言**（订单流 / 评价契约等）— **不是** **主导** **失败** **形态**（非 **`expect`** **语义** **红** **字** **为主**）。 |

## §2 · 缓解（最小影响面）

- **仅** 在 **`frontend/e2e/epic-f-normal-release-real.spec.ts`** 内 **`test.setTimeout(60_000)`**。
- **勿** 改 **`frontend/playwright.config.ts`** **全局** **timeout**。

## §3 · 证据与 PASS 判定

- **B-474** **互证**：[evidence/b474_b473_seal_execution/pass_fail.md](../../evidence/b474_b473_seal_execution/pass_fail.md)
- **封口** **日志**：[evidence/b473_seal_b460_tt_u03/seal-run.log](../../evidence/b473_seal_b460_tt_u03/seal-run.log) — **末行** **`b473-seal-b460-tt-u03: ok`** **且** **脚本** **exit** **0** **⇒** **B-474** **PASS**
- **前置** **（** **全栈** **段** **）**：**API** **须** **能** **连** **上** **`.env`** **中** **`DATABASE_URL`** **（** **例** **：** **根目录** **`docker compose up -d`** **后** **Postgres** **监听** **5432** **）** **；** **否则** **步骤** **3** **即** **失败** **（** **与** **§1** **`GET` `/meta`** **诊断** **独立** **）** **。**

---

**文档版本**：1.0 · 2026-04-18
