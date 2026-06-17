#!/usr/bin/env node
/**
 * CLI wrapper for tn-p1-010-graduation-gate.mjs (no import side effects).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export function evalTnP010GraduationGateCli(root = process.cwd()) {
  const gateScript = path.join(root, 'scripts/dev/lib/tn-p1-010-graduation-gate.mjs');
  const r = spawnSync('node', [gateScript, '--root', root, '--status-only'], {
    encoding: 'utf8',
    cwd: root,
  });
  try {
    return JSON.parse((r.stdout || '').trim() || '{}');
  } catch {
    return { pass: false, state: 'no', note: 'tn-p1-010 graduation gate eval failed' };
  }
}

export function tnP010GraduationStatus(gate) {
  if (gate?.pass) return 'CLOSED';
  return 'OPEN';
}

export function tnP010GraduationNote(gate) {
  if (gate?.pass) return gate.note || 'post-soak @ freeze SHA';
  return gate?.note || 'post-soak TN-P1-010 @ freeze SHA required';
}
