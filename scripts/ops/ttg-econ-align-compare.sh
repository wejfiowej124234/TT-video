#!/usr/bin/env bash
# **TTG 经济对齐 · 链上 vs API/DB 自动对账（N2 薄层）**
#
# **对应文档**：`docs/runbook/TT-GOV-TOKEN-ECON-ALIGN-001.md` **§3.9**（与 **§3** 链上只读 **并列**；**不** **替代** **N1** **纯 cast** **证据**）。
#
# **做什么**
#   1. 生成或复用 **`chain_reads.json`**（**`ttg-econ-align-read.sh`** **同源**）。
#   2. **`GET /meta`** → **`meta_snapshot.json`**，对拍 **`chain_id`**、**`governance_token_address`**、**`treasury_address`**。
#   3. **可选**：**`GET /api/v1/governance/pool`**（**FeeRouter 池** **SSOT** **腿**，与 **TTG** **总量** **正交**；见下）。
#   4. **可选**：**`governance_pool`** **表** **最新** **`balance`** **vs** **链上** **`balanceOf(FeeRouter)`**（须 **`DATABASE_URL`** **+** **`psql`** **+** **B-381** **同源环境变量**）。
#
# **不做什么**
#   - **不** **声称** **`governance_pool`** **行** **等于** **TTG** **`totalSupply`**（**池** **为** **FeeRouter** **上** **ERC20** **余额** **投影**）。
#   - **不** **替代** **`scripts/ops/b381-governance-pool-drift-reconcile-admin-overview-smoke.sh`** **（** **admin** **+** **internal reconcile** **深相等** **）**。
#
# **依赖**：**`cast`**、**`python3`**、**`curl`**；**`jq`** **（** **解析** **`/meta`** **）**。
#
# **环境（与 §3 同源）**
#   **`CHAIN_RPC_URL`**、**`GOVERNANCE_TOKEN_ADDRESS`**（或 **`GOVERNANCE_VOTES_TOKEN_ADDRESS`**）、**`TREASURY_ADDRESS`**
#   **`API_BASE_URL`** — 默认 **`http://127.0.0.1:8080`**（**`GET ${API_BASE_URL}/meta`**、**`GET …/api/v1/governance/pool`**）
#
# **可选**
#   **`TTG_ECON_CHAIN_READS_JSON`** — 已有 **`chain_reads.json`** **路径**（**跳过** **read** **子脚本**）
#   **`TTG_ECON_OUT_DIR`** — 输出目录（**默认** **`evidence/ttg_econ_align/run_<UTC>_compare`**）
#   **`TTG_ECON_NO_AUTOLOAD_ENV=1`**、**`TTG_ECON_BALANCE_ADDRESSES`** — 传给 **read** **子脚本**
#   **`TTG_ECON_COMPARE_SKIP_META=1`** — 不拉 **`/meta`**（**仅** **链上** **证据**；**verdict** **多为** **SUSPECT**）
#   **`TTG_ECON_INCLUDE_GOVERNANCE_POOL_GET=1`** — 额外拉 **`/api/v1/governance/pool`**
#   **`TTG_ECON_INCLUDE_GOVERNANCE_POOL_DB=1`** — **`psql`** **读** **`governance_pool.balance`** **并** **可选** **对拍** **FeeRouter** **链上** **余额**（**须** **`DATABASE_URL`**、**`FEE_ROUTER_ADDRESS`**、**`GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS`**）
#
# **退出码**：**0** **PASS** **|** **1** **依赖** **|** **2** **链上** **read** **失败** **|** **3** **`/meta`** **或** **`jq`** **失败** **|** **4** **FAIL** **|** **5** **SUSPECT**
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
OPS="${ROOT}/scripts/ops"

die() { echo "ttg-econ-align-compare: $*" >&2; exit 1; }

# If the caller exported `API_BASE_URL` for this run (e.g. `API_BASE_URL=http://127.0.0.1:8080 bash …`),
# preserve it across `.env` autoload — `.env` often pins `API_BASE_URL` to `PORT` and would clobber it.
_PRELOAD_API_BASE_URL="${API_BASE_URL-}"

if [[ "${TTG_ECON_NO_AUTOLOAD_ENV:-0}" != "1" ]]; then
  ENV_FILE="${ENV_FILE:-${ROOT}/.env}"
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    . "$ENV_FILE"
    set +a
  fi
fi

if [[ -n "${_PRELOAD_API_BASE_URL}" ]]; then
  API_BASE_URL="${_PRELOAD_API_BASE_URL}"
fi
unset _PRELOAD_API_BASE_URL

command -v cast >/dev/null 2>&1 || die "cast (Foundry) not in PATH"
PY=""
if command -v python3 >/dev/null 2>&1 && python3 -c "pass" 2>/dev/null; then
  PY=python3
elif command -v python >/dev/null 2>&1 && python -c "pass" 2>/dev/null; then
  PY=python
else
  die "python3 or python required (Windows Store python3 stub is not sufficient)"
fi
command -v curl >/dev/null 2>&1 || die "curl not in PATH"
command -v jq >/dev/null 2>&1 || die "jq not in PATH"

RUN_UTC="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="${TTG_ECON_OUT_DIR:-${ROOT}/evidence/ttg_econ_align/run_${RUN_UTC}_compare}"
mkdir -p "$OUT_DIR"

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

CHAIN_JSON=""
if [[ -n "${TTG_ECON_CHAIN_READS_JSON:-}" ]]; then
  CHAIN_JSON="${TTG_ECON_CHAIN_READS_JSON}"
  [[ -f "$CHAIN_JSON" ]] || die "TTG_ECON_CHAIN_READS_JSON not a file: $CHAIN_JSON"
  cp -f "$CHAIN_JSON" "${OUT_DIR}/chain_reads.json"
else
  TTG_ECON_OUT_DIR="$OUT_DIR" bash "${OPS}/ttg-econ-align-read.sh" || exit 2
  CHAIN_JSON="${OUT_DIR}/chain_reads.json"
fi

META_JSON="${OUT_DIR}/meta_snapshot.json"
POOL_JSON="${OUT_DIR}/governance_pool_snapshot.json"

# N2：与 **chain_reads.json** **同锚点** **→** **`GET /meta?ttg_econ_anchor_block=<N>`** **（** **`chain.ttg_econ_anchor`** **）** **；** **薄** **替代** **`GET /api/v1/internal/ttg-econ-anchor?…`** **（** **同** **JSON** **体** **）**
META_URL="${BASE}/meta"
ANCHOR_BLOCK="$(jq -r '.block_number // empty' "${OUT_DIR}/chain_reads.json" 2>/dev/null || true)"
if [[ -n "${ANCHOR_BLOCK:-}" && "$ANCHOR_BLOCK" != "null" ]]; then
  META_URL="${BASE}/meta?ttg_econ_anchor_block=${ANCHOR_BLOCK}"
fi

if [[ "${TTG_ECON_COMPARE_SKIP_META:-0}" != "1" ]]; then
  code_m="$(
    curl -sS -o "$META_JSON" -w "%{http_code}" \
      -H "Accept: application/json" \
      "${META_URL}"
  )"
  if [[ "$code_m" != "200" ]]; then
    echo "ttg-econ-align-compare: GET /meta HTTP ${code_m} (expected 200)" >&2
    head -c 800 "$META_JSON" >&2 || true
    echo >&2
    exit 3
  fi
  if ! jq -e . "$META_JSON" >/dev/null 2>&1; then
    echo "ttg-econ-align-compare: /meta body is not valid JSON" >&2
    exit 3
  fi
else
  echo '{"skipped":true,"reason":"TTG_ECON_COMPARE_SKIP_META=1"}' >"$META_JSON"
fi

if [[ "${TTG_ECON_INCLUDE_GOVERNANCE_POOL_GET:-0}" == "1" ]]; then
  code_p="$(
    curl -sS -o "$POOL_JSON" -w "%{http_code}" \
      -H "Accept: application/json" \
      "${BASE}/api/v1/governance/pool"
  )"
  if [[ "$code_p" != "200" ]]; then
    echo "ttg-econ-align-compare: WARN GET /api/v1/governance/pool HTTP ${code_p}" >&2
    echo '{"http_error":true,"code":'"$code_p"'}' >"$POOL_JSON"
  fi
else
  echo '{}' >"$POOL_JSON"
fi

DB_SNIP="${OUT_DIR}/governance_pool_db_snippet.json"
if [[ "${TTG_ECON_INCLUDE_GOVERNANCE_POOL_DB:-0}" == "1" ]]; then
  if [[ -z "${DATABASE_URL:-}" ]]; then
    die "TTG_ECON_INCLUDE_GOVERNANCE_POOL_DB=1 requires DATABASE_URL"
  fi
  command -v psql >/dev/null 2>&1 || die "psql not in PATH (required for DB leg)"
  if ! psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -tAc \
    "select coalesce(balance, '') from governance_pool order by updated_at desc nulls last limit 1" \
    >"${OUT_DIR}/.db_balance_raw.txt" 2>"${OUT_DIR}/.db_balance_err.txt"; then
    echo "ttg-econ-align-compare: psql governance_pool query failed:" >&2
    cat "${OUT_DIR}/.db_balance_err.txt" >&2 || true
    exit 1
  fi
  DB_BAL_RAW="$(tr -d '\r\n' <"${OUT_DIR}/.db_balance_raw.txt" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  FR="${FEE_ROUTER_ADDRESS:-}"
  POOL_TOK="${GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS:-}"
  CHAIN_FR_BAL_HEX=""
  if [[ -n "$FR" && -n "$POOL_TOK" ]]; then
    RPC="${CHAIN_RPC_URL:-}"
    [[ -n "$RPC" ]] || die "CHAIN_RPC_URL unset (needed for FeeRouter balance leg)"
    norm_pt="$(printf '0x%s' "$(printf '%s' "${POOL_TOK#0x}" | tr '[:upper:]' '[:lower:]')")"
    norm_fr="$(printf '0x%s' "$(printf '%s' "${FR#0x}" | tr '[:upper:]' '[:lower:]')")"
    if bal_hex="$(cast call "$norm_pt" "balanceOf(address)(uint256)" "$norm_fr" --rpc-url "$RPC" 2>/dev/null)"; then
      bal_hex="$(printf '%s' "$bal_hex" | tr -d '\r\n ')"
      CHAIN_FR_BAL_HEX="$bal_hex"
    fi
  fi
  "$PY" - "$DB_BAL_RAW" "$CHAIN_FR_BAL_HEX" <<'PY' >"$DB_SNIP"
import json, sys
db_raw, chain_hex = sys.argv[1], sys.argv[2]
out = {
    "db_balance_raw": db_raw or None,
    "fee_router_balance_of_ssot_token_hex": chain_hex or None,
}
print(json.dumps(out, ensure_ascii=False))
PY
else
  echo '{"skipped":true}' >"$DB_SNIP"
fi

export TTG_COMPARE_OUT_DIR="$OUT_DIR"
export TTG_COMPARE_BASE_URL="$BASE"
export TTG_ECON_INCLUDE_POOL_GET="${TTG_ECON_INCLUDE_GOVERNANCE_POOL_GET:-0}"
export TTG_ECON_INCLUDE_POOL_DB="${TTG_ECON_INCLUDE_GOVERNANCE_POOL_DB:-0}"
export TTG_ECON_COMPARE_POOL_CURRENCY="${TTG_ECON_COMPARE_POOL_CURRENCY:-0}"

set +e
"$PY" <<'PY'
import json, os, sys
from typing import Optional

out_dir = os.environ["TTG_COMPARE_OUT_DIR"]
base = os.environ["TTG_COMPARE_BASE_URL"]
include_pool_get = os.environ.get("TTG_ECON_INCLUDE_POOL_GET") == "1"
include_pool_db = os.environ.get("TTG_ECON_INCLUDE_POOL_DB") == "1"

def norm_addr(a: str) -> str:
    if not a:
        return ""
    a = a.strip().lower()
    if not a.startswith("0x"):
        a = "0x" + a
    return a

with open(os.path.join(out_dir, "chain_reads.json"), encoding="utf-8") as f:
    chain = json.load(f)
with open(os.path.join(out_dir, "meta_snapshot.json"), encoding="utf-8") as f:
    meta = json.load(f)
with open(os.path.join(out_dir, "governance_pool_snapshot.json"), encoding="utf-8") as f:
    pool = json.load(f)
with open(os.path.join(out_dir, "governance_pool_db_snippet.json"), encoding="utf-8") as f:
    db_snip = json.load(f)

tok_e = norm_addr(chain.get("token") or "")
tr_e = norm_addr(os.environ.get("TREASURY_ADDRESS") or "")

checks = []
verdict = "PASS"

skip_meta = bool(meta.get("skipped"))

if skip_meta:
    checks.append(
        {
            "name": "meta_fetch",
            "ok": None,
            "detail": "skipped_TTG_ECON_COMPARE_SKIP_META",
        }
    )
    verdict = "SUSPECT"
else:
    meta_cid = meta.get("chain", {}).get("chain_id")
    if meta_cid is None:
        checks.append({"name": "chain_id_meta_present", "ok": False, "detail": "missing"})
        verdict = "FAIL"
    else:
        m = str(meta_cid).strip()
        c = str(chain["chain_id"])
        ok = m == c
        checks.append(
            {
                "name": "chain_id_meta_vs_chain_reads",
                "ok": ok,
                "meta": m,
                "chain_reads": c,
            }
        )
        if not ok:
            verdict = "FAIL"

    contracts = meta.get("chain", {}).get("contracts")
    if contracts is None:
        checks.append(
            {
                "name": "meta_chain_contracts",
                "ok": None,
                "detail": "null_absent_not_configured",
            }
        )
        if verdict == "PASS":
            verdict = "SUSPECT"
    elif isinstance(contracts, dict):
        m_tok = norm_addr(str(contracts.get("governance_token_address") or ""))
        m_tr = norm_addr(str(contracts.get("treasury_address") or ""))
        ok_tok = bool(m_tok and tok_e and m_tok == tok_e)
        ok_tr = bool(m_tr and tr_e and m_tr == tr_e)
        checks.append(
            {
                "name": "governance_token_meta_vs_chain_reads",
                "ok": ok_tok,
                "meta": m_tok,
                "chain_reads_token": tok_e,
            }
        )
        checks.append(
            {
                "name": "treasury_address_meta_vs_env",
                "ok": ok_tr,
                "meta": m_tr,
                "env_treasury": tr_e,
            }
        )
        if not ok_tok or not ok_tr:
            verdict = "FAIL"

    ttea = meta.get("chain", {}).get("ttg_econ_anchor") if not skip_meta else None
    if not skip_meta and isinstance(ttea, dict):
        avail = ttea.get("available") is True
        checks.append(
            {
                "name": "ttg_econ_anchor_available",
                "ok": avail if avail else None,
                "error": ttea.get("error"),
                "block_number": ttea.get("block_number"),
            }
        )
        if not avail:
            if verdict == "PASS":
                verdict = "SUSPECT"
        else:
            cr_bn = chain.get("block_number")
            mb = ttea.get("block_number")
            if cr_bn is not None and mb is not None:
                ok_bn = int(cr_bn) == int(mb)
                checks.append(
                    {
                        "name": "anchor_block_meta_vs_chain_reads",
                        "ok": ok_bn,
                        "chain_reads_block": cr_bn,
                        "meta_block": mb,
                    }
                )
                if not ok_bn:
                    verdict = "FAIL"
            cr_ts = str(chain.get("total_supply") or "").strip()
            cr_tr = str(chain.get("treasury_balance") or "").strip()
            m_ts = str(ttea.get("total_supply") or "").strip()
            m_tb = str(ttea.get("treasury_balance") or "").strip()
            ok_ts = bool(cr_ts and m_ts and cr_ts == m_ts)
            ok_tb = bool(cr_tr and m_tb and cr_tr == m_tb)
            checks.append(
                {
                    "name": "total_supply_meta_vs_chain_reads",
                    "ok": ok_ts,
                    "chain_reads": cr_ts or None,
                    "meta": m_ts or None,
                }
            )
            checks.append(
                {
                    "name": "treasury_balance_meta_vs_chain_reads",
                    "ok": ok_tb,
                    "chain_reads": cr_tr or None,
                    "meta": m_tb or None,
                }
            )
            if not ok_ts or not ok_tb:
                verdict = "FAIL"
    elif not skip_meta:
        checks.append(
            {
                "name": "ttg_econ_anchor_present",
                "ok": False,
                "detail": "chain.ttg_econ_anchor missing",
            }
        )
        if verdict == "PASS":
            verdict = "SUSPECT"

compare_pool_currency = os.environ.get("TTG_ECON_COMPARE_POOL_CURRENCY") == "1"

if include_pool_get and compare_pool_currency and not pool.get("http_error"):
    cur = pool.get("currency")
    if cur is not None:
        pcur = norm_addr(str(cur))
        ok_cur = bool(pcur and tok_e and pcur == tok_e)
        checks.append(
            {
                "name": "governance_pool_currency_vs_chain_reads_token",
                "ok": ok_cur,
                "note": "optional_TTG_ECON_COMPARE_POOL_CURRENCY=1; pool_is_fee_router_track_not_TTG_total_supply",
                "pool_currency": pcur or None,
                "chain_reads_token": tok_e,
            }
        )
        if not ok_cur and pool.get("is_chain_ssot") is True:
            if verdict == "PASS":
                verdict = "SUSPECT"


def parse_u256_text(s: str) -> Optional[int]:
    t = (s or "").strip()
    if not t:
        return None
    if t.startswith(("0x", "0X")):
        return int(t, 16)
    try:
        return int(t, 10)
    except ValueError:
        pass
    try:
        return int(t, 16)
    except ValueError:
        return None


def parse_u256_cast_hex(s: str) -> Optional[int]:
    t = (s or "").strip()
    if not t:
        return None
    if not t.startswith(("0x", "0X")):
        t = "0x" + t
    try:
        return int(t, 16)
    except ValueError:
        return None


if include_pool_db:
    db_raw = (db_snip.get("db_balance_raw") or "").strip()
    chain_hex = (db_snip.get("fee_router_balance_of_ssot_token_hex") or "").strip()
    if not db_raw:
        checks.append(
            {
                "name": "governance_pool_db_balance_row",
                "ok": None,
                "detail": "empty_or_missing",
            }
        )
        if verdict == "PASS":
            verdict = "SUSPECT"
    elif not chain_hex:
        checks.append(
            {
                "name": "governance_pool_db_vs_chain_fee_router_balance",
                "ok": None,
                "detail": "chain_leg_missing_set_FEE_ROUTER_ADDRESS_and_GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS",
            }
        )
        if verdict == "PASS":
            verdict = "SUSPECT"
    else:
        db_i = parse_u256_text(db_raw)
        ch_i = parse_u256_cast_hex(chain_hex)
        ok = db_i is not None and ch_i is not None and db_i == ch_i
        checks.append(
            {
                "name": "governance_pool_db_vs_chain_fee_router_balance",
                "ok": ok,
                "note": "TEXT_balance_vs_cast_balanceOf_FeeRouter_B-381_numeric_parity",
                "db_balance_text": db_raw,
                "chain_fee_router_balance_hex": chain_hex,
            }
        )
        if not ok:
            verdict = "FAIL"

result = {
    "anchor": "TTG-ECON-ALIGN-COMPARE-V1",
    "verdict": verdict,
    "api_base_url": base,
    "chain_reads": {
        "chain_id": chain.get("chain_id"),
        "token": chain.get("token"),
        "total_supply": chain.get("total_supply"),
        "treasury_balance": chain.get("treasury_balance"),
        "block_number": chain.get("block_number"),
    },
    "checks": checks,
    "artifacts": {
        "chain_reads_json": "chain_reads.json",
        "meta_snapshot_json": "meta_snapshot.json",
        "governance_pool_snapshot_json": "governance_pool_snapshot.json",
        "governance_pool_db_snippet_json": "governance_pool_db_snippet.json",
    },
}

out_path = os.path.join(out_dir, "api_db_compare.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print(json.dumps(result, indent=2, ensure_ascii=False))

if verdict == "FAIL":
    sys.exit(4)
if verdict == "SUSPECT":
    sys.exit(5)
sys.exit(0)
PY
rc=$?
set -e

echo ""
echo "ttg-econ-align-compare: wrote ${OUT_DIR}/api_db_compare.json"
echo "ttg-econ-align-compare: exit ${rc}"
exit "$rc"
