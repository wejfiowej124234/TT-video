import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const zhPath = path.join(root, "locales", "zh.ts");
const enPath = path.join(root, "locales", "en.ts");
const outPath = path.join(root, ".i18n-coverage.json");

const keyRouteChecks = [
  {
    id: "login",
    file: "app/auth/login/page.tsx",
    rule: "must contain useTranslation or t(...)",
    pass: (content) => content.includes("useTranslation(") || /\bt\(/.test(content),
  },
  {
    id: "place_order",
    file: "app/itinerary/new/page.tsx",
    rule: "must contain useTranslation or t(...)",
    pass: (content) => content.includes("useTranslation(") || /\bt\(/.test(content),
  },
  {
    id: "orders",
    file: "app/orders/page.tsx",
    rule: "must contain useTranslation and t(...)",
    pass: (content) => content.includes("useTranslation(") && /\bt\(/.test(content),
  },
  {
    id: "disputes",
    file: "app/disputes/page.tsx",
    rule: "must contain useTranslation and t(...)",
    pass: (content) => content.includes("useTranslation(") && /\bt\(/.test(content),
  },
  {
    id: "order_detail",
    file: "components/escrow/EscrowDetail/index.tsx",
    rule: "must contain useTranslation and t(...)",
    pass: (content) => content.includes("useTranslation(") && /\bt\(/.test(content),
  },
];

// Detect raw hardcoded Chinese text in visible JSX text nodes on critical routes.
// We intentionally avoid scanning all JS string literals because regex patterns,
// error classifiers, and implementation comments can legitimately contain CJK.
const hardcodedAllowlist = {
  "app/auth/login/page.tsx": ["auth_login_error_failed"],
  "app/itinerary/new/page.tsx": [],
  "app/orders/page.tsx": [],
  "app/disputes/page.tsx": [],
  "components/escrow/EscrowDetail/index.tsx": [],
};

function stripComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function hasHardcodedCjk(content, allowed = []) {
  const src = stripComments(content);
  const jsxTextRe = />[^<{]*[\u4e00-\u9fff][^<{]*</g;
  const hits = [];

  for (const m of src.matchAll(jsxTextRe)) {
    const v = m[0];
    if (!allowed.some((x) => v.includes(x))) hits.push(v.trim());
  }
  return {
    detected: hits.length > 0,
    samples: hits.slice(0, 10),
  };
}

function extractKeys(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const keys = new Set();
  const re = /^\s*([a-zA-Z0-9_]+)\s*:/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    keys.add(m[1]);
  }
  return keys;
}

function toSortedArray(set) {
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

const zhKeys = extractKeys(zhPath);
const enKeys = extractKeys(enPath);

const missingInEn = toSortedArray(new Set([...zhKeys].filter((k) => !enKeys.has(k))));
const missingInZh = toSortedArray(new Set([...enKeys].filter((k) => !zhKeys.has(k))));

const criticalPrefixes = [
  "common_",
  "orders_",
  "disputes_",
  "order_",
  "escrow_",
];

const prefixCoverage = criticalPrefixes.map((prefix) => {
  const zhCount = [...zhKeys].filter((k) => k.startsWith(prefix)).length;
  const enCount = [...enKeys].filter((k) => k.startsWith(prefix)).length;
  return {
    prefix,
    zh_count: zhCount,
    en_count: enCount,
    passed: zhCount > 0 && enCount > 0,
  };
});

const failedPrefixes = prefixCoverage.filter((x) => !x.passed).map((x) => x.prefix);

const keyRouteResults = keyRouteChecks.map((item) => {
  const abs = path.join(root, item.file);
  if (!fs.existsSync(abs)) {
    return {
      id: item.id,
      file: item.file,
      rule: item.rule,
      status: "failed",
      reason: "file_not_found",
    };
  }
  const content = fs.readFileSync(abs, "utf8");
  const ok = item.pass(content);
  const hardcoded = hasHardcodedCjk(content, hardcodedAllowlist[item.file] || []);
  const status = ok && !hardcoded.detected ? "passed" : "failed";
  const reason = !ok
    ? "translation_usage_not_detected"
    : hardcoded.detected
      ? "hardcoded_cjk_detected"
      : undefined;
  return {
    id: item.id,
    file: item.file,
    rule: item.rule,
    status,
    reason,
    hardcoded_samples: hardcoded.samples,
  };
});

const keyRouteFailed = keyRouteResults.filter((x) => x.status !== "passed");
const keyRouteCoverage = {
  total: keyRouteResults.length,
  passed: keyRouteResults.length - keyRouteFailed.length,
  percent: Number((((keyRouteResults.length - keyRouteFailed.length) / keyRouteResults.length) * 100).toFixed(2)),
};

const passed =
  missingInEn.length === 0 &&
  missingInZh.length === 0 &&
  failedPrefixes.length === 0 &&
  keyRouteFailed.length === 0 &&
  keyRouteCoverage.percent === 100;

const report = {
  workflow: "Build",
  job: "frontend",
  check: "test:i18n:ci",
  commit_sha: process.env.GITHUB_SHA || "local",
  env: process.env.CI ? "ci" : "local",
  locale: ["zh", "en"],
  rule_id: "i18n-key-parity-critical-prefix-and-key-routes",
  severity: passed ? "none" : "critical",
  owner: "frontend-team",
  generated_at: new Date().toISOString(),
  totals: {
    zh_keys: zhKeys.size,
    en_keys: enKeys.size,
  },
  missing_in_en: missingInEn,
  missing_in_zh: missingInZh,
  critical_prefix_coverage: prefixCoverage,
  key_route_coverage: keyRouteCoverage,
  key_route_results: keyRouteResults,
  passed,
};

fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

if (!passed) {
  console.error("[i18n-gate] failed. See .i18n-coverage.json for details.");
  process.exit(1);
}

console.log("[i18n-gate] passed.");
