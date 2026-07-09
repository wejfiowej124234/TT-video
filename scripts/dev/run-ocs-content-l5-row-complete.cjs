#!/usr/bin/env node
/**
 * OCS Content L5 · update one Matrix row + optional verify (Manifest First execution).
 *
 *   node scripts/dev/run-ocs-content-l5-row-complete.cjs \
 *     --filename ocs-tokyo-photo-provider-cover.jpg \
 *     --asset-status verified --review-status pass
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/official-cold-start/content-production-matrix.v1.yaml');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function main() {
  const filename = arg('--filename');
  const assetStatus = arg('--asset-status');
  const reviewStatus = arg('--review-status');
  const skipVerify = process.argv.includes('--skip-verify');

  if (!filename || !/^ocs-[a-z0-9-]+\.jpg$/.test(filename)) {
    console.error('usage: --filename ocs-*.jpg --asset-status pending|replaced|verified --review-status pending|pass|fail');
    process.exit(2);
  }
  if (!assetStatus || !['pending', 'replaced', 'verified'].includes(assetStatus)) {
    console.error('invalid --asset-status');
    process.exit(2);
  }
  if (!reviewStatus || !['pending', 'pass', 'fail'].includes(reviewStatus)) {
    console.error('invalid --review-status');
    process.exit(2);
  }

  let text = fs.readFileSync(MATRIX, 'utf8');
  const needle = `  - filename: ${filename}`;
  const start = text.indexOf(needle);
  if (start < 0) {
    console.error(`ROW_NOT_FOUND: ${filename}`);
    process.exit(2);
  }
  const end = text.indexOf('\n  - filename:', start + needle.length);
  const blockEnd = end >= 0 ? end : text.length;
  let block = text.slice(start, blockEnd);

  block = block.replace(/(\n    asset_status:) \w+/, `$1 ${assetStatus}`);
  block = block.replace(/(\n    review_status:) \w+/, `$1 ${reviewStatus}`);

  text = text.slice(0, start) + block + text.slice(blockEnd);
  fs.writeFileSync(MATRIX, text);

  console.log(`TT_OCS_CONTENT_L5_ROW_MATRIX: updated ${filename} asset_status=${assetStatus} review_status=${reviewStatus}`);

  if (!skipVerify) {
    execFileSync(process.execPath, [path.join(__dirname, 'run-ocs-content-l5-row-verify.cjs'), '--filename', filename], {
      stdio: 'inherit',
      cwd: ROOT,
    });
    if (assetStatus === 'verified' && reviewStatus === 'pass') {
      execFileSync(
        process.execPath,
        [
          path.join(__dirname, 'run-ocs-content-l5-destination-authenticity-review.cjs'),
          '--filename',
          filename,
          '--visual-pass',
        ],
        { stdio: 'inherit', cwd: ROOT },
      );
      if (/guide-avatar/.test(filename)) {
        execFileSync(
          process.execPath,
          [
            path.join(__dirname, 'run-ocs-content-l5-guide-identity-diversity-review.cjs'),
            '--filename',
            filename,
            '--visual-pass',
          ],
          { stdio: 'inherit', cwd: ROOT },
        );
      }
      if (/provider-cover/.test(filename)) {
        execFileSync(
          process.execPath,
          [
            path.join(__dirname, 'run-ocs-content-l5-provider-business-identity-review.cjs'),
            '--filename',
            filename,
            '--visual-pass',
          ],
          { stdio: 'inherit', cwd: ROOT },
        );
      }
      if (/acquisition-cover/.test(filename)) {
        execFileSync(
          process.execPath,
          [
            path.join(__dirname, 'run-ocs-content-l5-acquisition-product-identity-review.cjs'),
            '--filename',
            filename,
            '--visual-pass',
          ],
          { stdio: 'inherit', cwd: ROOT },
        );
      }
      if (/official-guide-cover/.test(filename)) {
        execFileSync(
          process.execPath,
          [
            path.join(__dirname, 'run-ocs-content-l5-official-guide-destination-review.cjs'),
            '--filename',
            filename,
            '--visual-pass',
          ],
          { stdio: 'inherit', cwd: ROOT },
        );
      }
      if (/guide-avatar|provider-cover|acquisition-cover|official-guide-cover|community-(cover|media)/.test(filename)) {
        execFileSync(
          process.execPath,
          [
            path.join(__dirname, 'run-ocs-content-l5-surface-boundary-review.cjs'),
            '--filename',
            filename,
            '--visual-pass',
          ],
          { stdio: 'inherit', cwd: ROOT },
        );
      }
      if (/community-(cover|media)/.test(filename)) {
        execFileSync(
          process.execPath,
          [
            path.join(__dirname, 'run-ocs-content-l5-community-authenticity-review.cjs'),
            '--filename',
            filename,
            '--visual-pass',
          ],
          { stdio: 'inherit', cwd: ROOT },
        );
      }
      execFileSync(
        process.execPath,
        [
          path.join(__dirname, 'run-ocs-content-l5-content-portfolio-review.cjs'),
          '--visual-pass',
          '--trigger-filename',
          filename,
        ],
        { stdio: 'inherit', cwd: ROOT },
      );
      execFileSync(
        process.execPath,
        [
          path.join(__dirname, 'run-ocs-content-l5-visual-sequence-review.cjs'),
          '--filename',
          filename,
          '--visual-pass',
        ],
        { stdio: 'inherit', cwd: ROOT },
      );
    }
  }
}

main();
