const path = require("path");

// Turbopack does not resolve Windows absolute paths in resolveAlias ("windows imports are not implemented yet").
// Keep a project-relative POSIX-style path from the frontend root (where this config lives).
const emptyStub = "./lib/empty-module-stub.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Fly/Docker staging：`NEXT_STANDALONE=1` 时 standalone + 跳过 build 期 ESLint/TS（② staging 部署；本地仍走 npm run lint / tsc） */
  ...(process.env.NEXT_STANDALONE === "1"
    ? {
        output: "standalone",
        eslint: { ignoreDuringBuilds: true },
        typescript: { ignoreBuildErrors: true },
      }
    : {}),
  reactStrictMode: true,
  poweredByHeader: false,
  /**
   * 缩小 barrel 解析范围，降低 `next dev` 首次编译某路由时的模块数（冷启动仍慢，重复访问会快很多）。
   * 见 frontend/README.md「开发模式耗时」。
   */
  experimental: {
    /**
     * Next 15.5+ 默认 true：在 dev 的 RSC 树中注入 `SegmentViewNode`（segment explorer）。
     * Windows + Turbopack（及偶发 torn `.next`）下曾出现：
     * `Could not find the module ... segment-explorer-node.js#SegmentViewNode in the React Client Manifest`，
     * 随后 `reading 'call'`、整页无 CSS（hydration 失败）。关断后仅失去 dev 里「段边界」探测 UI，不影响生产。
     */
    devtoolSegmentExplorer: false,
    /**
     * 客户端路由缓存（秒）：`prefetch={true}` 的 Link 用 static；未显式设 prefetch 时用 dynamic。
     * 略延长复用窗口，减少来回切顶栏时的重复 RSC 拉取（dev 仍受按需编译影响）。
     */
    staleTimes: {
      /** 延长客户端 Router Cache，减轻重复 RSC 往返（与 RoutePrefetcher 同向；目标切页 ~50ms 体感） */
      dynamic: 300,
      static: 900,
    },
    /** 与 middleware 协作时更积极预取，利于受保护页少一次往返（admin 仍走登录重定向） */
    middlewarePrefetch: "flexible",
    optimizePackageImports: [
      "framer-motion",
      "@tanstack/react-query",
      "@tanstack/react-virtual",
      /** 全站 Providers / DApp：减轻 barrel 解析，略缩「首次点开某路由」的模块扫描量 */
      "wagmi",
      "viem",
    ],
  },
  /** 避免误用上级目录的 package-lock（如用户主目录）作为 tracing 根 */
  outputFileTracingRoot: path.join(__dirname),
  /** 与下方 webpack resolve.fallback 对齐，避免 `next dev --turbopack` 提示仅配置了 Webpack */
  turbopack: {
    resolveAlias: {
      "@react-native-async-storage/async-storage": emptyStub,
      "pino-pretty": emptyStub,
    },
  },
  webpack: (config, { isServer, dev }) => {
    // MetaMask SDK 在浏览器中不需要 React Native 的 async-storage；WalletConnect/pino 不需要 pino-pretty
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };
    // 生产 Server：`webpack-runtime.js` 在 `.next/server/` 根下 `require("./<chunkId>.js")`，
    // 默认却把**纯数字 id** 异步 chunk 打进 `server/chunks/`，Windows 上 `next build` 在 Collecting page data 即 MODULE_NOT_FOUND
    //（如 `./5611.js`）；`sync-server-chunks.mjs` 只在 build 成功后才跑，救不了此阶段。
    // Next 15.5+ 常把 `chunkFilename` 设成 **函数**：包一层剥 `chunks/` 易误伤 `app/` 等路径（PageNotFound）。
    // 在 **`processAssets`** 为 **`chunks/<digits>.js`** 再 **emit 同内容到 `<digits>.js`**（与 runtime 对齐）。
    if (isServer && !dev) {
      const webpack = require("webpack");
      const numericChunkDupPlugin = new (class {
        /** @param {import("webpack").Compiler} compiler */
        apply(compiler) {
          compiler.hooks.thisCompilation.tap("DupNumericServerChunksToRoot", (compilation) => {
            compilation.hooks.processAssets.tap(
              {
                name: "DupNumericServerChunksToRoot",
                stage: webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
              },
              () => {
                const names = compilation.getAssets().map((a) => a.name);
                for (const name of names) {
                  if (!name.startsWith("chunks/") || !name.endsWith(".js")) continue;
                  const base = name.slice("chunks/".length);
                  if (!/^\d+\.js$/u.test(base)) continue;
                  if (compilation.getAsset(base)) continue;
                  const src = compilation.getAsset(name);
                  if (!src) continue;
                  compilation.emitAsset(base, src.source, src.info);
                }
              },
            );
          });
        }
      })();
      config.plugins = [...(config.plugins || []), numericChunkDupPlugin];
    }
    if (isServer && !dev && config.output) {
      const cf = config.output.chunkFilename;
      if (typeof cf === "string" && /^chunks[/\\]/u.test(cf)) {
        config.output.chunkFilename = cf.replace(/^chunks[/\\]/u, "");
      }
    }
    return config;
  },
  /**
   * 浏览器侧 `apiUrl()` 在 `NEXT_PUBLIC_API_BASE_URL` 为 localhost/127.0.0.1 时使用**相对路径**；
   * 由此将请求发到当前 Next origin，再代理到真实 API，避免本地 CORS 与 `Failed to fetch`。
   * 与 `frontend/lib/api.ts` 中 `isLoopbackApiBase` 对齐。
   * **`/api/v1/uploads/community-posts/*`** 等社区媒体与 JSON API 同条 rewrite，与 **②③** 分源部署时仍走同一 `dest`。
   */
  async rewrites() {
    const dest = (
      process.env.API_REWRITE_TARGET ||
      process.env.NEXT_PUBLIC_API_REWRITE_TARGET ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://127.0.0.1:8080"
    ).replace(/\/$/, "");
    const s3Public = (
      process.env.NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL ||
      process.env.COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL ||
      ""
    )
      .trim()
      .replace(/\/$/, "");
    const rewrites = [
      { source: "/favicon.ico", destination: "/favicon.svg" },
      { source: "/apple-touch-icon.png", destination: "/favicon.svg" },
      { source: "/api/v1/:path*", destination: `${dest}/api/v1/:path*` },
      { source: "/health", destination: `${dest}/health` },
      { source: "/meta", destination: `${dest}/meta` },
      { source: "/auth/:path*", destination: `${dest}/auth/:path*` },
    ];
    if (
      s3Public &&
      !/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\]|::1)(:|\/|$)/i.test(s3Public)
    ) {
      rewrites.push({
        source: "/tt-community-s3/:path*",
        destination: `${s3Public}/:path*`,
      });
    }
    return rewrites;
  },
  images: {
    /** 显式默认 loader，避免本地缓存/合并配置残留 `custom` 导致全站 `next-image-missing-loader` */
    loader: "default",
    /**
     * 勿设 `loader: "custom"` + `loaderFile`（除非每处 `<Image>` 都传 `loader`）；Turbopack 下易与远程图冲突。
     */
    /** Next 16+：`<Image quality={n}>` 须在白名单内；全站常用档位一并列出 */
    qualities: [75, 80, 85, 90, 92, 95, 100],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/**" },
      /**
       * ① 本地证据链：`COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL` 常为 `http://127.0.0.1:19000/...`（见 `evidence/community-media-local-minio-chain`），
       * Feed 卡片 `<Image>` 会直接引用该 host；未列入则整段 `/community` 落入 **`app/community/error`**。
       */
      { protocol: "http", hostname: "127.0.0.1", port: "19000", pathname: "/**" },
      { protocol: "http", hostname: "localhost", port: "19000", pathname: "/**" },
      /** ② staging C4/C5：社区 Feed 视频封面/playback URL（`cdn-staging.example.test`）须列入，否则 `/community` error boundary */
      { protocol: "https", hostname: "cdn-staging.example.test", pathname: "/**" },
      { protocol: "https", hostname: "cdn.example.test", pathname: "/**" },
    ],
  },
  async headers() {
    /** 生产保留 nosniff；dev 省略 — 否则 stale /_next 哈希 404 常带 text/plain，与 nosniff 叠加会报
     * 「MIME type text/plain is not a supported stylesheet」掩盖真实原因（应 `npm run dev:clean` 修 chunk 404）。 */
    const base = [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      /** 140 / 07 §5.6A：默认收紧敏感能力；钱包连接不依赖 camera/mic/geolocation */
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];
    if (process.env.NODE_ENV === "production") {
      base.splice(1, 0, { key: "X-Content-Type-Options", value: "nosniff" });
    }
    return [{ source: "/:path*", headers: base }];
  },
};

module.exports = nextConfig;
