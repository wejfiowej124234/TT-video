/**

 * 全量 E2E 前的链元数据门禁：先于 chromium project 运行（见 playwright.config.ts dependencies）。

 */

import { test, expect } from "@playwright/test";

import {

  assertMetaChainContractsStrict,

  assertMetaJsonMinimal,

} from "../helpers/metaChainGuard";

import { getMetaJsonWithRetry } from "../helpers/metaFetchRetry";



const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";

const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

const relaxed = process.env.PLAYWRIGHT_RELAX_META_CHAIN_GUARD === "1";

const META_REQUEST_TIMEOUT_MS = 120_000;



function isRecord(x: unknown): x is Record<string, unknown> {

  return typeof x === "object" && x !== null && !Array.isArray(x);

}



test.describe("setup: GET /meta chain.contracts", () => {

  test("API /meta satisfies chain guard", async ({ request }) => {

    const meta = await getMetaJsonWithRetry(

      request,

      `${API_BASE.replace(/\/$/, "")}/meta`,

      { timeoutMs: META_REQUEST_TIMEOUT_MS },

    );

    if (!isRecord(meta)) {

      throw new Error("GET /meta: body is not a JSON object");

    }

    if (relaxed) {

      assertMetaJsonMinimal(meta);

    } else {

      assertMetaChainContractsStrict(meta);

    }

  });



  test("Next rewrites /meta to API (full stack only)", async ({ request }) => {

    test.skip(process.env.PLAYWRIGHT_FULL_STACK !== "1", "only when webServer starts Next + API");

    let meta = (await getMetaJsonWithRetry(request, "/meta", {

      timeoutMs: META_REQUEST_TIMEOUT_MS,

    })) as Record<string, unknown>;

    if (meta._dev_fallback === true) {

      meta = (await getMetaJsonWithRetry(request, `${API_BASE.replace(/\/$/, "")}/meta`, {

        timeoutMs: META_REQUEST_TIMEOUT_MS,

      })) as Record<string, unknown>;

    }

    if (relaxed) {

      assertMetaJsonMinimal(meta);

      return;

    }

    assertMetaChainContractsStrict(meta);

  });

});


