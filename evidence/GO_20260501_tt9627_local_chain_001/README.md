# Evidence bundle · `GO_20260501_tt9627_local_chain_001`

**Role:** Local **①** convergence pack for TT-9627 / TT-9626 alignment notes. **Not** Production **③** and **not** a final release sign-off.

**Git commit (bundle recorded at):** `72b2d06cde19326475c5893197729baf619f453d` (`72b2d06`)

---

## 1. Single primary `report.json` pointer (segment 3 machine gate)

**Path (repo-relative):** `frontend/evidence/GO_20260426_local_final_truth/report.json`

- **`environment.name`:** `local` (narrow closure; see R-002 for scope).
- **`release_gate`:** `GO` with **3** cases (LOCAL-GATE-*); **does not** represent full **93** matrix or staging regression.
- **Validate (must exit 0):**
  - `python scripts/validate-regression-report.py frontend/evidence/GO_20260426_local_final_truth/report.json --fail-on-no-go`
  - `bash scripts/gates/vertical-slice-tt9627-segment3-r002-validate.sh frontend/evidence/GO_20260426_local_final_truth/report.json`

---

## 2. TT-9627 §3.1 soft prereport (no `DATABASE_URL`)

**Path:** `evidence/GO_20260501_tt9627_local_chain_001/r002_soft/r002_iss007_prereport/report.json`

- **`release_gate`:** `PARTIAL_GO`, **43** cases (soft chain per `local-verify-r002-prereport-chain.sh` without DB).
- **Purpose:** Progress **①** on TT-9627 segment **3.1** prereport path; **strict** `NOT_RUN == 0` requires `DATABASE_URL` + migrations as documented in that script.
- **Does not** replace the **primary** pointer in section 1 for the narrow **GO** report used by `segment3-r002-validate` above.

---

## 3. TT-9626 phase map (honest, this bundle)

| Phase | Meaning (TT-9626) | This bundle |
|------:|-------------------|-------------|
| 0 | Freeze scope / signers | **Not** recorded in `go-live` section 0 for this bundle |
| 1 | Foundation | **Yes (①):** `cargo test -p traveltrust-api` **exit 0** (842 tests) — see `RUN-LOCAL-GATES.log` |
| 2 | Product spine | **Partial (①):** API smokes logged in `RUN-API-SMOKES.log` (requires API on default `BASE`); run `bash scripts/gates/vertical-slice-tt9627-segment1-api-smoke.sh` and `…segment2-hub-public-smoke.sh` with API on `BASE` when claiming |
| 3 | Rules / 96-21 | **Not** closed |
| 4 | Staging / 93 / R-002 wide | **Not** closed (primary `report.json` is narrow **local**) |
| 5 | Full `go-live` | **Partial (①):** `bash scripts/check-runbook-golive-doclink-gate.sh` **ok** (B-421 doclink); **not** full checklist |
| 6 | GO + deploy record | **Not** done |

---

## 4. Four-piece tracker (96-20 · 93 · go-live · P0 table)

| Piece | SSOT path | Status in this bundle |
|-------|-----------|------------------------|
| **96-20** | `docs/spec/96-20-前后端页面对齐与UI生产级审计报告.md` | **Not** row-level PASS; no matrix edits in this batch |
| **93** | `docs/spec/93-全站功能验证矩阵-域别回归清单.md` | **Not** executed as full domain regression for this bundle |
| **go-live** | `docs/go-live-checklist.md` | **Not** fully checked; B-421 / runbook–go-live **doclink** gate **passed** |
| **P0 gap table** | `docs/spec/缺口与待补-官方总表.md` | **P0 truth remains in that doc**; no end-state checkmarks written here |

**Conflict rule:** If any narrative disagrees with the gap table P0, **re-read** TT-9627 and `go-live`.

---

## 5. 96-15 deep audit (contract / DPA class)

**This round:** No external deep audit or contract/security appendix obligation was declared for this bundle.

**Release-note one-liner (96-15 section 3 P0 minimal row):** **N/A — 本轮未声明对外深度审计/DPA 义务；未按 96-15 文首何时必跑执行 Tier A+B+C 全量留证。**

---

## 6. Reproducible commands (①)

From repo root:

```bash
git rev-parse HEAD
cargo test -p traveltrust-api
bash scripts/gates/vertical-slice-tt9627-segments-456-spec-presence.sh
python scripts/validate-regression-report.py frontend/evidence/GO_20260426_local_final_truth/report.json --fail-on-no-go
bash scripts/gates/vertical-slice-tt9627-segment3-r002-validate.sh frontend/evidence/GO_20260426_local_final_truth/report.json
bash scripts/check-runbook-golive-doclink-gate.sh
TRAVELTRUST_LOCAL_R002_EVIDENCE_DIR=evidence/GO_20260501_tt9627_local_chain_001/r002_soft \
  bash scripts/gates/local-verify-r002-prereport-chain.sh
bash scripts/gates/vertical-slice-tt9627-segment1-api-smoke.sh
bash scripts/gates/vertical-slice-tt9627-segment2-hub-public-smoke.sh
```

**Logged batch:** `RUN-LOCAL-GATES.log` (cargo + segments 456 + segment3 validate + B-421).

---

## 7. No false completion

Do **not** present this bundle as **②** testnet/staging or **③** production GO. See `CONTRIBUTING.md` (no false completion) and TT-9628 0.0.5 (`docs/runbook/TT-9628-main-line-vs-branch-lines-delivery.md`).

**Release Owner:** Add **发版窗口 / 横切 PR 范围** here when scope is frozen; only then may end-state checkmarks and **③** wording be added with matching evidence.


---

## 8. Bundle files

| File | Purpose |
|------|---------|
| `README.md` | Human audit narrative (this file) |
| `MANIFEST.json` | Machine-readable primary `report.json` pointer + commit |
| `RUN-LOCAL-GATES.log` | `cargo test` + TT-9627 segments **4–6** + segment **3** validate + B-421 |
| `RUN-API-SMOKES.log` | TT-9627 segments **1–2** API smokes (requires listening API) |
| `r002_soft/` | TT-9627 **3.1** soft ISS-007 prereport output (`PARTIAL_GO`) |


---

## 9. Outstanding / blocked gates (not run green in this batch)

| Gate | Command | Result |
|------|---------|--------|
| Legacy path SSOT (broadcast chain step 1) | `python3 scripts/check_no_legacy_staking_path_as_ssot.py` | **exit 49** (no stdout in this environment; inspect script + `config/ci/legacy_path_ssot_rules.v1.json` and worktree hits) |
| Full `broadcast-batch-all-required.sh` | `bash scripts/gates/broadcast-batch-all-required.sh` | **blocked** by the above |

**Strict TT-9627 §3.1** (`DATABASE_URL` + `sqlx migrate` + `NOT_RUN == 0`) | `bash scripts/gates/local-verify-r002-prereport-chain.sh` with DB | **Not** claimed in this bundle (soft prereport only).

**`run-production-gate-local.sh`** | Full local production gate | **Not** run (requires Postgres + optional E2E); do **not** equate this bundle with that script’s `PRODUCTION_GATE_LOCAL` conclusion.


### Update — `broadcast-batch-all-required`

After adding **`scripts/gates/_resolve_python_bin.sh`** and wiring **`broadcast-batch-{1,2,3}-blockers.sh`** + **`broadcast-batch-all-required.sh`** to honour **`PYTHON_BIN`** (fallback **`python`** when **`python3`** is a broken shim), the following gate was re-run successfully:

```bash
bash scripts/gates/broadcast-batch-all-required.sh
# exit 0 — legacy SSOT + broadcast Batch 1–3
```

**Note:** Section 9 above recorded an earlier **exit 49** failure caused by **`python3`** on this host; treat this update as the current truth for that gate.


---

## 10. Strict TT-9627 §3.1 / R-002 prereport (`DATABASE_URL` set)

**Attempted** (with Docker Postgres healthy + `P3_CHAIN_OFF=1`):

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export P3_CHAIN_OFF=1
export TRAVELTRUST_LOCAL_R002_EVIDENCE_DIR='evidence/GO_20260501_tt9627_local_chain_001/r002_strict'
bash scripts/gates/local-verify-r002-prereport-chain.sh
```

**Outcome:** **`gen-r002-iss007-prereport.py`** rewrote **`r002_strict/r002_iss007_prereport/report.json`** with **`release_gate: NO_GO`** — all **43** anchors **FAIL** because each **`cargo test -p traveltrust-api matrix_93_*`** run matched **0** tests (**842 filtered out**). Example evidence: **`…/D-IDX-001/notes.md`**.

**Code fix in this batch:** **`scripts/validate-regression-report.py`** again accepts **`--fail-on-case-not-run`** (CI / `build.yml` / `local-verify-r002-prereport-chain.sh` were out of sync). Narrow report check:

`python scripts/validate-regression-report.py frontend/evidence/GO_20260426_local_final_truth/report.json --fail-on-no-go --fail-on-case-not-run` → **exit 0**.

**Next engineering step (not done here):** align **`gen-r002-iss007-prereport.py`** matrix filter strings with current **`crates/api`** test names / feature flags so anchors run ≥1 test each, then re-run the strict chain until **`PASS==43`** and **`release_gate: GO`**.


**Engineering follow-up (root cause of 0 tests):** `crates/api/src/routes/internal_indexer_admin_db_api_tests.rs` is **not** wired in `routes/mod.rs` (intentionally or by omission). A trial `#[cfg(test)] mod internal_indexer_admin_db_api_tests;` **does not compile** against current `it_db_pool`, `insert_user`, and `UserRow` — the file needs a **dedicated repair PR** before strict ISS-007 can go green locally.


### Update — matrix `D-IDX-001` / `D-ADM-003` / `A-ENV-001` wired + `apply_api_migrations` exported

- **`crates/api/src/db/mod.rs`**: `mod migrate_embed` + **`pub use migrate_embed::apply_api_migrations`** (fixes **`it_db_pool`** and any **`crate::db::apply_api_migrations`** import).
- **`crates/api/src/main.rs`**: **`#[cfg(test)] mod it_db_pool;`**
- **`crates/api/src/routes/mod.rs`**: **`#[cfg(test)] mod internal_indexer_admin_db_api_tests;`**
- **`internal_indexer_admin_db_api_tests.rs`**: **`UserRow`** / **`insert_user`** aligned with current **`chain_off`** / **`users_sessions`**.

**`cargo test -p traveltrust-api`**: **857** passed (was 842).

**Strict `local-verify-r002-prereport-chain.sh`** (with `DATABASE_URL`): **`release_gate` still `NO_GO`** — **3 / 43** anchors **PASS** (**`D-IDX-001`**, **`D-ADM-003`**, **`A-ENV-001`**); remaining **40** still **FAIL** (other ISS-007 anchors map to **separate** DB/API test modules not yet wired into the test binary).

