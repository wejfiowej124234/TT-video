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

## One-shot timeline (T+min from COMPLETED)

- T+8min step-1 `tn_p1_010` risks=['BP-TN-02', 'BP-TN-01']
- T+12min step-2 `rollback_snapshot` risks=[]
- T+16min step-3 `apply_patches` risks=['BP-W1-01']
- T+20min step-4 `wave1_api_deploy` risks=['BP-W1-02', 'BP-W1-03']
- T+24min step-5 `wave2_web_deploy` risks=['BP-W2-02', 'BP-META-02']
- T+45min step-6 `meta_availability` risks=['BP-META-01']
- T+55min step-7 `g02_deep_gate` risks=[]
- T+65min step-8 `graduation` risks=[]
