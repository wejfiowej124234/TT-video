# Phase ② · Human Acceptance Sprint Report

**stamp:** `20260611T121915Z`  
**overall:** **PASS**  
**Phase ③ Review:** **REQUESTED**  

> 四角色真人视角 · ① 本地 + ② 测试网 · **≠ Production GO**

## Role matrix

| 角色 | ① 本地 | ② 测试网 | 收口 |
|------|--------|----------|------|
| **旅行者** | PASS | PASS | ✅ PASS |
| **向导** | PASS | PASS | ✅ PASS |
| **管理员** | PASS | PASS | ✅ PASS |
| **收购/运营** | PASS | PASS | ✅ PASS |

## Staging gaps（② · 收购/运营未 PASS 时常见）

若 **② 收购/运营 = FAIL** 且 Admin CMS/Growth/Official 路由 **HTTP 404**：
staging API 尚未部署 `20260607120000`～`20260608120000` 管理栈；须 **Fly staging 重新部署当前 API** 后再跑 sprint。

复跑：

```bash
bash scripts/dev/record-phase2-human-acceptance-sprint-evidence.sh
```

前置：① `TRAVELTRUST_MANUAL_ACCEPTANCE=1 scripts/start-api-with-seed.bat` + Next :3012

## Targets

- **①** web=http://127.0.0.1:3012 api=http://127.0.0.1:8080
- **②** web=https://tt-web-staging.fly.dev api=https://tt-api-staging.fly.dev

## Machine lines

```text
TT_PHASE2_HUMAN_ACCEPTANCE_SPRINT: PASS 20260611T121915Z
TT_PHASE3_PRODUCTION_READINESS_REVIEW: REQUESTED 20260611T121915Z
```
