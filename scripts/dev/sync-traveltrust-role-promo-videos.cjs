#!/usr/bin/env node
/**
 * Sync Owner drop-zone role promo MP4s → frontend/public/media/traveltrust/roles/
 *
 * Drop zone (replace anytime): 首页角色宣传片/
 *   旅行者.mp4 → traveler.mp4
 *   向导.mp4   → guide.mp4
 *   商家.mp4   → merchant.mp4 (+ provider.mp4 alias)
 *   旅行收购.mp4 → acquisition.mp4
 *
 * region_steward: not in this drop batch — leave existing / tier-1 placeholder.
 *
 * Usage (repo root):
 *   node scripts/dev/sync-traveltrust-role-promo-videos.cjs
 *   node scripts/dev/sync-traveltrust-role-promo-videos.cjs --dry-run
 *
 * Persistent + replaceable: re-run this script after dropping new files in the drop zone.
 * Does not upload to Tigris (no credentials required). Staging bake: sync before Web deploy.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "../..");
const DROP = path.join(ROOT, "首页角色宣传片");
const DEST = path.join(ROOT, "frontend/public/media/traveltrust/roles");
const MANIFEST = path.join(DEST, "PROMO-MANIFEST.json");
const dryRun = process.argv.includes("--dry-run");

/** Chinese Owner filenames → runtime role ids */
const MAP = [
  { zh: "旅行者.mp4", role: "traveler", aliases: [] },
  { zh: "向导.mp4", role: "guide", aliases: [] },
  { zh: "商家.mp4", role: "merchant", aliases: ["provider.mp4"] },
  { zh: "旅行收购.mp4", role: "acquisition", aliases: [] },
];

function sha256File(filePath) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(filePath));
  return h.digest("hex");
}

function main() {
  if (!fs.existsSync(DROP)) {
    console.error(`TT_ROLE_PROMO_SYNC: FAIL drop zone missing: ${DROP}`);
    process.exit(1);
  }
  fs.mkdirSync(DEST, { recursive: true });

  const recordedUtc = new Date().toISOString();
  const entries = [];
  let copied = 0;
  let missing = 0;

  for (const row of MAP) {
    const src = path.join(DROP, row.zh);
    const destName = `${row.role}.mp4`;
    const dest = path.join(DEST, destName);
    if (!fs.existsSync(src)) {
      console.error(`TT_ROLE_PROMO_SYNC: MISSING ${row.zh}`);
      missing += 1;
      entries.push({ role: row.role, source: row.zh, status: "MISSING" });
      continue;
    }
    const st = fs.statSync(src);
    const digest = sha256File(src);
    console.log(
      `TT_ROLE_PROMO_SYNC: ${row.zh} → ${destName} (${(st.size / (1024 * 1024)).toFixed(1)} MiB · sha256=${digest.slice(0, 12)}…)`,
    );
    if (!dryRun) {
      fs.copyFileSync(src, dest);
      for (const alias of row.aliases) {
        fs.copyFileSync(src, path.join(DEST, alias));
        console.log(`TT_ROLE_PROMO_SYNC: alias ${alias}`);
      }
    }
    copied += 1;
    entries.push({
      role: row.role,
      source: row.zh,
      dest: `frontend/public/media/traveltrust/roles/${destName}`,
      bytes: st.size,
      sha256: digest,
      status: dryRun ? "DRY_RUN" : "SYNCED",
      aliases: row.aliases,
    });
  }

  const manifest = {
    schema: "traveltrust.role_promo_video_manifest.v1",
    recorded_utc: recordedUtc,
    drop_zone: "首页角色宣传片/",
    dest_dir: "frontend/public/media/traveltrust/roles/",
    replace_howto:
      "Replace files in 首页角色宣传片/ then re-run: node scripts/dev/sync-traveltrust-role-promo-videos.cjs",
    equals_staging_bake: false,
    note: "Binaries are local/deploy artifacts — not git SSOT. region_steward not in this batch.",
    entries,
  };

  if (!dryRun) {
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8");
    console.log(`TT_ROLE_PROMO_SYNC: wrote ${path.relative(ROOT, MANIFEST)}`);
  }

  if (missing > 0) {
    console.error(`TT_ROLE_PROMO_SYNC: FAIL missing=${missing} synced=${copied}`);
    process.exit(1);
  }
  console.log(`TT_ROLE_PROMO_SYNC: OK synced=${copied} dry_run=${dryRun}`);
}

main();
