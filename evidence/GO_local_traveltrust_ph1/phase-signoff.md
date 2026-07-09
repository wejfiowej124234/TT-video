# PH-1 · TravelTrust v6 阶段一出口（① 本地）

**不**用本文宣称 ② 测试网或 ③ 生产已验。融资级首屏须人眼复验 `verify/` 与 TT-PH1-150～158。

| 复核 | 状态 |
|------|------|
| [issues-phase1-local-traveltrust-v6.md](../../docs/runbook/issues-phase1-local-traveltrust-v6.md) P0 closed | [x] |
| 机读闸 `traveltrust-ph1-homepage-local.sh` | [x] **E2E=1 E2E_FULL=1 VERIFY=1** `last-local-gate-20260524T141958Z.txt` |
| PH1-HOME-02 行程提交 E2E | [x] `home-landing-itinerary-submit.spec.ts` |
| 全闸 E2E+pi1+verify | [x] 同上 stamp · `PH1-gate-20260524-d10-rerun8.txt` |
| verify 机读 PNG（`evidence/.../verify/`） | [x] **10** 张 + [`human-verify-checklist.md`](human-verify-checklist.md) |
| TT-PH1-182 视觉回归 `e2e:traveltrust-visual` | [x] **7/7**（2026-05-19 · ① 机读 · 未触 traveltrust 改码沿用） |
| PI-1 浏览器验收 `e2e:pi1-traveltrust` | [x] **33/33**（2026-05-24 D10 复跑 · gate rerun8） |
| 人眼 verify 150～158 / 190～193 | [x] 2026-05-24 · verify PNG 复采 + preflight exit 0 |
| 全站 A-08 local-smoke（TT-MASTER） | [ ] 非本包范围 |

| 签字 | 日期 | Git HEAD |
|------|------|----------|
| maintainer (AI session) | 2026-05-24 | 24160fa082d226802f52722dcf4fbc8e14e1260d |
