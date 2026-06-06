#!/usr/bin/env bash
# TT-PH1-213 · §6.2 POST 目视机采（① 本地）
# 前置：frontend dev 监听 :3012（npm run dev）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
echo "capture-site-theme-v1: OUT=evidence/GO_local_site_theme_v1/POST-screenshots/"
PLAYWRIGHT_REUSE_FE_SERVER=1 npm run e2e:site-theme-v1-capture
