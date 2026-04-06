/**
 * PostCSS（Tailwind + autoprefixer）。
 * 使用 CommonJS 形态，避免 Next 15 + Turbopack 在 Windows 上偶发 `Cannot find module '.next/postcss.js'`
 *（子进程桥接与仅 `postcss.config.mjs` 时生成/解析不一致；参见 next.js discussion #82239）。
 * @type {import('postcss-load-config').Config}
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
