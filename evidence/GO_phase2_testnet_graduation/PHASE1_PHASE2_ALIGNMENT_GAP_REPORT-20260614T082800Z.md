# PHASE1 + PHASE2 Alignment Gap Report

**Stamp:** 20260614T082800Z  
**Review:** L5 Enterprise Consistency Review  
**SSOT:** Phase① `TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST` · Phase② `TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD`  
**Mode:** Reliability Freeze · **audit-only · no deploy**

**阶段口径：** ① → **②** → ③

---

## Final Pre-Graduation / Alignment Verdict

| 项 | 结论 |
|----|------|
| **Alignment Verdict** | **MISALIGNED_WORKING_TREE** |
| **Staging = HEAD commit** | ✅ yes (`5ab1f8ba2229…`) |
| **Staging = working tree (Local SSOT)** | ❌ **no** (278 modified · 1799 untracked) |
| **Phase② Pre-Graduation (non-soak)** | ✅ PRE_GRADUATION_CLEAR |
| **Blocking alignment gaps** | **4** (excl. soak-only) |

**grep:** `TT_PHASE1_PHASE2_ALIGNMENT: MISALIGNED_WORKING_TREE 20260614T082800Z`

---

## Aligned（已确认一致）

- ✅ HEAD git_sha = staging /meta git_sha
- ✅ check-staging-web-alignment PASS (CORS/Sepolia/NEXT_PUBLIC)
- ✅ CMS/Growth/Admin API parity PASS

---

## Gap Registry（Critical → Low）

| ID | Sev | Domain | Title | Fix (post-freeze) |
|----|-----|--------|-------|-------------------|
| ALIGN-001 | **Critical** | Version / Deploy | Working tree ≠ deployed staging commit | Post–Reliability-Freeze: commit or stash intentional delta |
| ALIGN-002 | **Critical** | Indexer / RPC | TN-P1-010 selector fix uncommitted (HEAD vs working tree) | Commit selector fix to HEAD |
| ALIGN-003 | **High** | Database / Migrations | Untracked SQL migrations on disk | Add migrations to git in dedicated commit |
| ALIGN-004a | **High** | Config / Meta | /meta missing governance_votes_token_address | Set GOVERNANCE_VOTES_TOKEN_ADDRESS (+ expose in ChainConfig meta) |
| ALIGN-004b | **High** | Config / Meta | /meta missing staking_address | Set GOVERNANCE_VOTES_TOKEN_ADDRESS (+ expose in ChainConfig meta) |
| ALIGN-005 | **Medium** | Observability | /meta build.deployed_at null | Set TRAVELTRUST_DEPLOYED_AT on Fly release |
| ALIGN-006 | **Medium** | Finance / PSP | Stripe test mode not surfaced in /meta | Ensure TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1 + sk_test_* on Fly |
| ALIGN-007 | **Medium** | Indexer | Uncommitted indexer.rs delta vs HEAD | Commit with TN-P1-010 bundle or split PR post-freeze. |
| ALIGN-009 | **Low** | Reliability / Graduation | TN-P1-009 P2FC 72h soak INFLIGHT | Wait soak |
| ALIGN-010 | **Low** | Governance / Chain | G08 live Sepolia stake DEFER_③ | Phase ③ mainnet / live TTG approve track. |

---

## Detail

### ALIGN-001 · Critical · Working tree ≠ deployed staging commit

- **Domain:** Version / Deploy
- **Observation:** 278 modified + 1799 untracked files vs HEAD 5ab1f8ba2229; staging /meta git_sha matches HEAD only.
- **Impact:** Local disk "latest" is not reproducible on staging via standard Fly deploy from HEAD; risk of historical snapshot drift vs developer working copy.
- **Fix:** Post–Reliability-Freeze: commit or stash intentional delta; S5 deploy API+Web from single commit; re-run alignment gate.

### ALIGN-002 · Critical · TN-P1-010 selector fix uncommitted (HEAD vs working tree)

- **Domain:** Indexer / RPC
- **Observation:** HEAD SELECTOR_ESCROW_OF=[0x87,0x90,0x6b,0x1e] vs working [0x83,0xa2,0x65,0xa7]; HEAD STATUS=[0x66,0x01,0xcb,0x31] vs working [0x20,0x0d,0x2e,0xd2]. Evidence TN-P1-010 CLOSED; staging reconcile compound_pass may pass via log path.
- **Impact:** Git HEAD still carries wrong eth_call selectors; redeploy from HEAD without commit would regress indexer RPC reads.
- **Fix:** Commit selector fix to HEAD; after freeze: redeploy tt-api-staging; re-run TN-P1-010 reconcile evidence (do not re-run closed soak/D6).

### ALIGN-003 · High · Untracked SQL migrations on disk

- **Domain:** Database / Migrations
- **Observation:** 10 migration files untracked (CMS/Growth/guides/…); staging API parity PASS suggests DB may be ahead of git.
- **Impact:** Schema provenance not in VCS; fresh deploy/migrate from git-only clone would miss tables.
- **Fix:** Add migrations to git in dedicated commit; document staging migrate stamp in G2 evidence.

### ALIGN-004a · High · /meta missing governance_votes_token_address

- **Domain:** Config / Meta
- **Observation:** Registry governance_token_address=0xac2e29ac7089e4863c21daf232cf8bbb025d91ca; staging /meta returns null.
- **Impact:** FE meta guard / governance vote panels may lack on-chain token address; observability drift.
- **Fix:** Set GOVERNANCE_VOTES_TOKEN_ADDRESS (+ expose in ChainConfig meta); redeploy API; verify /meta.

### ALIGN-004b · High · /meta missing staking_address

- **Domain:** Config / Meta
- **Observation:** Registry region_steward_stake_pool_address=0x16f914f3d50f7aa02665589e715f94ca3b7ab47c; staging /meta returns null.
- **Impact:** FE meta guard / governance vote panels may lack on-chain token address; observability drift.
- **Fix:** Set GOVERNANCE_VOTES_TOKEN_ADDRESS (+ expose in ChainConfig meta); redeploy API; verify /meta.

### ALIGN-005 · Medium · /meta build.deployed_at null

- **Domain:** Observability
- **Observation:** TRAVELTRUST_DEPLOYED_AT not injected on tt-api-staging.
- **Impact:** D18 deploy discipline / rollback audit weaker.
- **Fix:** Set TRAVELTRUST_DEPLOYED_AT on Fly release; optional build-arg at deploy.

### ALIGN-006 · Medium · Stripe test mode not surfaced in /meta

- **Domain:** Finance / PSP
- **Observation:** check-staging-web-alignment WARN; TN-P1-005 evidence on file.
- **Impact:** PSP mode not machine-readable from meta; manual Fly secret verification required.
- **Fix:** Ensure TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1 + sk_test_* on Fly; extend meta onboarding block if needed.

### ALIGN-007 · Medium · Uncommitted indexer.rs delta vs HEAD

- **Domain:** Indexer
- **Observation:**  1 file changed, 162 insertions(+), 8 deletions(-)
- **Impact:** Local indexer behavior may differ from staging until committed and deployed.
- **Fix:** Commit with TN-P1-010 bundle or split PR post-freeze.

### ALIGN-009 · Low · TN-P1-009 P2FC 72h soak INFLIGHT

- **Domain:** Reliability / Graduation
- **Observation:** Not a local↔staging skew; wall-clock graduation gate.
- **Impact:** TT_TESTNET_GRADUATION remains OPEN until COMPLETED.json.
- **Fix:** Wait soak; post-soak graduation closure only.

### ALIGN-010 · Low · G08 live Sepolia stake DEFER_③

- **Domain:** Governance / Chain
- **Observation:** Matrix DEFER_③ · fork write PASS; intentional phase boundary.
- **Impact:** None for ② alignment if documented.
- **Fix:** Phase ③ mainnet / live TTG approve track.


---

## Remaining Blockers Registry（机读）

See `PHASE1_PHASE2_ALIGNMENT_GAP_REPORT-20260614T082800Z.json` · `remaining_blockers_registry`

**Reliability Freeze 纪律：** 本报告 **不** 触发 deploy / 不重跑 TN-P1-010·D6 已关闭项 · soak 自然完成后仅 post-soak graduation。

**诚实边界：** Staging 忠实反映 **已提交 HEAD**；工作区未提交变更 **不在** 测试网。② 对齐 **≠** ③ Production GO。
