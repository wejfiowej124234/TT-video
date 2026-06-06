import { describe, expect, it } from "vitest";

import {

  isGuideAlreadyRegistered,

  isGuidePendingReview,

  isGuideRejected,

  isGuideSuspended,

  validateGuideRegisterStep1,

  validateGuideRegisterStep2,

} from "./guideRegisterValidation";



describe("guideRegisterValidation", () => {

  it("detects guide status buckets", () => {

    expect(isGuideAlreadyRegistered("active")).toBe(true);

    expect(isGuidePendingReview("pending_review")).toBe(true);

    expect(isGuidePendingReview("reviewing")).toBe(true);

    expect(isGuideRejected("rejected")).toBe(true);

    expect(isGuideSuspended("suspended")).toBe(true);

    expect(isGuideAlreadyRegistered("pending")).toBe(false);

  });



  it("requires wallet and passport on step 1", () => {

    expect(

      validateGuideRegisterStep1({

        walletAddress: "",

        realName: "a",

        idNumber: "p",

        idPhotoFile: null,

        pendingIdPhoto: null,

        walletVerified: false,

      }),

    ).toEqual({ messageKey: "guideRegister_errorWalletRequired", field: "wallet" });

    expect(

      validateGuideRegisterStep1({

        walletAddress: "0x" + "a".repeat(40),

        realName: "a",

        idNumber: "p",

        idPhotoFile: new File([], "x.jpg"),

        pendingIdPhoto: null,

        walletVerified: false,

      }),

    ).toEqual({ messageKey: "guideRegister_walletVerifyRequired", field: "wallet" });

    expect(

      validateGuideRegisterStep1({

        walletAddress: "0x" + "a".repeat(40),

        realName: "a",

        idNumber: "p",

        idPhotoFile: new File([], "x.jpg"),

        pendingIdPhoto: null,

        walletVerified: true,

      }),

    ).toBeNull();

  });



  it("requires country and preset city on step 2", () => {

    expect(

      validateGuideRegisterStep2({

        city: "",

        countryCode: "",

        languages: "中文",

        serviceTypes: "向导服务",

      }),

    ).toEqual({ messageKey: "guideRegister_errorCountry", field: "country" });

    expect(

      validateGuideRegisterStep2({

        city: "杭州",

        countryCode: "CN",

        languages: "",

        serviceTypes: "向导服务",

      }),

    ).toEqual({ messageKey: "guideRegister_errorLanguages", field: "languages" });

  });

});


