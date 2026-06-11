#!/usr/bin/env bash
# 改 docs/AI任务卡索引.md 或 docs/AI任务卡索引.from-stash.md 时串跑一览机读（与 CONTRIBUTING · pre-push-local / TT-LOCAL §2 同源）。
# 由 ci-local-delivery-minimum.sh、dev/dev-preflight.sh 在「三连」元数据步之后调用；须在仓库根执行。
# 跳过（任一为 1）：SKIP_AI_TASK_CARD_INDEX_OVERVIEW、CI_LOCAL_SKIP_AI_TASK_CARD_INDEX（后者为历史名）。
set -euo pipefail
_root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$_root"
if [[ "${SKIP_AI_TASK_CARD_INDEX_OVERVIEW:-}" == "1" || "${CI_LOCAL_SKIP_AI_TASK_CARD_INDEX:-}" == "1" ]]; then
  exit 0
fi

_git_path_changed() {
  local _p="$1"
  if [[ ! -f "${_p}" ]]; then
    return 1
  fi
  if ! git diff --quiet HEAD -- "${_p}"; then
    return 0
  fi
  if git rev-parse -q --verify main >/dev/null 2>&1; then
    if ! git diff --quiet main HEAD -- "${_p}"; then
      return 0
    fi
  fi
  return 1
}

_ai_index_path="docs/AI任务卡索引.md"
_stash_path="docs/AI任务卡索引.from-stash.md"

if [[ ! -f "${_ai_index_path}" ]] && [[ ! -f "${_stash_path}" ]]; then
  exit 0
fi

_ai_changed=0
_stash_changed=0
if [[ -f "${_ai_index_path}" ]] && _git_path_changed "${_ai_index_path}"; then
  _ai_changed=1
fi
if [[ -f "${_stash_path}" ]] && _git_path_changed "${_stash_path}"; then
  _stash_changed=1
fi

if [[ "${_ai_changed}" -eq 1 ]]; then
  echo "==> check-ai-task-card-index-overview (${_ai_index_path} differs vs HEAD and/or main..HEAD)"
  bash scripts/check-ai-task-card-index-overview.sh "${_ai_index_path}"
fi
if [[ "${_stash_changed}" -eq 1 ]]; then
  if [[ "${AI_TASK_CARD_INDEX_VALIDATE_FROM_STASH:-}" == "1" ]]; then
    echo "==> check-ai-task-card-index-overview (${_stash_path} differs vs HEAD and/or main..HEAD)"
    bash scripts/check-ai-task-card-index-overview.sh "${_stash_path}"
  else
    echo "==> skip from-stash AI index overview (stash mirror has open RULE debt; set AI_TASK_CARD_INDEX_VALIDATE_FROM_STASH=1 to enforce)"
  fi
fi
