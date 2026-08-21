# G2 Retrospective · Wave 2 Baseline Freeze

**Purpose:** Freeze G2 as an **immutable historical baseline** before G3 production go-live work.  
**Not:** re-running probes · new platform capabilities · changing G2 Formal sign-offs.

**Prerequisites (machine keys):**

| Key | Required |
|-----|----------|
| `TT_PRODUCTION_READINESS_G2_GATE` | **PASS** |
| `TT_WAVE2_FORMAL_ACCEPTANCE` | **COMPLETE** |
| `TT_G2_REALITY_VERIFICATION` | **COMPLETE** |

**Execute:**

```bash
bash scripts/dev/run-g2-retrospective.sh
```

**Validator:**

```bash
node scripts/dev/validate-g2-retrospective.cjs \
  --evidence-dir evidence/GO_production_readiness/g2-retrospective/<stamp>
```

---

## Artifacts (per stamp)

| File | Content |
|------|---------|
| `g2-evidence-index.json` | All G2 evidence roots, signoffs, blocker paths |
| `g2-machine-keys-snapshot.yaml` | G2-relevant machine keys at freeze time |
| `g2-master-matrix-snapshot.yaml` | Full Matrix copy (immutable reference) |
| `lessons-learned.md` / `.json` | Sync order, probe format, release train semantics |
| `g3-entry-checklist.json` | Production-only G3 scope + forbidden work classes |
| `g2-retrospective-signoff.json` | Verdict + `TT_G2_RETROSPECTIVE: COMPLETE` |

**Latest symlink:** `evidence/GO_production_readiness/g2-retrospective/latest/`

---

## G3 Entry Checklist (summary)

**SSOT：** [`G3-PRODUCTION-DOMAINS.md`](G3-PRODUCTION-DOMAINS.md) · [`registry/g3-production-domains.v1.json`](../../registry/g3-production-domains.v1.json)

G3 **只围绕 Production Environment** — 准入问题：是否直接影响 Production GO？

| Domain | 范围 |
|--------|------|
| **G3-01** | Domain · DNS · TLS · CDN · WAF · CORS |
| **G3-02** | Web3 USDC Escrow Payment · Wallet · Settlement · Indexer |
| **G3-03** | Backup · Restore · Recovery Drill · RPO · RTO |
| **G3-04** | Metrics · Logs · Alert · Synthetic · On-call |
| **G3-05** | Deployment · Rollback · Smoke · Rollout · Traffic Switch |
| **G3-06** | GO Decision Package · Final PER · Sign-off · Launch Checklist · **唯一 GO 判据** |

**全部冻结（除非 Architecture Review）：** Platform · Architecture · Builder · Registry · Guard · RuntimeIdentity · PCP

**G3 Release Train (unchanged):**

```text
G3 Reality Verification
        ↓
Evidence Integrity Audit
        ↓
G3 Formal Acceptance
        ↓
TT_PRODUCTION_READINESS_G3_GATE = PASS
        ↓
Production GO Decision
        ↓
TT_PRODUCTION_GO = GO
```

---

## Honest boundary

- G2 Retrospective **COMPLETE** ≠ G3 started ≠ Production GO
- G3 must **not mutate** G2 evidence paths or re-open G2 blockers without new PRM-* IDs
- ① local evidence chain ≠ ③ Production GO until G3 + Owner Decision

**SSOT Matrix:** [`registry/production-readiness-master-matrix.v1.yaml`](../../registry/production-readiness-master-matrix.v1.yaml)  
**Release Train:** [`TT-RELEASE-TRAIN-REALITY-VERIFICATION.md`](TT-RELEASE-TRAIN-REALITY-VERIFICATION.md)
