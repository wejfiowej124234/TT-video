# PSG Production Cert evidence

**Machine key:** `TT_PSG_PRODUCTION_CERT`  
**Canonical file:** `PSG-PRODUCTION-CERT-LATEST.json`  
**Hard gate:** `scripts/ops/lib/psg-production-cert-hard-gate.sh` · `scripts/gates/check-psg-production-cert-required.sh`

## Generate (Owner)

```bash
bash scripts/gates/run-psg-production-cert.sh

PSG_ALLOW_DESTRUCTIVE_CERT=1 PSG_ALLOW_BOOTSTRAP_WRITE=1 \
  STAGING_API_BASE=https://tt-api-staging.fly.dev \
  STAGING_WEB_BASE=https://tt-web-staging.fly.dev \
  bash scripts/gates/run-psg-production-cert.sh
```

PASS requires admission trio + destructive_suite all PASS. PASS ≠ Production GO.
