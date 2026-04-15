#!/usr/bin/env bash
# 安装 git pre-push：推送前强制跑三门禁（需 bash + python3 可用；Windows 可改用 py -3 改 gate 内解释器）。
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HOOK_DIR="${ROOT}/.git/hooks"
if [[ ! -d "${ROOT}/.git" ]]; then
  echo "install-broadcast-batch-pre-push-hook: not a git repo root: ${ROOT}" >&2
  exit 1
fi
mkdir -p "${HOOK_DIR}"
TARGET="${HOOK_DIR}/pre-push"
if [[ -f "${TARGET}" ]] && ! grep -q 'broadcast-batch-all-required' "${TARGET}" 2>/dev/null; then
  echo "install-broadcast-batch-pre-push-hook: ${TARGET} exists; backup to ${TARGET}.bak" >&2
  cp -f "${TARGET}" "${TARGET}.bak"
fi
cat > "${TARGET}" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
exec bash scripts/gates/broadcast-batch-all-required.sh
EOF
chmod +x "${TARGET}"
echo "Wrote ${TARGET} (runs broadcast-batch-all-required.sh on every push)"
