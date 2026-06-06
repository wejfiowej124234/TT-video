import { describe, it, expect } from "vitest";
import {
  communityPublishBlockedKeys,
  merchantCatalogPublishBlockedKeys,
  acquisitionCatalogPublishBlockedKeys,
  ACTION_GATE_KEYS,
} from "./publishActionBlockedKeys";

describe("publishActionBlockedKeys", () => {
  it("community: session + body + media rules", () => {
    expect(
      communityPublishBlockedKeys({
        sessionOk: false,
        type: "text",
        hasBody: false,
        photoCount: 0,
        hasVideoPreview: false,
      }),
    ).toEqual([ACTION_GATE_KEYS.login, ACTION_GATE_KEYS.postBody]);

    expect(
      communityPublishBlockedKeys({
        sessionOk: true,
        type: "photo",
        hasBody: true,
        photoCount: 0,
        hasVideoPreview: false,
      }),
    ).toEqual([ACTION_GATE_KEYS.postPhotos]);

    expect(
      communityPublishBlockedKeys({
        sessionOk: true,
        type: "video",
        hasBody: true,
        photoCount: 0,
        hasVideoPreview: false,
      }),
    ).toEqual([ACTION_GATE_KEYS.postVideo]);

    expect(
      communityPublishBlockedKeys({
        sessionOk: true,
        type: "text",
        hasBody: true,
        photoCount: 0,
        hasVideoPreview: false,
      }),
    ).toEqual([]);
  });

  it("community: unauthenticated photo flow lists login before media/body gaps", () => {
    expect(
      communityPublishBlockedKeys({
        sessionOk: false,
        type: "photo",
        hasBody: false,
        photoCount: 0,
        hasVideoPreview: false,
      }),
    ).toEqual([ACTION_GATE_KEYS.login, ACTION_GATE_KEYS.postBody, ACTION_GATE_KEYS.postPhotos]);
  });

  it("community: unauthenticated video flow lists login, body, and video preview", () => {
    expect(
      communityPublishBlockedKeys({
        sessionOk: false,
        type: "video",
        hasBody: false,
        photoCount: 0,
        hasVideoPreview: false,
      }),
    ).toEqual([ACTION_GATE_KEYS.login, ACTION_GATE_KEYS.postBody, ACTION_GATE_KEYS.postVideo]);
  });

  it("community: authenticated text without body only blocks body", () => {
    expect(
      communityPublishBlockedKeys({
        sessionOk: true,
        type: "text",
        hasBody: false,
        photoCount: 0,
        hasVideoPreview: false,
      }),
    ).toEqual([ACTION_GATE_KEYS.postBody]);
  });

  it("merchant catalog gate matches required fields", () => {
    const keys = merchantCatalogPublishBlockedKeys(
      { title: "", priceUsdc: "", agreeEscrowCopy: false, countryIso: "ZZ" },
      false,
    );
    expect(keys).toContain(ACTION_GATE_KEYS.login);
    expect(keys).toContain(ACTION_GATE_KEYS.titleMerchant);
    expect(keys).toContain(ACTION_GATE_KEYS.priceMerchant);
    expect(keys).toContain(ACTION_GATE_KEYS.escrowAck);
    expect(keys).toContain(ACTION_GATE_KEYS.countryNotAllowed);
  });

  it("acquisition catalog gate matches required fields", () => {
    const keys = acquisitionCatalogPublishBlockedKeys(
      {
        title: "",
        destinationCountryIso: "",
        bountyMinUsdc: "0",
        bountyMaxUsdc: "1",
        agreeEscrowCopy: false,
      },
      false,
    );
    expect(keys).toContain(ACTION_GATE_KEYS.login);
    expect(keys).toContain(ACTION_GATE_KEYS.titleAcquisition);
    expect(keys).toContain(ACTION_GATE_KEYS.countryAcquisition);
    expect(keys).toContain(ACTION_GATE_KEYS.bountyAcquisition);
    expect(keys).toContain(ACTION_GATE_KEYS.escrowAck);
  });

  it("acquisition catalog gate: valid form + session yields no blocked keys", () => {
    expect(
      acquisitionCatalogPublishBlockedKeys(
        {
          title: "  Want luxury bags  ",
          destinationCountryIso: "cn",
          bountyMinUsdc: "50",
          bountyMaxUsdc: "200",
          agreeEscrowCopy: true,
        },
        true,
      ),
    ).toEqual([]);
  });

  it("merchant catalog gate: valid form + session yields no blocked keys", () => {
    expect(
      merchantCatalogPublishBlockedKeys(
        { title: "Studio", priceUsdc: "99", agreeEscrowCopy: true, countryIso: "CN" },
        true,
      ),
    ).toEqual([]);
  });

  it("merchant catalog gate: empty ISO skips country-not-allowed (optional field)", () => {
    const keys = merchantCatalogPublishBlockedKeys(
      { title: "T", priceUsdc: "1", agreeEscrowCopy: true, countryIso: "  " },
      true,
    );
    expect(keys).not.toContain(ACTION_GATE_KEYS.countryNotAllowed);
  });
});
