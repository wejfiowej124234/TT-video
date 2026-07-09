# Post-soak Fault Exposure Model

- **verdict:** FAIL · soak_completed=False
- **MR12 lock:** FROZEN

## Hidden failure ranking (top 5)

1. **BP-META-01** @ meta_availability — FC-01 timeout mismatch — live 30s vs hotfix 120s [critical]
2. **BP-TN-02** @ tn_p1_010 — db/mod.rs drift surfaces at reconcile [high]
3. **BP-W1-02** @ wave1_api_deploy — compile OOM / health≠200 [high]
4. **BP-W1-03** @ wave1_api_deploy — market/escrow/guide consumer regression post API deploy [high]
5. **BP-W2-02** @ wave2_web_deploy — app/meta/route.ts timeout not live (130s) [high]

## High-risk post-soak paths

- step-1 TN-P1-010 + db/itineraries compound (BP-TN-02)
- step-4 Wave1 API itineraries hub unless MR-02 defer (BP-W1-02)
- step-6 meta strict FC-01 timeout mismatch (BP-META-01)
- step-8 G06-G08 blocked by prior cascade (B3)

## Competition failure paths

- **ARENA-T+8** T+8min `tn_p1_010` winner=BP-TN-02
- **ARENA-T+28** T+28min `wave1_api_deploy` winner=BP-W1-02
- **ARENA-T+45** T+45min `meta_availability` winner=BP-META-01

## T+ execution timeline (MR12)

- T+8min step-1 `tn_p1_010` p=0.72 cum=0.72 winner=BP-TN-02
- T+10min step-2 `rollback_snapshot` p=0.96 cum=0.6912 winner=None
- T+12min step-3 `apply_patches` p=0.78 cum=0.5391 winner=None
- T+28min step-4 `wave1_api_deploy` p=0.8 cum=0.4313 winner=BP-W1-02
- T+42min step-5 `wave2_web_deploy` p=0.83 cum=0.358 winner=None
- T+45min step-6 `meta_availability` p=0.7 cum=0.2506 winner=BP-META-01
- T+55min step-7 `g02_deep_gate` p=0.72 cum=0.1804 winner=None
- T+65min step-8 `graduation` p=0.9 cum=0.1624 winner=None

- **end_to_end_success_pct:** 16.2%
