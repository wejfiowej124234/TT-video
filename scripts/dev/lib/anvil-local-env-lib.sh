#!/usr/bin/env bash
# Shared ① Anvil local env hygiene: supersede ② Sepolia spine keys + API/frontend alias alignment.
# Sourced by fundstack-anvil-common.sh · ttg-anvil-common.sh · align-anvil-local-stack.sh

anvil_env_root() {
  if [[ -n "${ANVIL_ENV_ROOT:-}" ]]; then
    echo "$ANVIL_ENV_ROOT"
    return 0
  fi
  local here
  here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  echo "$(cd "$here/../../.." && pwd)"
}

# Keys that must not win dotenv first-read when ① Anvil blocks are active (② Sepolia spine).
ANVIL_SUPERSEDE_KEYS=(
  CHAIN_RPC_URL
  CHAIN_ID
  GOVERNOR_ADDRESS
  GOVERNANCE_TIMELOCK_ADDRESS
  TIMELOCK_ADDRESS
  FUND_STACK_TOKEN_ADDRESS
  REGION_VAULT_ADDRESS
  GOVERNANCE_TREASURY_P4CAP_ADDRESS
  LEGACY_TREASURY_ADDRESS
  RESERVE_VAULT_ADDRESS
  GUIDE_STAKING_POOL_ADDRESS
  PROVIDER_STAKING_POOL_ADDRESS
  STAKING_ADDRESS
  STEWARD_TTG_ADDRESS
  REDEMPTION_ASSET_ADDRESS
  COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS
  COUNTRY_POOL_LEDGER_PILOT_ADDRESS
  COUNTRY_POOL_LEDGER_ADDRESS
  COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS
  PAYMENT_TOKEN
  REGION_STEWARD_STAKE_POOL_ADDRESS
  GOVERNANCE_TOKEN_ADDRESS
  GOVERNANCE_VOTES_TOKEN_ADDRESS
  REGISTRY_ADDRESS
  ESCROW_FACTORY_ADDRESS
  FEE_ROUTER_ADDRESS
  GUIDE_STAKING_ADDRESS
  STAKING_PROVIDER_ADDRESS
  SETTLEMENT_TOKEN
  P3_CHAIN_OFF
  TTG_ANVIL_MOCK_ERC20
)

anvil_env_supersede_sepolia_top_level() {
  local root root_env key line tmp kept
  root="$(anvil_env_root)"
  root_env="$root/.env"
  [[ -f "$root_env" ]] || return 0

  tmp="$(mktemp)"
  kept="$(mktemp)"
  inside=0
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == "# --- BEGIN TT FUNDSTACK ANVIL LOCAL"* ]] \
      || [[ "$line" == "# --- BEGIN TT ANVIL LOCAL"* ]]; then
      inside=1
      printf '%s\n' "$line" >>"$kept"
      continue
    fi
    if [[ "$line" == "# --- END TT FUNDSTACK ANVIL LOCAL"* ]] \
      || [[ "$line" == "# --- END TT ANVIL LOCAL"* ]]; then
      inside=0
      printf '%s\n' "$line" >>"$kept"
      continue
    fi
    if [[ "$inside" -eq 1 ]]; then
      printf '%s\n' "$line" >>"$kept"
      continue
    fi
    for key in "${ANVIL_SUPERSEDE_KEYS[@]}"; do
      if [[ "$line" =~ ^[[:space:]]*${key}= ]] && [[ "$line" != \#* ]]; then
        line="# [superseded by ① Anvil local stack] $line"
        break
      fi
    done
    printf '%s\n' "$line" >>"$kept"
  done <"$root_env"
  mv "$kept" "$root_env"
  rm -f "$tmp"
  echo "anvil-env: superseded stray Sepolia/duplicate keys in $root_env (dotenv first-read safe)"
}

anvil_env_dedupe_managed_blocks() {
  local root root_env block_begin block_end tmp kept inside
  root="$(anvil_env_root)"
  root_env="$root/.env"
  [[ -f "$root_env" ]] || return 0

  block_begin="# --- BEGIN TT ANVIL LOCAL (managed by deploy-ttg-anvil-local.sh) ---"
  block_end="# --- END TT ANVIL LOCAL ---"
  tmp="$(mktemp)"
  kept="$(mktemp)"
  inside=0
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == "$block_begin" ]]; then
      if [[ "$inside" -eq 1 ]]; then
        continue
      fi
      inside=1
    fi
    if [[ "$inside" -eq 1 && "$line" == "$block_end" ]]; then
      inside=0
    fi
    if [[ "$inside" -eq 1 && "$line" == "$block_begin" ]]; then
      continue
    fi
    # Drop duplicate empty TT ANVIL blocks (keep first complete block only)
    if [[ "$line" == "$block_begin" ]]; then
      :
    fi
    printf '%s\n' "$line" >>"$kept"
  done <"$root_env"

  # Second pass: keep only last TT FUNDSTACK + last TT ANVIL blocks (include BEGIN markers).
  awk '
    /^# --- BEGIN TT FUNDSTACK ANVIL LOCAL/ { fs=1; fund=$0 "\n"; next }
    fs && /^# --- END TT FUNDSTACK ANVIL LOCAL/ { fs=0; fundblock=fund $0 "\n"; next }
    fs { fund=fund $0 "\n"; next }
    /^# --- BEGIN TT ANVIL LOCAL/ { as=1; anv=$0 "\n"; next }
    as && /^# --- END TT ANVIL LOCAL/ { as=0; anvblock=anv $0 "\n"; next }
    as { anv=anv $0 "\n"; next }
    { body=body $0 "\n" }
    END {
      gsub(/# --- BEGIN TT FUNDSTACK ANVIL LOCAL[^\n]*\n[\s\S]*?# --- END TT FUNDSTACK ANVIL LOCAL[^\n]*\n/, "", body)
      gsub(/# --- BEGIN TT ANVIL LOCAL[^\n]*\n[\s\S]*?# --- END TT ANVIL LOCAL[^\n]*\n/, "", body)
      printf "%s", body
      if (fundblock != "") printf "\n%s", fundblock
      if (anvblock != "") printf "\n%s", anvblock
    }
  ' "$root_env" >"$tmp" 2>/dev/null || cp "$kept" "$tmp"
  if [[ -s "$tmp" ]]; then
    mv "$tmp" "$root_env"
    echo "anvil-env: deduped TT FUNDSTACK / TT ANVIL managed blocks in $root_env"
  else
    rm -f "$tmp"
  fi
  rm -f "$kept"
}

anvil_env_append_api_aliases() {
  local root_env="$1"
  local guide="${GUIDE_STAKING_ADDRESS:-}"
  local provider="${STAKING_PROVIDER_ADDRESS:-}"
  [[ -f "$root_env" ]] || return 0
  [[ -n "$guide" ]] || return 0
  if ! grep -qE '^[[:space:]]*STAKING_ADDRESS=' "$root_env" 2>/dev/null \
    || grep -qE '^[[:space:]]*#.*STAKING_ADDRESS=' "$root_env" 2>/dev/null; then
    echo "STAKING_ADDRESS=${guide}" >>"$root_env"
  fi
  if [[ -n "$guide" ]]; then
    sed -i.bak -E "s/^[[:space:]]*STAKING_ADDRESS=.*/STAKING_ADDRESS=${guide}/" "$root_env" 2>/dev/null \
      || sed -i '' -E "s/^[[:space:]]*STAKING_ADDRESS=.*/STAKING_ADDRESS=${guide}/" "$root_env" 2>/dev/null \
      || true
    sed -i.bak -E "s/^[[:space:]]*GUIDE_STAKING_POOL_ADDRESS=.*/GUIDE_STAKING_POOL_ADDRESS=${guide}/" "$root_env" 2>/dev/null \
      || sed -i '' -E "s/^[[:space:]]*GUIDE_STAKING_POOL_ADDRESS=.*/GUIDE_STAKING_POOL_ADDRESS=${guide}/" "$root_env" 2>/dev/null \
      || true
  fi
  if [[ -n "$provider" ]]; then
    sed -i.bak -E "s/^[[:space:]]*PROVIDER_STAKING_POOL_ADDRESS=.*/PROVIDER_STAKING_POOL_ADDRESS=${provider}/" "$root_env" 2>/dev/null \
      || sed -i '' -E "s/^[[:space:]]*PROVIDER_STAKING_POOL_ADDRESS=.*/PROVIDER_STAKING_POOL_ADDRESS=${provider}/" "$root_env" 2>/dev/null \
      || true
  fi
  rm -f "${root_env}.bak" 2>/dev/null || true
}

# Remove commented-out superseded keys (garbage after align).
anvil_env_prune_superseded_comments() {
  local root root_env tmp
  root="$(anvil_env_root)"
  root_env="$root/.env"
  [[ -f "$root_env" ]] || return 0
  tmp="$(mktemp)"
  grep -vE '^# \[superseded by (① Anvil local stack|TT FUNDSTACK ANVIL LOCAL|TT ANVIL LOCAL)\]' "$root_env" >"$tmp" || true
  if [[ -s "$tmp" ]]; then
    mv "$tmp" "$root_env"
    echo "anvil-env: pruned superseded comment lines in $root_env"
  else
    rm -f "$tmp"
  fi
}

# Collapse repeated stray keys outside managed blocks (dotenv first-read: keep first active assignment).
anvil_env_prune_duplicate_top_level_keys() {
  local root root_env tmp
  root="$(anvil_env_root)"
  root_env="$root/.env"
  [[ -f "$root_env" ]] || return 0
  tmp="$(mktemp)"
  PYTHONIOENCODING=utf-8 python - "$root_env" "$tmp" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
out_path = Path(sys.argv[2])
lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
managed_markers = (
    "# --- BEGIN TT FUNDSTACK ANVIL LOCAL",
    "# --- BEGIN TT ANVIL LOCAL",
)
managed_end = (
    "# --- END TT FUNDSTACK ANVIL LOCAL",
    "# --- END TT ANVIL LOCAL",
)
DEDUPE_KEYS = {
    "B407_TRAVELER_PK", "B407_GUIDE_PK", "B407_FACTORY_DEPLOYER_PK",
    "ESCROW_MINT_TEST_TOKENS", "B407_ORDER_AMOUNT",
}
GLOBAL_DEDUPE_KEYS = {"P3_CHAIN_OFF"}

seen_outside: set[str] = set()
inside_managed = 0
parsed: list[tuple] = []

for line in lines:
    stripped = line.strip()
    if any(stripped.startswith(m) for m in managed_markers):
        inside_managed += 1
        parsed.append(("raw", line))
        continue
    if inside_managed > 0 and any(stripped.startswith(m) for m in managed_end):
        inside_managed -= 1
        parsed.append(("raw", line))
        continue
    if stripped and not stripped.startswith("#") and "=" in stripped:
        key = stripped.split("=", 1)[0].strip()
        if inside_managed > 0:
            parsed.append(("kv", key, line))
            continue
        if key in DEDUPE_KEYS:
            if key in seen_outside:
                continue
            seen_outside.add(key)
        parsed.append(("raw", line))
        continue
    parsed.append(("raw", line))

last_global: dict[str, int] = {}
for i, item in enumerate(parsed):
    if item[0] == "kv" and item[1] in GLOBAL_DEDUPE_KEYS:
        last_global[item[1]] = i

out: list[str] = []
for i, item in enumerate(parsed):
    if item[0] == "kv":
        key = item[1]
        if key in GLOBAL_DEDUPE_KEYS and last_global.get(key) != i:
            continue
        out.append(item[2])
    else:
        out.append(item[1])

text = "\n".join(out)
if lines and lines[-1] != "":
    text += "\n"
out_path.write_text(text, encoding="utf-8")
PY
  if [[ -s "$tmp" ]]; then
    mv "$tmp" "$root_env"
    echo "anvil-env: pruned duplicate top-level keys (B407/ESCROW_MINT/P3_CHAIN_OFF) in $root_env"
  else
    rm -f "$tmp"
  fi
}
