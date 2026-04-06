#!/usr/bin/env bash
# 07 Phase 4：清除混用 .next 后启动 Turbopack dev（与 frontend-clean-dev.bat 等价）
# Windows：.\scripts\frontend-clean-dev.ps1 或 frontend-clean-dev.bat（委托本脚本 / 等价）
set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT/frontend"
echo ">>> npm run clean && npm run dev"
npm run clean
npm run dev
