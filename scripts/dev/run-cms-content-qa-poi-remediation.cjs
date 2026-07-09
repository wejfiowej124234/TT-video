#!/usr/bin/env node
/**
 * Content QA · 单 POI Remediation · Review → Replace(1×) → Publish → Verify → 六维 QA → LOCK
 *
 *   TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE=1 \
 *   API=https://tt-api-staging.fly.dev \
 *     node scripts/dev/run-cms-content-qa-poi-remediation.cjs --city-zh 大阪 --poi 大阪城
 *
 * 标准 SSOT: evidence/GO_cms_operation/CMS-CONTENT-QA-STANDARD-FROZEN.v1.json
 * 禁止 bulk · 禁止第二次 Replace（除非 --unlock-real-error）
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const {
  assertCanReplace,
  recordReplace,
  lockAsset,
  loadStandard,
  getAsset,
  REGISTRY,
} = require('./lib/cms-content-qa-asset-lock.cjs');
const { assessSinglePoiContentQa } = require('./lib/cms-japan-content-qa.cjs');
const { ensureCmsQaHeroOnStaging, COMMUNITY_MEDIA_DIR } = require('./lib/cms-destination-ambient-hero.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('cms_content_qa_poi_remediation');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const VISUAL_GAP = path.join(ROOT, 'evidence/GO_cms_operation/CMS-L5-VISUAL-GAP-REPORT-LATEST.json');
const OUT_DIR = path.join(ROOT, 'evidence/GO_cms_operation/content-qa-remediation');

/** 单 POI 唯一 Replace 目标（文件名须含 city geo token） */
const QA_REMEDIATION_HERO = {
  'PH-JP-001-ATR': 'ocs-osaka-castle-official-guide-cover.jpg',
  'PH-JP-002-ATR': 'ocs-osaka-dotonbori-official-guide-cover.jpg',
  'PH-JP-003-ATR': 'ocs-osaka-usj-official-guide-cover.jpg',
  'PH-JP-004-ATR': 'ocs-osaka-shinsaibashi-official-guide-cover.jpg',
  'PH-JP-005-FOOD': 'ocs-osaka-takoyaki-community-cover.jpg',
  'PH-JP-006-FOOD': 'ocs-osaka-okonomiyaki-guide-avatar.jpg',
  'PH-JP-007-FOOD': 'ocs-osaka-fugu-acquisition-cover.jpg',
  'PH-JP-008-FOOD': 'ocs-osaka-kushikatsu-provider-cover.jpg',
  'PH-JP-033-ATR': 'ocs-sapporo-odori-park-official-guide-cover.jpg',
  'PH-JP-034-ATR': 'ocs-sapporo-clock-tower-community-media.jpg',
  'PH-JP-035-ATR': 'ocs-sapporo-hitachi-hill-community-cover.jpg',
  'PH-JP-036-ATR': 'ocs-sapporo-shiroi-koibito-provider-cover.jpg',
  'PH-JP-037-ATR': 'ocs-sapporo-moiwa-acquisition-cover.jpg',
  'PH-JP-038-FOOD': 'ocs-sapporo-miso-ramen-guide-avatar.jpg',
  'PH-JP-039-FOOD': 'ocs-sapporo-jingisukan-official-guide-cover.jpg',
  'PH-JP-040-FOOD': 'ocs-sapporo-soup-curry-community-cover.jpg',
  'PH-JP-041-FOOD': 'ocs-sapporo-seafood-provider-cover.jpg',
  'PH-JP-009-ATR': 'ocs-tokyo-photo-official-guide-cover.jpg',
  'PH-JP-010-ATR': 'ocs-tokyo-photo-community-media.jpg',
  'PH-JP-011-ATR': 'ocs-tokyo-photo-community-cover.jpg',
  'PH-JP-012-ATR': 'ocs-tokyo-photo-provider-cover.jpg',
  'PH-JP-013-ATR': 'ocs-tokyo-photo-acquisition-cover.jpg',
  'PH-JP-014-FOOD': 'ocs-tokyo-sushi-community-cover.jpg',
  'PH-JP-015-FOOD': 'ocs-tokyo-ramen-guide-avatar.jpg',
  'PH-JP-016-FOOD': 'ocs-tokyo-tempura-provider-cover.jpg',
  'PH-JP-017-FOOD': 'ocs-tokyo-photo-guide-avatar.jpg',
  'PH-JP-026-ATR': 'ocs-kyoto-culture-official-guide-cover.jpg',
  'PH-JP-027-ATR': 'ocs-kyoto-culture-community-media.jpg',
  'PH-JP-028-ATR': 'ocs-kyoto-culture-community-cover.jpg',
  'PH-JP-029-ATR': 'ocs-kyoto-culture-provider-cover.jpg',
  'PH-JP-030-FOOD': 'ocs-kyoto-culture-acquisition-cover.jpg',
  'PH-JP-031-FOOD': 'ocs-kyoto-culture-guide-avatar.jpg',
      'PH-JP-032-FOOD': 'ocs-kyoto-yudofu-community-cover.jpg',
  'PH-JP-018-ATR': 'ocs-fukuoka-hakata-official-guide-cover.jpg',
  'PH-JP-019-ATR': 'ocs-fukuoka-dazaifu-community-media.jpg',
  'PH-JP-020-ATR': 'ocs-fukuoka-nokonoshima-community-cover.jpg',
  'PH-JP-021-ATR': 'ocs-fukuoka-yatai-atr-provider-cover.jpg',
  'PH-JP-022-FOOD': 'ocs-fukuoka-tonkotsu-ramen-guide-avatar.jpg',
  'PH-JP-023-FOOD': 'ocs-fukuoka-mentaiko-acquisition-cover.jpg',
  'PH-JP-024-FOOD': 'ocs-fukuoka-mizutaki-official-guide-cover.jpg',
  'PH-JP-025-FOOD': 'ocs-fukuoka-yatai-food-community-media.jpg',
  'PH-KR-064-ATR': 'ocs-seoul-food-official-guide-cover.jpg',
  'PH-KR-065-ATR': 'ocs-seoul-food-community-media.jpg',
  'PH-KR-066-ATR': 'ocs-seoul-food-community-cover.jpg',
  'PH-KR-067-ATR': 'ocs-seoul-food-provider-cover.jpg',
  'PH-KR-068-ATR': 'ocs-seoul-food-acquisition-cover.jpg',
  'PH-KR-069-FOOD': 'ocs-seoul-food-guide-avatar.jpg',
  'PH-KR-070-FOOD': 'ocs-seoul-food-official-guide-cover.jpg',
  'PH-KR-071-FOOD': 'ocs-seoul-food-community-media.jpg',
  'PH-KR-072-FOOD': 'ocs-seoul-food-community-cover.jpg',
  'PH-KR-042-ATR': 'ocs-busan-coast-official-guide-cover.jpg',
  'PH-KR-043-ATR': 'ocs-busan-coast-community-media.jpg',
  'PH-KR-044-ATR': 'ocs-busan-coast-community-cover.jpg',
  'PH-KR-045-ATR': 'ocs-busan-coast-provider-cover.jpg',
  'PH-KR-046-FOOD': 'ocs-busan-coast-guide-avatar.jpg',
  'PH-KR-047-FOOD': 'ocs-busan-coast-official-guide-cover.jpg',
  'PH-KR-048-FOOD': 'ocs-busan-coast-community-media.jpg',
  'PH-KR-049-FOOD': 'ocs-busan-coast-community-cover.jpg',
  'PH-KR-050-ATR': 'ocs-jeju-island-official-guide-cover.jpg',
  'PH-KR-051-ATR': 'ocs-jeju-island-community-media.jpg',
  'PH-KR-052-ATR': 'ocs-jeju-island-community-cover.jpg',
  'PH-KR-053-ATR': 'ocs-jeju-island-provider-cover.jpg',
  'PH-KR-054-FOOD': 'ocs-jeju-island-guide-avatar.jpg',
  'PH-KR-055-FOOD': 'ocs-jeju-island-official-guide-cover.jpg',
  'PH-KR-056-FOOD': 'ocs-jeju-island-community-media.jpg',
  'PH-KR-057-FOOD': 'ocs-jeju-island-community-cover.jpg',
  'PH-KR-058-ATR': 'ocs-incheon-port-official-guide-cover.jpg',
  'PH-KR-059-ATR': 'ocs-incheon-port-community-media.jpg',
  'PH-KR-060-ATR': 'ocs-incheon-port-community-cover.jpg',
  'PH-KR-061-FOOD': 'ocs-incheon-port-guide-avatar.jpg',
  'PH-KR-062-FOOD': 'ocs-incheon-port-official-guide-cover.jpg',
  'PH-KR-063-FOOD': 'ocs-incheon-port-community-media.jpg',
  'PH-TH-073-ATR': 'ocs-bangkok-temple-official-guide-cover.jpg',
  'PH-TH-074-ATR': 'ocs-bangkok-temple-community-media.jpg',
  'PH-TH-075-ATR': 'ocs-bangkok-temple-community-cover.jpg',
  'PH-TH-076-ATR': 'ocs-bangkok-temple-provider-cover.jpg',
  'PH-TH-077-ATR': 'ocs-bangkok-temple-acquisition-cover.jpg',
  'PH-TH-078-FOOD': 'ocs-bangkok-temple-guide-avatar.jpg',
  'PH-TH-079-FOOD': 'ocs-bangkok-temple-official-guide-cover.jpg',
  'PH-TH-080-FOOD': 'ocs-bangkok-temple-community-media.jpg',
  'PH-TH-081-FOOD': 'ocs-bangkok-temple-community-cover.jpg',
  'PH-TH-082-FOOD': 'ocs-bangkok-temple-community-media.jpg',
  'PH-TH-083-ATR': 'ocs-phuket-island-official-guide-cover.jpg',
  'PH-TH-084-ATR': 'ocs-phuket-island-community-media.jpg',
  'PH-TH-085-ATR': 'ocs-phuket-island-community-cover.jpg',
  'PH-TH-086-ATR': 'ocs-phuket-island-provider-cover.jpg',
  'PH-TH-087-ATR': 'ocs-phuket-island-acquisition-cover.jpg',
  'PH-TH-088-FOOD': 'ocs-phuket-island-guide-avatar.jpg',
  'PH-TH-089-FOOD': 'ocs-phuket-island-official-guide-cover.jpg',
  'PH-TH-090-FOOD': 'ocs-phuket-island-community-media.jpg',
  'PH-TH-091-FOOD': 'ocs-phuket-island-community-cover.jpg',
  'PH-TH-092-ATR': 'ocs-chiang-mai-temple-official-guide-cover.jpg',
  'PH-TH-093-ATR': 'ocs-chiang-mai-temple-community-media.jpg',
  'PH-TH-094-ATR': 'ocs-chiang-mai-temple-community-cover.jpg',
  'PH-TH-095-ATR': 'ocs-chiang-mai-temple-provider-cover.jpg',
  'PH-TH-096-ATR': 'ocs-chiang-mai-temple-acquisition-cover.jpg',
  'PH-TH-097-FOOD': 'ocs-chiang-mai-temple-guide-avatar.jpg',
  'PH-TH-098-FOOD': 'ocs-chiang-mai-temple-official-guide-cover.jpg',
  'PH-TH-099-FOOD': 'ocs-chiang-mai-temple-community-media.jpg',
  'PH-TH-100-FOOD': 'ocs-chiang-mai-temple-community-cover.jpg',
  'PH-SG-101-ATR': 'ocs-singapore-family-official-guide-cover.jpg',
  'PH-SG-102-ATR': 'ocs-singapore-family-community-media.jpg',
  'PH-SG-103-ATR': 'ocs-singapore-family-community-cover.jpg',
  'PH-SG-104-ATR': 'ocs-singapore-family-provider-cover.jpg',
  'PH-SG-105-ATR': 'ocs-singapore-family-acquisition-cover.jpg',
  'PH-SG-106-FOOD': 'ocs-singapore-family-guide-avatar.jpg',
  'PH-SG-107-FOOD': 'ocs-singapore-family-official-guide-cover.jpg',
  'PH-SG-108-FOOD': 'ocs-singapore-family-community-media.jpg',
  'PH-SG-109-FOOD': 'ocs-singapore-family-community-cover.jpg',
  'PH-SG-110-FOOD': 'ocs-singapore-family-community-media.jpg',
  'PH-FR-111-ATR': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-FR-112-ATR': 'ocs-paris-art-community-media.jpg',
  'PH-FR-113-ATR': 'ocs-paris-art-community-cover.jpg',
  'PH-FR-114-ATR': 'ocs-paris-art-provider-cover.jpg',
  'PH-FR-115-FOOD': 'ocs-paris-art-guide-avatar.jpg',
  'PH-FR-116-FOOD': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-FR-117-FOOD': 'ocs-paris-art-community-media.jpg',
  'PH-FR-118-FOOD': 'ocs-paris-art-community-cover.jpg',
  'PH-FR-119-ATR': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-FR-120-ATR': 'ocs-paris-art-community-media.jpg',
  'PH-FR-121-ATR': 'ocs-paris-art-community-cover.jpg',
  'PH-FR-122-ATR': 'ocs-paris-art-provider-cover.jpg',
  'PH-FR-123-FOOD': 'ocs-paris-art-guide-avatar.jpg',
  'PH-FR-124-FOOD': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-FR-125-FOOD': 'ocs-paris-art-community-media.jpg',
  'PH-FR-126-FOOD': 'ocs-paris-art-community-cover.jpg',
  'PH-FR-127-ATR': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-FR-128-ATR': 'ocs-paris-art-community-media.jpg',
  'PH-FR-129-ATR': 'ocs-paris-art-community-cover.jpg',
  'PH-FR-130-ATR': 'ocs-paris-art-provider-cover.jpg',
  'PH-FR-131-FOOD': 'ocs-paris-art-guide-avatar.jpg',
  'PH-FR-132-FOOD': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-FR-133-FOOD': 'ocs-paris-art-community-media.jpg',
  'PH-FR-134-FOOD': 'ocs-paris-art-community-cover.jpg',
  'PH-US-135-ATR': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-US-136-ATR': 'ocs-paris-art-community-media.jpg',
  'PH-US-137-ATR': 'ocs-paris-art-community-cover.jpg',
  'PH-US-138-ATR': 'ocs-paris-art-provider-cover.jpg',
  'PH-US-139-FOOD': 'ocs-paris-art-guide-avatar.jpg',
  'PH-US-140-FOOD': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-US-141-FOOD': 'ocs-paris-art-community-media.jpg',
  'PH-US-142-FOOD': 'ocs-paris-art-community-cover.jpg',
  'PH-US-143-ATR': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-US-144-ATR': 'ocs-paris-art-community-media.jpg',
  'PH-US-145-ATR': 'ocs-paris-art-community-cover.jpg',
  'PH-US-146-ATR': 'ocs-paris-art-provider-cover.jpg',
  'PH-US-147-FOOD': 'ocs-paris-art-guide-avatar.jpg',
  'PH-US-148-FOOD': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-US-149-FOOD': 'ocs-paris-art-community-media.jpg',
  'PH-US-150-ATR': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-US-151-ATR': 'ocs-paris-art-community-media.jpg',
  'PH-US-152-ATR': 'ocs-paris-art-community-cover.jpg',
  'PH-US-153-ATR': 'ocs-paris-art-provider-cover.jpg',
  'PH-US-154-FOOD': 'ocs-paris-art-guide-avatar.jpg',
  'PH-US-155-FOOD': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-US-156-FOOD': 'ocs-paris-art-community-media.jpg',
  'PH-US-157-FOOD': 'ocs-paris-art-community-cover.jpg',
  'PH-US-158-ATR': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-US-159-ATR': 'ocs-paris-art-community-media.jpg',
  'PH-US-160-ATR': 'ocs-paris-art-community-cover.jpg',
  'PH-US-161-ATR': 'ocs-paris-art-provider-cover.jpg',
  'PH-US-162-ATR': 'ocs-paris-art-guide-avatar.jpg',
  'PH-US-163-FOOD': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-US-164-FOOD': 'ocs-paris-art-community-media.jpg',
  'PH-US-165-FOOD': 'ocs-paris-art-community-cover.jpg',
  'PH-US-166-FOOD': 'ocs-paris-art-provider-cover.jpg',
  'PH-US-167-FOOD': 'ocs-paris-art-guide-avatar.jpg',
  'PH-AU-168-ATR': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-AU-169-ATR': 'ocs-paris-art-community-media.jpg',
  'PH-AU-170-ATR': 'ocs-paris-art-community-cover.jpg',
  'PH-AU-171-ATR': 'ocs-paris-art-provider-cover.jpg',
  'PH-AU-172-FOOD': 'ocs-paris-art-guide-avatar.jpg',
  'PH-AU-173-FOOD': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-AU-174-FOOD': 'ocs-paris-art-community-media.jpg',
  'PH-AU-175-FOOD': 'ocs-paris-art-community-cover.jpg',
  'PH-AU-176-ATR': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-AU-177-ATR': 'ocs-paris-art-community-media.jpg',
  'PH-AU-178-ATR': 'ocs-paris-art-community-cover.jpg',
  'PH-AU-179-ATR': 'ocs-paris-art-provider-cover.jpg',
  'PH-AU-180-FOOD': 'ocs-paris-art-guide-avatar.jpg',
  'PH-AU-181-FOOD': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-AU-182-FOOD': 'ocs-paris-art-community-media.jpg',
  'PH-AU-183-FOOD': 'ocs-paris-art-community-cover.jpg',
  'PH-AU-184-ATR': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-AU-185-ATR': 'ocs-paris-art-community-media.jpg',
  'PH-AU-186-ATR': 'ocs-paris-art-community-cover.jpg',
  'PH-AU-187-ATR': 'ocs-paris-art-provider-cover.jpg',
  'PH-AU-188-FOOD': 'ocs-paris-art-guide-avatar.jpg',
  'PH-AU-189-FOOD': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-AU-190-FOOD': 'ocs-paris-art-community-media.jpg',
  'PH-AU-191-FOOD': 'ocs-paris-art-community-cover.jpg',
  'PH-ES-192-ATR': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-ES-193-ATR': 'ocs-paris-art-community-media.jpg',
  'PH-ES-194-ATR': 'ocs-paris-art-community-cover.jpg',
  'PH-ES-195-ATR': 'ocs-paris-art-provider-cover.jpg',
  'PH-ES-196-FOOD': 'ocs-paris-art-guide-avatar.jpg',
  'PH-ES-197-FOOD': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-ES-198-FOOD': 'ocs-paris-art-community-media.jpg',
  'PH-ES-199-FOOD': 'ocs-paris-art-community-cover.jpg',
  'PH-ES-200-ATR': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-ES-201-ATR': 'ocs-paris-art-community-media.jpg',
  'PH-ES-202-ATR': 'ocs-paris-art-community-cover.jpg',
  'PH-ES-203-ATR': 'ocs-paris-art-provider-cover.jpg',
  'PH-ES-204-FOOD': 'ocs-paris-art-guide-avatar.jpg',
  'PH-ES-205-FOOD': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-ES-206-FOOD': 'ocs-paris-art-community-media.jpg',
  'PH-ES-207-FOOD': 'ocs-paris-art-community-cover.jpg',
  'PH-ES-208-ATR': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-ES-209-ATR': 'ocs-paris-art-community-media.jpg',
  'PH-ES-210-ATR': 'ocs-paris-art-community-cover.jpg',
  'PH-ES-211-ATR': 'ocs-paris-art-provider-cover.jpg',
  'PH-ES-212-FOOD': 'ocs-paris-art-guide-avatar.jpg',
  'PH-ES-213-FOOD': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-ES-214-FOOD': 'ocs-paris-art-community-media.jpg',
  'PH-ES-215-FOOD': 'ocs-paris-art-community-cover.jpg',
  'PH-AE-216-ATR': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-AE-217-ATR': 'ocs-paris-art-community-media.jpg',
  'PH-AE-218-ATR': 'ocs-paris-art-community-cover.jpg',
  'PH-AE-219-ATR': 'ocs-paris-art-provider-cover.jpg',
  'PH-AE-220-FOOD': 'ocs-paris-art-guide-avatar.jpg',
  'PH-AE-221-FOOD': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-AE-222-FOOD': 'ocs-paris-art-community-media.jpg',
  'PH-AE-223-FOOD': 'ocs-paris-art-community-cover.jpg',
  'PH-AE-224-ATR': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-AE-225-ATR': 'ocs-paris-art-community-media.jpg',
  'PH-AE-226-ATR': 'ocs-paris-art-community-cover.jpg',
  'PH-AE-227-ATR': 'ocs-paris-art-provider-cover.jpg',
  'PH-AE-228-ATR': 'ocs-paris-art-guide-avatar.jpg',
  'PH-AE-229-FOOD': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-AE-230-FOOD': 'ocs-paris-art-community-media.jpg',
  'PH-AE-231-FOOD': 'ocs-paris-art-community-cover.jpg',
  'PH-AE-232-FOOD': 'ocs-paris-art-provider-cover.jpg',
  'PH-AE-233-ATR': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-AE-234-ATR': 'ocs-paris-art-community-media.jpg',
  'PH-AE-235-ATR': 'ocs-paris-art-community-cover.jpg',
  'PH-AE-236-FOOD': 'ocs-paris-art-provider-cover.jpg',
  'PH-AE-237-FOOD': 'ocs-paris-art-guide-avatar.jpg',
  'PH-AE-238-FOOD': 'ocs-paris-art-official-guide-cover.jpg',
  'PH-AE-239-FOOD': 'ocs-paris-art-community-media.jpg',
};

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function fetchBuffer(url) {
  const lib = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    lib.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function ensureHeroOnStaging(heroFile) {
  return ensureCmsQaHeroOnStaging(heroFile, API);
}

function resolveMatrixId(cityZh, poiName) {
  const pilot = getCityPilot(cityZh);
  const idx = pilot.pois.indexOf(poiName);
  if (idx < 0) throw new Error(`unknown poi ${poiName} in ${cityZh}`);
  return pilot.matrix_ids[idx];
}

function updatePilotHeroFile(matrixId, heroFile) {
  const pilotPath = path.join(ROOT, 'scripts/dev/lib/cms-poi-city-pilot.cjs');
  let text = fs.readFileSync(pilotPath, 'utf8');
  const re = new RegExp(`('${matrixId}': ')[^']+(')`);
  if (!re.test(text)) throw new Error(`pilot hero_files missing ${matrixId}`);
  text = text.replace(re, `$1${heroFile}$2`);
  fs.writeFileSync(pilotPath, text);
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  const standard = loadStandard();
  console.log(`TT_CMS_CONTENT_QA_STANDARD: ${standard.status}`);
  console.log(`ONE_REPLACE: ${standard.one_replace_rule.summary}`);

  const cityZh = arg('--city-zh') || '大阪';
  const poiName = arg('--poi') || '大阪城';
  const matrixId = arg('--matrix-id') || resolveMatrixId(cityZh, poiName);
  const pilot = getCityPilot(cityZh);
  const poi = poiName || pilot.pois[pilot.matrix_ids.indexOf(matrixId)];
  const unlockReason = arg('--unlock-real-error');
  const heroFile = arg('--hero-file') || QA_REMEDIATION_HERO[matrixId] || pilot.hero_files?.[matrixId];
  if (!heroFile) {
    console.error(`missing --hero-file or QA_REMEDIATION_HERO[${matrixId}]`);
    process.exit(2);
  }

  const assetBefore = getAsset(matrixId);
  const resumePublish =
    !unlockReason &&
    assetBefore.state === 'OPEN' &&
    assetBefore.replace_count >= 1 &&
    assetBefore.hero_file === heroFile;

  if (!resumePublish) {
    assertCanReplace(matrixId, { unlockReason });
  }

  console.log(`\n===== Content QA Remediation · ${cityZh} · ${poi} =====`);
  console.log('① Review · 确认跨区/图文不一致 · 批准 Replace');
  if (resumePublish) {
    console.log(`② Resume · Replace 已记录 · 继续 Publish → Verify (${heroFile})`);
  } else {
    recordReplace(matrixId, { hero_file: heroFile, city_zh: cityZh, poi, unlockReason });
    console.log(`② Replace (1×) → ${heroFile}`);
  }
  await ensureHeroOnStaging(heroFile);

  console.log('③ Publish → ④ Verify → Execution PASS');
  execSync(
    `node scripts/dev/run-cms-phase1-poi-wave1-closed-loop.cjs --city-zh ${cityZh} --matrix-id ${matrixId} --hero-file ${heroFile} --skip-refresh`,
    {
      cwd: ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        API,
        API_BASE: API,
        TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE: process.env.TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE || '1',
      },
    },
  );

  updatePilotHeroFile(matrixId, heroFile);

  const visualGap = readJson(VISUAL_GAP);
  const qa = assessSinglePoiContentQa({
    cityZh,
    matrixId,
    heroFile,
    catalogVerifyOk: true,
    visualGap,
  });

  console.log('\n===== 六维 Content QA =====');
  const dims = ['execution', 'cms_ownership', 'runtime_consumer', 'geo_matching', 'content_accuracy', 'l5_quality'];
  for (const d of dims) {
    console.log(`  ${d}: ${qa[d].verdict}${qa[d].reason ? ` · ${qa[d].reason}` : ''}`);
  }

  if (!qa.all_pass) {
    console.error(`\nTT_CMS_CONTENT_QA_POI: OPEN · ${matrixId} · 未 LOCK`);
    process.exit(1);
  }

  lockAsset(matrixId, qa);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `${matrixId}-LOCK-${stamp}.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        schema: 'traveltrust.cms_content_qa_poi_lock.v1',
        matrix_id: matrixId,
        city_zh: cityZh,
        poi,
        hero_file: heroFile,
        locked_at_utc: new Date().toISOString(),
        content_qa: qa,
        TT_CMS_CONTENT_QA_ASSET: 'LOCKED',
        registry: REGISTRY,
      },
      null,
      2,
    ) + '\n',
  );

  const boardScript =
    pilot.country_iso === 'CN'
      ? 'scripts/dev/run-cms-china-content-qa.cjs'
      : pilot.country_iso === 'AE'
      ? 'scripts/dev/run-cms-uae-content-qa.cjs'
      : pilot.country_iso === 'ES'
      ? 'scripts/dev/run-cms-spain-content-qa.cjs'
      : pilot.country_iso === 'AU'
      ? 'scripts/dev/run-cms-australia-content-qa.cjs'
      : pilot.country_iso === 'US'
      ? 'scripts/dev/run-cms-usa-content-qa.cjs'
      : pilot.country_iso === 'FR'
        ? 'scripts/dev/run-cms-france-content-qa.cjs'
        : pilot.country_iso === 'SG'
        ? 'scripts/dev/run-cms-singapore-content-qa.cjs'
        : pilot.country_iso === 'TH'
        ? 'scripts/dev/run-cms-thailand-content-qa.cjs'
        : pilot.country_iso === 'KR'
          ? 'scripts/dev/run-cms-korea-content-qa.cjs'
          : 'scripts/dev/run-cms-japan-content-qa.cjs';
  execSync(`node ${boardScript}`, { cwd: ROOT, stdio: 'inherit' });

  console.log(`\nTT_CMS_CONTENT_QA_POI: LOCKED · ${matrixId} · ${poi}`);
  console.log(`Evidence: ${outPath}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
