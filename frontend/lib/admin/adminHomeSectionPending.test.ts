import { describe, expect, it } from "vitest";



import { sectionDefaultOpenByPending, sectionPendingCount } from "@/lib/admin/adminHomeSectionPending";



describe("adminHomeSectionPending", () => {

  const emptyChannels = {

    provider: { count: null, permissionDenied: false, errorKind: null },

    steward: { count: null, permissionDenied: false, errorKind: null },

    approvals: { count: null, permissionDenied: false, errorKind: null },

    reports: { count: null, permissionDenied: false, errorKind: null },

  };



  it("opens sections only when pending > 0", () => {

    expect(sectionDefaultOpenByPending(0)).toBe(false);

    expect(sectionDefaultOpenByPending(3)).toBe(true);

    expect(sectionDefaultOpenByPending(null)).toBe(false);

  });



  it("does not treat core list volume as inbox pending", () => {

    const n = sectionPendingCount(

      "core",

      { provider: 5, steward: 0, approvals: 0, reports: 0 },

      emptyChannels,

      { orders: 200, disputes: 50 },

      false,

      false,

      () => true,

      true,

    );

    expect(n).toBe(0);

  });



  it("sums community pending from inbox reports channel", () => {

    const n = sectionPendingCount(

      "community",

      { provider: 0, steward: 0, approvals: 0, reports: 4 },

      emptyChannels,

      { orders: 0, disputes: 0 },

      false,

      false,

      () => true,

      true,

    );

    expect(n).toBe(4);

  });

});


