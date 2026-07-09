#!/usr/bin/env node
/**
 * CMS Operation · 闭环收尾（机器层 + 运营入口）
 *
 *   node scripts/dev/run-cms-ops-refresh.cjs
 *
 * Upload → Publish → Verify → Evidence → Asset Matrix → Image Inventory → L5 Visual Scan → Health Score → Daily Ops Board
 */
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const stamp =
  process.argv.includes('--stamp') && process.argv[process.argv.indexOf('--stamp') + 1]
    ? process.argv[process.argv.indexOf('--stamp') + 1]
    : new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

const matrixScript = path.join(__dirname, 'run-cms-asset-matrix-pack.cjs');
const healthScript = path.join(__dirname, 'run-cms-content-health-score.cjs');
const dailyScript = path.join(__dirname, 'run-cms-daily-ops-board.cjs');
const matrixArgs = [matrixScript, '--stamp', stamp];
if (process.argv.includes('--skip-probe')) matrixArgs.push('--skip-probe');

execFileSync(process.execPath, matrixArgs, { stdio: 'inherit', cwd: ROOT });
execFileSync(process.execPath, [path.join(__dirname, 'run-cms-image-inventory-pack.cjs'), '--stamp', stamp], {
  stdio: 'inherit',
  cwd: ROOT,
});
const visualArgs = [path.join(__dirname, 'run-cms-l5-visual-asset-scan.cjs'), '--stamp', stamp];
if (process.argv.includes('--skip-probe')) visualArgs.push('--skip-probe');
execFileSync(process.execPath, visualArgs, { stdio: 'inherit', cwd: ROOT });
execFileSync(process.execPath, [healthScript, '--stamp', stamp], { stdio: 'pipe', cwd: ROOT });
execFileSync(process.execPath, [dailyScript], { stdio: 'inherit', cwd: ROOT });
