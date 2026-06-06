/**
 * Staging UAT：仅连远程 tt-web-staging，不启动 webServer。
 */
import base from "./playwright.config";

export default {
  ...base,
  webServer: undefined,
};
