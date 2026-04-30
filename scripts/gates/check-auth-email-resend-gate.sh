#!/usr/bin/env bash
# 生产级门禁：当 TRAVELTRUST_EMAIL_TRANSPORT=resend 时，须同时配置 TRAVELTRUST_RESEND_API_KEY 与 TRAVELTRUST_RESEND_FROM。
# 用法（仓库根）：bash scripts/gates/check-auth-email-resend-gate.sh
# Windows 一键 Step 1d：scripts/gates/check-auth-email-resend-gate.ps1（同规则，免依赖 PATH 里的 WSL bash.exe）
# 若存在根 `.env`：先 source，再按 **`${VAR+x}`** 判定「进程启动前该变量是否已由调用方设置（含 `VAR=` 空串）」；若是，则**强制恢复**该键原值，使命令行前缀 **`TRAVELTRUST_EMAIL_TRANSPORT=resend`** 恒优先于 `.env` 中同键。
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# 根 `.env` 常含 `TRAVELTRUST_EMAIL_TRANSPORT=log|off`。**仅用 `-n` 无法区分**「变量未传入」与「`.env` 刚写入的值」。
# 故在 source 前记录：**若调用方已设置该变量（含显式空串 `VAR=`）**，则 source 后强制恢复，使命令行前缀 **`TRAVELTRUST_EMAIL_TRANSPORT=resend`** 恒优先于 `.env`。
_tt_transport_w=0
_tt_resend_key_w=0
_tt_resend_from_w=0
[[ "${TRAVELTRUST_EMAIL_TRANSPORT+x}" == "x" ]] && _tt_transport_w=1
[[ "${TRAVELTRUST_RESEND_API_KEY+x}" == "x" ]] && _tt_resend_key_w=1
[[ "${TRAVELTRUST_RESEND_FROM+x}" == "x" ]] && _tt_resend_from_w=1
_tt_transport_pre="${TRAVELTRUST_EMAIL_TRANSPORT-}"
_tt_resend_key_pre="${TRAVELTRUST_RESEND_API_KEY-}"
_tt_resend_from_pre="${TRAVELTRUST_RESEND_FROM-}"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1090,SC1091
  source "$ROOT/.env" || true
  set +a
fi
if [[ "$_tt_transport_w" -eq 1 ]]; then
  export TRAVELTRUST_EMAIL_TRANSPORT="${_tt_transport_pre}"
fi
if [[ "$_tt_resend_key_w" -eq 1 ]]; then
  export TRAVELTRUST_RESEND_API_KEY="${_tt_resend_key_pre}"
fi
if [[ "$_tt_resend_from_w" -eq 1 ]]; then
  export TRAVELTRUST_RESEND_FROM="${_tt_resend_from_pre}"
fi

v="$(echo "${TRAVELTRUST_EMAIL_TRANSPORT:-}" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
if [[ "$v" != "resend" ]]; then
  echo "OK: check-auth-email-resend-gate (TRAVELTRUST_EMAIL_TRANSPORT is not resend; skip)"
  exit 0
fi

if [[ -z "${TRAVELTRUST_RESEND_API_KEY:-}" ]]; then
  echo "ERROR: TRAVELTRUST_EMAIL_TRANSPORT=resend but TRAVELTRUST_RESEND_API_KEY is unset or empty." >&2
  exit 1
fi
if [[ -z "${TRAVELTRUST_RESEND_FROM:-}" ]]; then
  echo "ERROR: TRAVELTRUST_EMAIL_TRANSPORT=resend but TRAVELTRUST_RESEND_FROM is unset or empty." >&2
  exit 1
fi

echo "OK: check-auth-email-resend-gate (resend + key + from present)"
