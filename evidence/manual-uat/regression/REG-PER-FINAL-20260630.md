# REG-PER-FINAL-20260630

**Verified UTC:** `2026-06-30T13:41:07Z`

## ① PASS
```bash
bash scripts/dev/verify-cfg-drift-closure.sh
```

## ② PASS
```bash
bash scripts/dev/verify-staging-per-final.sh
```

Evidence: staging `registry_address` non-null · `deployment_profile=staging` · Fly secrets REGISTRY_ADDRESS + TRAVELTRUST_DEPLOYMENT_PROFILE set.
