#!/usr/bin/env node
/**
 * ① 本地 smoke · EIP-191 personal_sign（wallet verify confirm）
 *
 * Usage: node scripts/dev/sign-eip191-message.mjs "<message>"
 * Env:   SMOKE_WALLET_PRIVATE_KEY（默认 = onboarding smokes 用 0x4a623166… 测试钥）
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const message = process.argv[2];
if (!message) {
  console.error("usage: sign-eip191-message.mjs <message>");
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const requireFromFe = createRequire(join(root, "frontend/package.json"));
const { privateKeyToAccount } = requireFromFe("viem/accounts");

const DEFAULT_PK =
  "0x0707070707070707070707070707070707070707070707070707070707070707";
const pk = process.env.SMOKE_WALLET_PRIVATE_KEY || DEFAULT_PK;
const account = privateKeyToAccount(pk);
const signature = await account.signMessage({ message });
process.stdout.write(signature);
