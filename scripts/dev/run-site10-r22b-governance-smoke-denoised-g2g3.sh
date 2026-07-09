#!/usr/bin/env bash
# ① r22b · 22 真回归 denoised matrix（已迁移）
# 请使用：bash scripts/dev/run-site10-r22b-denoised-regression-matrix.sh {run|parse|check-gates}
exec bash "$(dirname "${BASH_SOURCE[0]}")/run-site10-r22b-denoised-regression-matrix.sh" "$@"
