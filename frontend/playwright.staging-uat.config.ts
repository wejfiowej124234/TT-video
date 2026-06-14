/**
 * Staging UAT：仅连远程 tt-web-staging，不启动 webServer。
 * ADM-U02 / ADM-U01：经 fly proxy 的 docker psql 较慢，须拉长用例 timeout。
 */
import base from "./playwright.config";

const stagingTimeoutRaw = process.env.PLAYWRIGHT_GOTO_TIMEOUT_MS?.trim() ?? "120000";
const stagingTimeoutParsed = Number.parseInt(stagingTimeoutRaw, 10);
const stagingTimeout = Number.isFinite(stagingTimeoutParsed) ? stagingTimeoutParsed : 120_000;

const projects = (base.projects ?? []).map((project) => {
  if (project.name === "chromium" || project.name === "setup-meta-chain") {
    return { ...project, timeout: stagingTimeout };
  }
  return project;
});

export default {
  ...base,
  webServer: undefined,
  timeout: stagingTimeout,
  projects,
};
