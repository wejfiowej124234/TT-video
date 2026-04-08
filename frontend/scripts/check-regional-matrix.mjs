import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cfgPath = path.join(root, "scripts", "regional-matrix.config.json");
const geoPath = path.join(root, "lib", "geoOptions.ts");
const i18nPath = path.join(root, "lib", "i18n.ts");

const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const matrix = Array.isArray(cfg.entries) ? cfg.entries : [];
const policyVersion = cfg.policy_version || "unknown";

const geoContent = fs.readFileSync(geoPath, "utf8");
const i18nContent = fs.readFileSync(i18nPath, "utf8");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseSupportedLocales(content) {
  const m = content.match(/LOCALES\s*:\s*Locale\[\]\s*=\s*\[([^\]]+)\]/m);
  if (!m) return ["zh", "en"];
  return [...m[1].matchAll(/"([a-z]{2})"/g)].map((x) => x[1]);
}

/** 与 `CITIES_BY_COUNTRY` 键一致（国家中文名）；`COUNTRY_OPTIONS` 由 `PRODUCT_COUNTRIES` 派生，源码中未必出现 `value: "中国"` 字面量。 */
function countryExists(country) {
  const re = new RegExp(`^\\s*${escapeRegex(country)}:\\s*\\[`, "m");
  return re.test(geoContent);
}

function cityExistsInCountry(country, city) {
  const blockRe = new RegExp(`${escapeRegex(country)}\\s*:\\s*\\[([\\s\\S]*?)\\]\\s*,`, "m");
  const block = geoContent.match(blockRe);
  if (!block) return false;
  const cityRe = new RegExp(`value:\\s*"${escapeRegex(city)}"`);
  return cityRe.test(block[1]);
}

const supportedLocales = parseSupportedLocales(i18nContent);

function localeRoot(locale) {
  return String(locale || "").split("-")[0];
}

function validateEntry(entry) {
  const reasons = [];
  if (!countryExists(entry.country)) reasons.push("country_not_in_geo_options");
  if (!cityExistsInCountry(entry.country, entry.city)) reasons.push("city_not_in_country_map");
  if (!supportedLocales.includes(localeRoot(entry.locale))) reasons.push("locale_not_supported");
  return reasons;
}

function runCase(entry) {
  const validationErrors = validateEntry(entry);
  try {
    const amount = 12345.67;
    const now = new Date("2026-03-08T12:00:00Z");

    const currencyFormatted = new Intl.NumberFormat(entry.locale, {
      style: "currency",
      currency: entry.currency,
      maximumFractionDigits: 2,
    }).format(amount);

    const dateFormatted = new Intl.DateTimeFormat(entry.locale, {
      timeZone: entry.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);

    const passed = Boolean(currencyFormatted) && Boolean(dateFormatted) && validationErrors.length === 0;
    return {
      ...entry,
      policy_version: policyVersion,
      currency_preview: currencyFormatted,
      datetime_preview: dateFormatted,
      status: passed ? "passed" : "failed",
      validation_errors: validationErrors,
    };
  } catch (error) {
    return {
      ...entry,
      policy_version: policyVersion,
      status: "failed",
      error: String(error),
      validation_errors: validationErrors,
    };
  }
}

const results = matrix.map(runCase);
const failed = results.filter((r) => r.status !== "passed");

const report = {
  workflow: "Build",
  job: "regional-matrix",
  check: "test:regional:ci",
  commit_sha: process.env.GITHUB_SHA || "local",
  env: process.env.CI ? "ci" : "local",
  locale: "matrix",
  rule_id: "regional-matrix-country-city-locale-timezone",
  severity: failed.length === 0 ? "none" : "critical",
  owner: "frontend-team",
  generated_at: new Date().toISOString(),
  policy_version: policyVersion,
  config_source: "scripts/regional-matrix.config.json",
  supported_locales: supportedLocales,
  matrix_total: results.length,
  matrix_failed: failed.length,
  results,
  passed: failed.length === 0,
};

await import("node:fs").then(({ writeFileSync }) => {
  writeFileSync(".regional-matrix.json", JSON.stringify(report, null, 2));
});

if (failed.length > 0) {
  console.error("[regional-matrix-gate] failed. See .regional-matrix.json");
  process.exit(1);
}

console.log("[regional-matrix-gate] passed.");
