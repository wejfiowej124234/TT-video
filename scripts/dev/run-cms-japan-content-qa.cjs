#!/usr/bin/env node
/**
 * Japan L5 Content QA · Phase③ · 六维 · 逐项 Backlog · JP Country 标准
 *
 *   node scripts/dev/run-cms-japan-content-qa.cjs
 *
 * 国家顺序：Execution → Content QA → Country CLOSED
 * Phase① CMS 系统 FROZEN · Phase② Execution 不重复 · Phase③ ACTIVE
 * 不叫 Audit · 不扩展 CMS 架构
 */
const fs = require('fs');
const path = require('path');
const { buildJapanContentQa, formatMarkdown, rankLabel } = require('./lib/cms-japan-content-qa.cjs');

const ROOT = path.join(__dirname, '../..');
const OUT_JSON = path.join(ROOT, 'evidence/GO_cms_operation/CMS-JAPAN-CONTENT-QA-LATEST.json');
const OUT_MD = path.join(ROOT, 'evidence/GO_cms_operation/CMS-JAPAN-CONTENT-QA-LATEST.md');

function main() {
  const report = buildJapanContentQa();
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));
  fs.writeFileSync(OUT_MD, formatMarkdown(report));

  console.log(`TT_CMS_JP_CONTENT_QA: ${report.TT_CMS_JP_CONTENT_QA}`);
  console.log(`TT_CMS_JP_COUNTRY: ${report.TT_CMS_JP_COUNTRY}`);
  console.log(`Execution PASS: ${report.summary.cities_execution_pass}/5 cities`);
  console.log(`Content QA Closed: ${report.summary.cities_content_qa_closed}/5 cities`);
  console.log(`Content Accuracy issues: ${report.summary.total_content_accuracy_issues}`);
  console.log(`Next remediation: ${report.summary.next_remediation_city || '—'}`);
  console.log(`Workflow: ${report.country_workflow.template}`);
  console.log('');
  for (const city of report.cities) {
    console.log(
      `${city.city_zh} | Exec ${city.execution.verdict} | CMS ${city.cms_ownership.verdict} | Runtime ${city.runtime_consumer.verdict} | Geo ${city.geo_matching.verdict} | Accuracy ${city.content_accuracy.verdict} | L5 ${city.l5_quality.verdict} | QA ${city.content_qa_closed ? 'CLOSED' : 'OPEN'}`,
    );
    for (const item of city.backlog_items.slice(0, 3)) {
      console.log(`  ${rankLabel(item.rank)} ${item.poi}  ${item.display_line}`);
    }
    if (city.backlog_items.length > 3) console.log(`  … +${city.backlog_items.length - 3} more`);
  }
  console.log('');
  console.log('Country criteria:');
  for (const c of report.country.criteria) {
    console.log(`  ${c.verdict} ${c.label}`);
  }
  console.log(`Evidence: ${OUT_JSON}`);
  console.log(`Markdown: ${OUT_MD}`);
}

main();
