#!/usr/bin/env node
/**
 * @deprecated Local demo only — do not use before public launch.
 * Production product lane is seeded by migration:
 *   crates/api/migrations/20260709210000_cms_public_surface_production_polish.sql
 *
 * To archive stale UAT rows: node scripts/dev/run-cms-uat-artifacts-teardown.cjs
 */
console.error(
  "seed-cms-announcements-demo.cjs is deprecated. Run sqlx migrate / deploy API with production polish migration instead.",
);
process.exit(1);
