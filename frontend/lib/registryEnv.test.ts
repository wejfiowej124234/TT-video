import { afterEach, describe, expect, it } from "vitest";
import { getRegistryAddress } from "./registryEnv";

describe("getRegistryAddress", () => {
  const orig = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;

  afterEach(() => {
    if (orig === undefined) delete process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
    else process.env.NEXT_PUBLIC_REGISTRY_ADDRESS = orig;
  });

  it("returns null when unset", () => {
    delete process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
    expect(getRegistryAddress()).toBeNull();
  });

  it("returns checksummed address when valid", () => {
    process.env.NEXT_PUBLIC_REGISTRY_ADDRESS = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const a = getRegistryAddress();
    expect(a).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("returns null for invalid string", () => {
    process.env.NEXT_PUBLIC_REGISTRY_ADDRESS = "not-an-address";
    expect(getRegistryAddress()).toBeNull();
  });
});
