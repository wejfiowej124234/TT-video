#!/usr/bin/env node
/**
 * Role promo media — Git LFS SSOT sync / verify.
 *
 * Canonical (bake SSOT):
 *   frontend/public/media/traveltrust/roles/{traveler,guide,merchant,acquisition,provider}.mp4
 *   registry/traveltrust-role-promo-media-assets.v1.yaml
 *   frontend/public/media/traveltrust/roles/PROMO-MANIFEST.json
 *
 * Optional ingest (gitignored):
 *   首页角色宣传片/{旅行者,向导,商家,旅行收购}.mp4
 *
 * Usage (repo root):
 *   node scripts/dev/sync-traveltrust-role-promo-videos.cjs --verify
 *   node scripts/dev/sync-traveltrust-role-promo-videos.cjs --ingest
 *   node scripts/dev/sync-traveltrust-role-promo-videos.cjs --ingest --dry-run
 *
 * Staging bake: --verify must PASS; do not depend on drop zone.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "../..");
const DROP = path.join(ROOT, "首页角色宣传片");
const DEST = path.join(ROOT, "frontend/public/media/traveltrust/roles");
const MANIFEST = path.join(DEST, "PROMO-MANIFEST.json");
const REG = path.join(ROOT, "registry/traveltrust-role-promo-media-assets.v1.yaml");
const dryRun = process.argv.includes("--dry-run");
const verifyOnly = process.argv.includes("--verify");
const ingest = process.argv.includes("--ingest") || (!verifyOnly && process.argv.includes("--write-ssot"));

const MAP = [
  { zh: "旅行者.mp4", role: "traveler", aliases: [] },
  { zh: "向导.mp4", role: "guide", aliases: [] },
  { zh: "商家.mp4", role: "merchant", aliases: ["provider.mp4"] },
  { zh: "旅行收购.mp4", role: "acquisition", aliases: [] },
];

const ROLES = ["traveler", "guide", "merchant", "acquisition", "provider"];

function sha256File(filePath) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(filePath));
  return h.digest("hex");
}

function parseRegistryAssets(text) {
  // Minimal YAML extract for assets[].path/sha256/bytes/role (no full YAML dep).
  // Only consume fields while inside the `assets:` list; top-level keys clear cursor.
  const assets = [];
  let inAssets = false;
  let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    if (/^assets:\s*$/.test(raw)) {
      inAssets = true;
      cur = null;
      continue;
    }
    if (inAssets && /^[A-Za-z0-9_]+:\s*/.test(raw) && !/^\s/.test(raw)) {
      // next top-level key (e.g. region_steward:)
      inAssets = false;
      cur = null;
      continue;
    }
    if (!inAssets) continue;
    const role = raw.match(/^\s+-\s+role:\s+(\S+)\s*$/);
    if (role) {
      cur = { role: role[1] };
      assets.push(cur);
      continue;
    }
    if (!cur) continue;
    const pathM = raw.match(/^\s+path:\s+(\S+)\s*$/);
    if (pathM) cur.path = pathM[1];
    const bytesM = raw.match(/^\s+bytes:\s+(\d+)\s*$/);
    if (bytesM) cur.bytes = Number(bytesM[1]);
    const shaM = raw.match(/^\s+sha256:\s+([0-9a-f]{64})\s*$/i);
    if (shaM) cur.sha256 = shaM[1].toLowerCase();
  }
  return assets.filter((a) => a.path && a.sha256);
}

function writeManifest(entries, recordedUtc) {
  const manifest = {
    schema: "traveltrust.role_promo_video_manifest.v1",
    recorded_utc: recordedUtc,
    ssot_registry: "registry/traveltrust-role-promo-media-assets.v1.yaml",
    machine_key: "TT_ROLE_PROMO_MEDIA_ASSETS",
    storage: "git_lfs",
    dest_dir: "frontend/public/media/traveltrust/roles/",
    optional_ingest_drop_zone: "首页角色宣传片/",
    replace_howto:
      "git lfs track + replace MP4s, or --ingest from drop zone, then refresh registry sha256 and re-verify",
    equals_staging_bake: true,
    note: "Canonical bake SSOT via Git LFS + registry. Drop zone optional. region_steward not in batch.",
    entries,
  };
  if (!dryRun) {
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8");
    console.log(`TT_ROLE_PROMO_SYNC: wrote ${path.relative(ROOT, MANIFEST)}`);
  }
  return manifest;
}

function verify() {
  if (!fs.existsSync(REG)) {
    console.error(`TT_ROLE_PROMO_SYNC: FAIL missing registry ${REG}`);
    process.exit(1);
  }
  if (!fs.existsSync(MANIFEST)) {
    console.error(`TT_ROLE_PROMO_SYNC: FAIL missing manifest ${MANIFEST}`);
    process.exit(1);
  }
  const assets = parseRegistryAssets(fs.readFileSync(REG, "utf8"));
  if (assets.length < 5) {
    console.error(`TT_ROLE_PROMO_SYNC: FAIL registry assets=${assets.length} expected>=5`);
    process.exit(1);
  }
  const man = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const manByRole = Object.fromEntries((man.entries || []).map((e) => [e.role, e]));
  let fail = 0;
  for (const a of assets) {
    const abs = path.join(ROOT, a.path);
    if (!fs.existsSync(abs)) {
      console.error(`TT_ROLE_PROMO_SYNC: FAIL missing file ${a.path}`);
      fail += 1;
      continue;
    }
    // LFS pointer fail-closed
    const head = fs.readFileSync(abs, { encoding: "utf8", flag: "r" }).slice(0, 64);
    if (head.startsWith("version https://git-lfs.github.com/spec/v1")) {
      console.error(`TT_ROLE_PROMO_SYNC: FAIL LFS pointer not smudged: ${a.path} (run git lfs pull)`);
      fail += 1;
      continue;
    }
    const st = fs.statSync(abs);
    const digest = sha256File(abs);
    const m = manByRole[a.role];
    if (digest !== a.sha256) {
      console.error(`TT_ROLE_PROMO_SYNC: FAIL sha registry mismatch ${a.role}`);
      fail += 1;
    } else if (m && m.sha256 !== digest) {
      console.error(`TT_ROLE_PROMO_SYNC: FAIL sha manifest mismatch ${a.role}`);
      fail += 1;
    } else if (typeof a.bytes === "number" && st.size !== a.bytes) {
      console.error(`TT_ROLE_PROMO_SYNC: FAIL bytes mismatch ${a.role}`);
      fail += 1;
    } else {
      console.log(`TT_ROLE_PROMO_SYNC: OK ${a.role} sha256=${digest.slice(0, 12)}… (${st.size} B)`);
    }
  }
  for (const role of ROLES) {
    if (!assets.some((a) => a.role === role)) {
      console.error(`TT_ROLE_PROMO_SYNC: FAIL registry missing role ${role}`);
      fail += 1;
    }
  }
  if (fail) {
    console.error(`TT_ROLE_PROMO_SYNC: VERIFY FAIL count=${fail}`);
    process.exit(1);
  }
  console.log("TT_ROLE_PROMO_SYNC: VERIFY OK");
}

function doIngest() {
  if (!fs.existsSync(DROP)) {
    console.error(`TT_ROLE_PROMO_SYNC: FAIL drop zone missing: ${DROP}`);
    process.exit(1);
  }
  fs.mkdirSync(DEST, { recursive: true });
  const recordedUtc = new Date().toISOString();
  const entries = [];
  let missing = 0;
  for (const row of MAP) {
    const src = path.join(DROP, row.zh);
    const destName = `${row.role}.mp4`;
    const dest = path.join(DEST, destName);
    if (!fs.existsSync(src)) {
      console.error(`TT_ROLE_PROMO_SYNC: MISSING ${row.zh}`);
      missing += 1;
      continue;
    }
    const st = fs.statSync(src);
    const digest = sha256File(src);
    console.log(
      `TT_ROLE_PROMO_SYNC: ingest ${row.zh} → ${destName} (${(st.size / (1024 * 1024)).toFixed(1)} MiB · sha256=${digest.slice(0, 12)}…)`,
    );
    if (!dryRun) {
      fs.copyFileSync(src, dest);
      for (const alias of row.aliases) {
        fs.copyFileSync(src, path.join(DEST, alias));
        console.log(`TT_ROLE_PROMO_SYNC: alias ${alias}`);
      }
    }
    entries.push({
      role: row.role,
      source: "drop_zone_ingest",
      dest: `frontend/public/media/traveltrust/roles/${destName}`,
      bytes: st.size,
      sha256: digest,
      status: dryRun ? "DRY_RUN" : "INGESTED",
      aliases: row.aliases,
    });
    if (row.aliases.includes("provider.mp4")) {
      entries.push({
        role: "provider",
        source: "drop_zone_ingest",
        dest: "frontend/public/media/traveltrust/roles/provider.mp4",
        bytes: st.size,
        sha256: digest,
        status: dryRun ? "DRY_RUN" : "INGESTED",
        aliases: [],
      });
    }
  }
  if (missing) {
    console.error(`TT_ROLE_PROMO_SYNC: FAIL missing=${missing}`);
    process.exit(1);
  }
  writeManifest(entries, recordedUtc);
  console.log(
    "TT_ROLE_PROMO_SYNC: ingest done — update registry/traveltrust-role-promo-media-assets.v1.yaml sha256/bytes to match, then --verify",
  );
}

function main() {
  if (verifyOnly) {
    verify();
    return;
  }
  if (ingest) {
    doIngest();
    return;
  }
  // Default: verify (bake-safe). Old habit of sync-from-drop without flag is no longer default.
  console.log("TT_ROLE_PROMO_SYNC: default --verify (use --ingest to copy from drop zone)");
  verify();
}

main();
