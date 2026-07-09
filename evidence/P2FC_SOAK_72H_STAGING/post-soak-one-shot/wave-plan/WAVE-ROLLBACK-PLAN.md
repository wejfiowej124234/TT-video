# Post-soak Deploy · Wave 顺序与回滚预案

**Verdict:** PASS
**HEAD:** `520abf396cce7baf3dcf39f71c1e77769e0086d8` · **freeze:** `520abf396cce…`

## 执行顺序（一次性）

1. [execution] TN-P1-010 independent (internal spine · pre-deploy staging OK)
2. [deploy] capture fly rollback snapshot (read-only)
3. [deploy] apply backlog + hotfix patches to working tree
4. [deploy] Wave1 deploy tt-api-staging
5. [deploy] Wave2 deploy tt-web-staging
6. [acceptance] p2fc-verify-staging-meta-availability.sh --strict
7. [acceptance] Deep Gate G02 --require-meta-green
8. [acceptance] run-phase2-testnet-post-soak-graduation-closure.sh

## 回滚

- **api_failure_after_wave1:** `fly deploy --image $(jq -r '.apps."tt-api-staging".previous_image' fly-rollback-snapshot.json) -a tt-api-staging`
- **web_failure_after_wave2:** `fly deploy --image $(jq -r '.apps."tt-web-staging".previous_image' fly-rollback-snapshot.json) -a tt-web-staging`
- **patch_revert:** `git apply -R evidence/GO_phase2_deploy_backlog/<stamp>/deploy-backlog.patch`
- **meta_hotfix_revert:** `git apply -R evidence/GO_phase2_deploy_backlog/meta-availability-hotfix.patch`
- **reference_drill:** `scripts/dev/run-phase3-fly-release-rollback-drill.sh --dry-run`
