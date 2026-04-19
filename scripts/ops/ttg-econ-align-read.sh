#!/usr/bin/env bash
# **TTG 经济对齐 · 链上只读一键（纯 cast）**
#
# **对应文档**：`docs/runbook/TT-GOV-TOKEN-ECON-ALIGN-001.md` **§3**
#
# **做什么**：对 **`GovernanceVotesToken`（TTG）** 做 **`totalSupply`**、**金库 `balanceOf`**、
# **可选若干地址 `balanceOf`**，落盘 **`chain_reads.json`** + **`compare.md`** 人工对照模板。
#
# **不做什么**：**不** 调用 **`GET /meta`** **或** **indexer** —— **N1** **须** **与** **API** **投影** **解耦**（见 Runbook **§3**）。
#
# **依赖**：**`cast`**（Foundry）、**`python3`**
#
# **必填环境变量**
#   **`CHAIN_RPC_URL`**
#   **`GOVERNANCE_TOKEN_ADDRESS`**（或与仓库一致的 **`GOVERNANCE_VOTES_TOKEN_ADDRESS`** 回退）
#   **`TREASURY_ADDRESS`**
#
# **可选**
#   **`TTG_ECON_NO_AUTOLOAD_ENV=1`** — 不 source **`$ENV_FILE`**（仅用当前 shell 已 export 的变量）
#   **`TTG_ECON_BALANCE_ADDRESSES`** — 逗号分隔的额外地址（团队/空投等），与金库一并写入 **`top_holders`**
#   **`ENV_FILE`** — 默认 **`$REPO_ROOT/.env`**
#
# **退出码**：**0** 成功 **|** **1** 参数/依赖 **|** **2** **`cast`** **失败**
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

die() { echo "ttg-econ-align-read: $*" >&2; exit 1; }

norm_addr() {
  local x="${1#0x}"
  printf '0x%s' "$(printf '%s' "$x" | tr '[:upper:]' '[:lower:]')"
}

to_dec() {
  local x="$1"
  x="$(printf '%s' "$x" | tr -d '\r\n ')"
  [[ -z "$x" ]] && { echo "0"; return 0; }
  if [[ "$x" == 0x* || "$x" == 0X* ]]; then
    cast to-dec "$x"
  else
    printf '%s' "$x"
  fi
}

# **cast** 大 **uint256** 可能输出 **`DEC [1e25]`** **一行**；只取首列并去掉 **`[`** **后缀**，再交给 **to_dec** **/** **Python**。
normalize_cast_uint_line() {
  printf '%s' "$1" | head -1 | awk '{print $1}' | tr -d '\r\n ' | sed 's/\[.*$//'
}

if [[ "${TTG_ECON_NO_AUTOLOAD_ENV:-0}" != "1" ]]; then
  ENV_FILE="${ENV_FILE:-${ROOT}/.env}"
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    . "$ENV_FILE"
    set +a
  fi
fi

command -v cast >/dev/null 2>&1 || die "cast (Foundry) not in PATH"
PY=""
if command -v python3 >/dev/null 2>&1 && python3 -c "pass" 2>/dev/null; then
  PY=python3
elif command -v python >/dev/null 2>&1 && python -c "pass" 2>/dev/null; then
  PY=python
else
  die "python3 or python required (Windows Store python3 stub is not sufficient)"
fi

RPC="${CHAIN_RPC_URL:-}"
TOK_RAW="${GOVERNANCE_TOKEN_ADDRESS:-${GOVERNANCE_VOTES_TOKEN_ADDRESS:-}}"
TR_RAW="${TREASURY_ADDRESS:-}"

[[ -n "$RPC" ]] || die "CHAIN_RPC_URL unset"
[[ -n "$TOK_RAW" ]] || die "GOVERNANCE_TOKEN_ADDRESS unset (legacy: GOVERNANCE_VOTES_TOKEN_ADDRESS)"
[[ -n "$TR_RAW" ]] || die "TREASURY_ADDRESS unset"

TOK="$(norm_addr "$TOK_RAW")"
TR="$(norm_addr "$TR_RAW")"

RUN_UTC="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="${TTG_ECON_OUT_DIR:-${ROOT}/evidence/ttg_econ_align/run_${RUN_UTC}}"
mkdir -p "$OUT_DIR"
RUN_LABEL="$(basename "$OUT_DIR")"

JSON_OUT="${OUT_DIR}/chain_reads.json"
MD_OUT="${OUT_DIR}/compare.md"

TMP_HOLDERS="$(mktemp)"
trap 'rm -f "$TMP_HOLDERS"' EXIT

_seen_list=()
add_holder_line() {
  local addr="$1"
  local n i
  n="$(norm_addr "$addr")"
  for i in "${_seen_list[@]:-}"; do
    [[ "$i" == "$n" ]] && return 0
  done
  _seen_list+=("$n")
  local bal_hex
  if ! bal_raw="$(cast call "$TOK" "balanceOf(address)(uint256)" "$n" --rpc-url "$RPC" 2>/dev/null)"; then
    die "cast balanceOf failed for $n"
  fi
  local bal_dec
  bal_dec="$(to_dec "$(normalize_cast_uint_line "$bal_raw")")"
  printf '%s %s\n' "$n" "$bal_dec" >> "$TMP_HOLDERS"
}

add_holder_line "$TR"
if [[ -n "${TTG_ECON_BALANCE_ADDRESSES:-}" ]]; then
  IFS=',' read -r -a _extras <<< "${TTG_ECON_BALANCE_ADDRESSES}"
  for x in "${_extras[@]}"; do
    x="${x//[[:space:]]/}"
    [[ -z "$x" ]] && continue
    add_holder_line "$x"
  done
fi

if ! CID_HEX="$(cast chain-id --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n ')"; then
  die "cast chain-id failed (check CHAIN_RPC_URL)"
fi
CID_DEC="$(to_dec "$CID_HEX")"

if ! BLOCK_RAW="$(cast block-number --rpc-url "$RPC" 2>/dev/null | tr -d '\r\n ')"; then
  die "cast block-number failed"
fi
BLOCK_DEC="$(to_dec "$BLOCK_RAW")"

TS_UNIX="$(date -u +%s)"

if ! SUPPLY_RAW="$(cast call "$TOK" "totalSupply()(uint256)" --rpc-url "$RPC" 2>/dev/null)"; then
  die "cast totalSupply failed"
fi
SUPPLY_DEC="$(to_dec "$(normalize_cast_uint_line "$SUPPLY_RAW")")"

if ! TR_BAL_RAW="$(cast call "$TOK" "balanceOf(address)(uint256)" "$TR" --rpc-url "$RPC" 2>/dev/null)"; then
  die "cast balanceOf(TREASURY) failed"
fi
TR_BAL_DEC="$(to_dec "$(normalize_cast_uint_line "$TR_BAL_RAW")")"

export TTG_JSON_CHAIN_ID="$CID_DEC"
export TTG_JSON_TOKEN="$TOK"
export TTG_JSON_TOTAL_SUPPLY="$SUPPLY_DEC"
export TTG_JSON_TREASURY_BALANCE="$TR_BAL_DEC"
export TTG_JSON_BLOCK="$BLOCK_DEC"
export TTG_JSON_TS="$TS_UNIX"
export TTG_JSON_HOLDERS_FILE="$TMP_HOLDERS"

"$PY" <<'PY' >"$JSON_OUT"
import json, os

def _int_env(k: str) -> int:
    return int(os.environ[k].strip(), 10)

holders: list[dict] = []
path = os.environ["TTG_JSON_HOLDERS_FILE"]
with open(path, encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        parts = line.split(None, 1)
        if len(parts) != 2:
            continue
        addr, bal = parts[0], parts[1]
        holders.append({"address": addr, "balance": bal})

holders.sort(key=lambda h: int(h["balance"], 10), reverse=True)

out = {
    "chain_id": _int_env("TTG_JSON_CHAIN_ID"),
    "token": os.environ["TTG_JSON_TOKEN"],
    "total_supply": os.environ["TTG_JSON_TOTAL_SUPPLY"],
    "treasury_balance": os.environ["TTG_JSON_TREASURY_BALANCE"],
    "top_holders": holders,
    "block_number": _int_env("TTG_JSON_BLOCK"),
    "timestamp": _int_env("TTG_JSON_TS"),
}
print(json.dumps(out, indent=2, ensure_ascii=False))
PY

cat >"$MD_OUT" <<EOF
## TTG 经济对齐（人工对照）

**目录**：\`${RUN_LABEL}/\`（本文件与 \`chain_reads.json\` 同目录；相对仓库根 \`evidence/ttg_econ_align/\`）

### total_supply（链上）

- **脚本落盘（十进制 wei 字符串）**：\`${SUPPLY_DEC}\`（见 \`chain_reads.json\` → \`total_supply\`）

### 桶表总量（02 / 82）

- （填写本轮锁定的文档版本与桶表总量口径）

### Treasury 持仓

- **链上**：\`${TR_BAL_DEC}\`（\`chain_reads.json\` → \`treasury_balance\`）
- **台账「金库桶」应到位数额**：（填写）

### top_holders

- **说明**：\`top_holders\` 为 **金库** + **可选 \`TTG_ECON_BALANCE_ADDRESSES\`** 所列地址的 \`balanceOf\`；**不是** 全链 Top N 扫描。

### 结论

勾选其一并简述依据：

- [ ] **PASS**
- [ ] **SUSPECT**
- [ ] **FAIL**

### 说明（未披露 mint / 异常 holder / 占位桶）

- （填写）

---

**判据提示（与 Runbook §2.3 / §3.8 一致）**

- **PASS**：\`totalSupply\` 与设计一致；金库 / 已披露分配地址持仓符合预期。
- **SUSPECT**：分配与文档有偏差但可解释（测试 mint、中间态、明确占位未上链且已声明）。
- **FAIL**：未知 mint；关键地址持仓异常；与 02 / 82 明显冲突。
EOF

echo ""
echo "ttg-econ-align-read: wrote"
echo "  ${JSON_OUT}"
echo "  ${MD_OUT}"
echo ""
echo "Next: fill compare.md against governance-token/02 §2.5 and spec/82 §三之二."
