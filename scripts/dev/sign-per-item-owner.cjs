#!/usr/bin/env node
/**
 * PER P0-2..P0-5 · Owner sign-off (evidence-only).
 *
 *   node scripts/dev/sign-per-item-owner.cjs --item p0-2
 */
const { arg, signItem } = require('./lib/per-production-prep-shared.cjs');

const item = arg(process.argv, '--item');
const signedAt = arg(process.argv, '--signed-at') || new Date().toISOString();

if (!item || !['p0-2', 'p0-3', 'p0-4', 'p0-5'].includes(item)) {
  console.error('Usage: node sign-per-item-owner.cjs --item p0-2|p0-3|p0-4|p0-5');
  process.exit(2);
}

signItem(item, signedAt);
