/**
 * EIP-191 personal_sign for wallet-verify API E2E（与 `me_wallet_verify_db_api_tests` 同源私钥）。
 */
import { privateKeyToAccount } from "viem/accounts";

/** `secp256k1::SecretKey::from_slice(&[7u8; 32])` — 勿用于主网/生产。 */
export const E2E_WALLET_VERIFY_PRIVATE_KEY =
  "0x0707070707070707070707070707070707070707070707070707070707070707" as const;

export const e2eWalletVerifyAccount = privateKeyToAccount(E2E_WALLET_VERIFY_PRIVATE_KEY);

export async function signEip191PersonalMessage(message: string): Promise<`0x${string}`> {
  return e2eWalletVerifyAccount.signMessage({ message });
}
