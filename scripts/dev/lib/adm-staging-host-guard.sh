#!/usr/bin/env bash
# Shared Staging host guards for ADM-U01 / ADM-U02 (Phase ②).
# Source from record-* / smoke-*-staging scripts — do not execute directly.

adm_staging__is_localhost_url() {
  local u="${1:-}"
  [[ -z "$u" ]] && return 1
  case "$u" in
    *127.0.0.1* | *localhost* | *"[::1]"* ) return 0 ;;
  esac
  return 1
}

adm_staging__is_localtunnel_url() {
  local u="${1:-}"
  [[ "$u" == *".loca.lt"* ]]
}

adm_staging_require_persistent_api_fe() {
  local api="${STAGING_API_BASE:-}"
  local fe="${STAGING_FE_BASE:-}"
  if [[ -z "$api" ]]; then
    echo "FAIL: STAGING_API_BASE required" >&2
    return 1
  fi
  if [[ -z "$fe" ]]; then
    echo "FAIL: STAGING_FE_BASE required for persistent Staging close" >&2
    return 1
  fi
  if adm_staging__is_localtunnel_url "$api" || adm_staging__is_localtunnel_url "$fe"; then
    echo "FAIL: persistent Staging forbids localtunnel (*.loca.lt); use Fly/staging HTTPS" >&2
    return 1
  fi
  if adm_staging__is_localhost_url "$api" || adm_staging__is_localhost_url "$fe"; then
    echo "FAIL: persistent Staging forbids localhost/127.0.0.1 in STAGING_API_BASE / STAGING_FE_BASE" >&2
    return 1
  fi
  return 0
}

adm_staging_require_strict_api() {
  local api="${STAGING_API_BASE:-${TRAVELTRUST_STAGING_API_BASE:-}}"
  api="${api%/}"
  if [[ -z "$api" ]]; then
    echo "FAIL: STAGING_API_BASE required (strict staging)" >&2
    return 1
  fi
  if [[ "${ADM_U01_STRICT:-}${ADM_U02_STRICT:-}" == *"1"* ]] || [[ "${ADM_U01_STRICT:-}" == "1" ]] || [[ "${ADM_U02_STRICT:-}" == "1" ]]; then
    if adm_staging__is_localhost_url "$api"; then
      echo "FAIL: STAGING_API_BASE must not be localhost when ADM_*_STRICT=1" >&2
      return 1
    fi
  fi
  return 0
}
