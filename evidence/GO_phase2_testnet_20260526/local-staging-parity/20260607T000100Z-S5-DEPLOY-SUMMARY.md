# S5 · Staging 对齐部署证据

**Target commit:** 7b86e58b04eb45b18e9528f63dfefb3efeabba70  
**Deployed:** 2026-06-07 UTC

## 机读

```text
API /meta git_sha: 7b86e58b04eb45b18e9528f63dfefb3efeabba70
API /health: 200
check-staging-web-alignment: PASS=14 FAIL=0
Admin L5 staging audit: PASS (4/4 browser)
Phase ②.8 HAT: PAUSED (not run)
```

## 公开页

- https://tt-web-staging.fly.dev/ → 200
- https://tt-web-staging.fly.dev/market → 200
- https://tt-web-staging.fly.dev/admin/orders → 200 (SPA shell)

## 命令

```bash
bash scripts/dev/phase2-staging-fly-deploy-and-sync.sh
FLY_WEB_NO_CACHE=1 bash scripts/dev/deploy-tt-web-staging.sh
bash scripts/dev/check-staging-web-alignment.sh
bash scripts/dev/run-admin-l5-staging-audit.sh
```
