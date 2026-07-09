#!/usr/bin/env node
/**
 * Unit checks for Operations Workflow FSM rules (mirrors Rust guards).
 * Run: node scripts/dev/test-operations-workflow-fsm-unit.cjs
 */
const assert = require('assert');

const CONTENT_PUBLISH_FROM = new Set(['in_review']);
function contentPublishAllowed(status) {
  return CONTENT_PUBLISH_FROM.has(status);
}

function catalogFeaturedAllowed(displayStatus, featured) {
  if (featured && displayStatus !== 'published') {
    return { ok: false, error: 'featured_requires_published' };
  }
  return { ok: true };
}

assert.strictEqual(contentPublishAllowed('draft'), false);
assert.strictEqual(contentPublishAllowed('in_review'), true);
assert.strictEqual(contentPublishAllowed('published'), false);

assert.deepStrictEqual(catalogFeaturedAllowed('hidden', true), {
  ok: false,
  error: 'featured_requires_published',
});
assert.deepStrictEqual(catalogFeaturedAllowed('published', true), { ok: true });
assert.deepStrictEqual(catalogFeaturedAllowed('hidden', false), { ok: true });

console.log('operations_workflow_fsm_unit: PASS');
