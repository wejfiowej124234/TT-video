#!/usr/bin/env node
/**
 * USA L5 Content QA · ② staging · JP + KR + TH + SG + FR 五模板 · 不调整标准
 *
 *   node scripts/dev/run-cms-usa-content-qa.cjs
 */
const fs = require('fs');
const path = require('path');
const { buildUsaContentQa } = require('./lib/cms-usa-content-qa.cjs');

const ROOT = path.join(__dirname, '../..');
const OUT_JSON = path.join(ROOT, 'evidence/GO_cms_operation/CMS-USA-CONTENT-QA-LATEST.json');

function main() {
  const report = buildUsaContentQa();
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + '\n');

  console.log(`TT_CMS_US_CONTENT_QA: ${report.TT_CMS_US_CONTENT_QA}`);
  console.log(`TT_CMS_US_COUNTRY: ${report.TT_CMS_US_COUNTRY}`);
  console.log(`Execution PASS: ${report.summary.cities_execution_pass}/4 cities`);
  console.log(`Content QA Closed: ${report.summary.cities_content_qa_closed}/4 cities`);
  console.log(`Active city: ${report.summary.active_city?.city_zh || '—'}`);
  for (const city of report.cities) {
    console.log(
      `${city.city_zh} | Exec ${city.execution.verdict} | QA ${city.content_qa_closed ? 'CLOSED' : 'OPEN'} | locked ${city.locked_count || 0}/${city.poi_count}`,
    );
  }
  console.log(`Evidence: ${OUT_JSON}`);
}

main();
