# `/traveltrust` 首页目视 QA（① 本地）

**相关收口：** 全站 L0 + **`/`** Landing + 本页 L1/兑换 — [`../GO_local_marketing_front_closure/README.md`](../GO_local_marketing_front_closure/README.md) · 叙事页数据 defer — [`../GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md`](../GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md)

## 自动化（提交前必绿）

```bash
cd frontend
npx vitest run modules/traveltrust-home/traveltrustHomeVisualQa.test.ts modules/traveltrust-home/traveltrustHomeVisualQaManifest.test.ts
```

## 浏览器 e2e（P1 · 可自动子集）

需 Next `:3012` 已启动：

```bash
cd frontend
PLAYWRIGHT_REUSE_FE_SERVER=1 npm run e2e:traveltrust-home-modular-qa
```

截图输出：`frontend/evidence/traveltrust-home-visual-qa/e2e-runs/*.png`

## 产品手动勾选

SSOT：`frontend/lib/traveltrust/home/visualQaChecklist.ts`（10 项）

| id | 手动 PASS | 备注 |
|----|-----------|------|
| globe-entrance | [ ] | |
| hero-split-seam | [ ] | |
| landing-nav-sticky | [ ] | |
| below-fold-film-dividers | [ ] | |
| economy-cluster-atmosphere | [ ] | |
| theater-viewport-sync | [ ] | |
| hash-scroll | [ ] | |
| entry-gate | [ ] | 含读条时长 |
| reduced-motion | [ ] | OS 开 reduced-motion |
| grouped-footer | [ ] | |
