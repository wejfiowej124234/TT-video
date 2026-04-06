/**
 * 07 §5.0（90）+ §5.1 / §5.6A / 130：订单页写接口 4xx 的 UI 文案与 `mapOrderWriteError`（53 附录 C）一致。
 * 全程 mock API（不依赖本地 8080）：
 * - 游客：POST cancel → trust_* / forbidden（通用无权）
 * - 游客：POST accept → not_guide（角色不符）
 * - 向导：POST accept → trust_* / accept_window_expired（410）/ schedule_conflict·invalid_state（409，与 chain_off 一致）
 * - 向导：POST cancel → not_tourist（角色不符）
 * - Accepted 态：POST confirm-completion / confirm-bilateral → trust_*（53-S6 / 完成确认链）
 * - 草稿态 + itinerary：`ChatBlock` 可见，POST messages → trust_*（53-S7）
 * - Completed 态：`ReviewBlock` 可见，POST reviews → trust_*（53 评分）
 * - Accepted 无托管：链下争议 POST dispute → trust_* / messages 429 → common_apiRateLimitExceeded（100）
 */
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const ORDER_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const TOURIST_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const GUIDE_ROW_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const GUIDE_USER_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const VALID_WALLET = "0x1111111111111111111111111111111111111111";

type TrustEscrowScenario =
  | "tourist_cancel_trust"
  | "tourist_cancel_identity_restricted"
  | "tourist_cancel_risk_too_high"
  | "tourist_cancel_forbidden"
  | "tourist_accept_not_guide"
  | "guide_accept_trust"
  | "guide_cancel_not_tourist"
  | "guide_accept_window_expired"
  | "guide_accept_schedule_conflict"
  | "guide_accept_invalid_state"
  | "tourist_confirm_completion_trust"
  | "guide_bilateral_trust"
  | "tourist_chat_post_trust"
  | "tourist_chat_post_rate_limit"
  | "tourist_review_post_trust"
  | "tourist_dispute_offchain_trust";

function usesGuideMe(s: TrustEscrowScenario): boolean {
  return (
    s === "guide_accept_trust" ||
    s === "guide_cancel_not_tourist" ||
    s === "guide_accept_window_expired" ||
    s === "guide_accept_schedule_conflict" ||
    s === "guide_accept_invalid_state" ||
    s === "guide_bilateral_trust"
  );
}

function usesTouristMe(s: TrustEscrowScenario): boolean {
  return !usesGuideMe(s);
}

function installEscrowTrustMocks(page: Page, scenario: TrustEscrowScenario) {
  return page.route((url) => {
    try {
      const u = new URL(url);
      return u.pathname === "/meta" || u.pathname.startsWith("/api/v1/");
    } catch {
      return false;
    }
  }, async (route) => {
    const req = route.request();
    const method = req.method();
    const path = new URL(req.url()).pathname;

    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });

    if (path === "/meta" && method === "GET") {
      return json({ status: "ok", note: "e2e-mock" });
    }

    if (path === "/api/v1/me" && method === "GET") {
      if (usesTouristMe(scenario)) {
        return json({
          status: "ok",
          user: { id: TOURIST_ID, email: "e2e@traveltrust.test", role: "tourist" },
          guide: null,
          trust: {},
          stats: {},
        });
      }
      return json({
        status: "ok",
        user: { id: GUIDE_USER_ID, email: "guide@traveltrust.test", role: "guide" },
        guide: { id: GUIDE_ROW_ID, wallet_address: VALID_WALLET },
        trust: {},
        stats: {},
      });
    }

    if (path === `/api/v1/orders/${ORDER_ID}` && method === "GET") {
      if (scenario === "tourist_review_post_trust") {
        return json({
          status: "ok",
          order: {
            id: ORDER_ID,
            state: "completed",
            status: "completed",
            amount: "100",
            currency: "USD",
            tourist_id: TOURIST_ID,
            guide_id: GUIDE_ROW_ID,
            escrow_address: null,
            created_at: "2026-01-01T00:00:00.000Z",
          },
          itinerary: null,
        });
      }
      if (scenario === "tourist_chat_post_trust" || scenario === "tourist_chat_post_rate_limit") {
        return json({
          status: "ok",
          order: {
            id: ORDER_ID,
            state: "draft",
            status: "draft",
            amount: "100",
            currency: "USD",
            tourist_id: TOURIST_ID,
            guide_id: GUIDE_ROW_ID,
            escrow_address: null,
            created_at: "2026-01-01T00:00:00.000Z",
          },
          itinerary: {
            version: 1,
            daily_itinerary: [],
            snapshot_hash: null,
          },
        });
      }
      const acceptedOrder =
        scenario === "tourist_confirm_completion_trust" ||
        scenario === "guide_bilateral_trust" ||
        scenario === "tourist_dispute_offchain_trust";
      return json({
        status: "ok",
        order: {
          id: ORDER_ID,
          state: acceptedOrder ? "accepted" : "created",
          status: acceptedOrder ? "accepted" : "created",
          amount: "100",
          currency: "USD",
          tourist_id: TOURIST_ID,
          guide_id: GUIDE_ROW_ID,
          escrow_address: null,
          created_at: "2026-01-01T00:00:00.000Z",
          ...(acceptedOrder
            ? {
                sub_status: "pending_bilateral",
                tourist_confirmed: false,
                guide_confirmed: false,
              }
            : {}),
        },
        itinerary: null,
      });
    }

    if (path === `/api/v1/orders/${ORDER_ID}/messages` && method === "GET") {
      return json({ status: "ok", items: [] });
    }

    if (path === `/api/v1/orders/${ORDER_ID}/messages` && method === "POST") {
      if (scenario === "tourist_chat_post_rate_limit") {
        return json({ error: "rate_limit_exceeded", message: "rate_limit_exceeded" }, 429);
      }
      if (scenario === "tourist_chat_post_trust") {
        return json(
          { error: "trust_verification_pending", message: "trust_verification_pending" },
          403
        );
      }
      return json({ status: "ok", id: "e2e-msg-1" });
    }

    if (path === `/api/v1/orders/${ORDER_ID}/reviews` && method === "GET") {
      return json({
        status: "ok",
        items: [],
        meta: { review_weight_rule_version: "review_weight_v1" },
      });
    }

    if (path === `/api/v1/orders/${ORDER_ID}/reviews` && method === "POST") {
      if (scenario === "tourist_review_post_trust") {
        return json(
          { error: "trust_verification_pending", message: "trust_verification_pending" },
          403
        );
      }
      return json({ status: "ok", review: {} });
    }

    if (path === `/api/v1/orders/${ORDER_ID}/evidence` && method === "GET") {
      return json({ status: "ok", items: [] });
    }

    if (path === `/api/v1/orders/${ORDER_ID}/cancel` && method === "POST") {
      if (scenario === "guide_cancel_not_tourist") {
        return json({ error: "not_tourist", message: "not_tourist" }, 403);
      }
      if (scenario === "tourist_cancel_trust") {
        return json(
          { error: "trust_verification_pending", message: "trust_verification_pending" },
          403
        );
      }
      if (scenario === "tourist_cancel_identity_restricted") {
        return json(
          { error: "trust_identity_restricted", message: "trust_identity_restricted" },
          403
        );
      }
      if (scenario === "tourist_cancel_risk_too_high") {
        return json({ error: "trust_risk_too_high", message: "trust_risk_too_high" }, 403);
      }
      return json({ error: "forbidden", message: "forbidden" }, 403);
    }

    if (path === `/api/v1/orders/${ORDER_ID}/accept` && method === "POST") {
      if (scenario === "guide_accept_trust") {
        return json(
          { error: "trust_guide_pending_review", message: "trust_guide_pending_review" },
          403
        );
      }
      if (scenario === "guide_accept_window_expired") {
        return json(
          { error: "accept_window_expired", message: "accept_window_expired" },
          410
        );
      }
      if (scenario === "guide_accept_schedule_conflict") {
        return json({ error: "schedule_conflict", message: "schedule_conflict" }, 409);
      }
      if (scenario === "guide_accept_invalid_state") {
        return json(
          {
            error: "invalid_state",
            message: "invalid_state",
            current: "created",
          },
          409
        );
      }
      if (scenario === "tourist_accept_not_guide") {
        return json({ error: "not_guide", message: "not_guide" }, 403);
      }
      return json({ status: "ok", order: { id: ORDER_ID, state: "accepted" } });
    }

    if (path === `/api/v1/orders/${ORDER_ID}/confirm-completion` && method === "POST") {
      if (scenario === "tourist_confirm_completion_trust") {
        return json(
          { error: "trust_verification_pending", message: "trust_verification_pending" },
          403
        );
      }
      return json({
        status: "ok",
        order: { id: ORDER_ID, state: "completed", status: "completed" },
      });
    }

    if (path === `/api/v1/orders/${ORDER_ID}/confirm-bilateral` && method === "POST") {
      if (scenario === "guide_bilateral_trust") {
        return json(
          { error: "trust_guide_pending_review", message: "trust_guide_pending_review" },
          403
        );
      }
      return json({ status: "ok", order: { id: ORDER_ID } });
    }

    if (path === `/api/v1/orders/${ORDER_ID}/dispute` && method === "POST") {
      if (scenario === "tourist_dispute_offchain_trust") {
        return json(
          { error: "trust_verification_pending", message: "trust_verification_pending" },
          403
        );
      }
      return json({ status: "ok", dispute: { id: "e2e-dispute-1" } });
    }

    if (path === `/api/v1/guides/${GUIDE_ROW_ID}` && method === "GET") {
      return json({
        status: "ok",
        guide: { id: GUIDE_ROW_ID, wallet_address: VALID_WALLET },
      });
    }

    // 其余请求：避免未 mock 时打到真实 8080 导致挂起
    if (method === "GET") {
      return json({ status: "ok", items: [] });
    }
    return json({ status: "ok" });
  });
}

test.describe("Escrow 订单页订单写错误文案（mock API）", () => {
  test("取消订单 403 trust_verification_pending 映射为可读的信任提示", async ({ page }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, TOURIST_ID);

    await installEscrowTrustMocks(page, "tourist_cancel_trust");

    await page.goto(`/escrow/${ORDER_ID}`);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 60_000,
    });

    const actionsHeading = page.getByRole("heading", { name: /订单操作|Order actions/i });
    await expect(actionsHeading).toBeVisible();
    await actionsHeading.locator("..").getByRole("button", { name: /取消订单|Cancel order/i }).click();

    await expect(
      page.getByRole("alert").filter({
        hasText: /身份核验仍在处理中|identity verification is still in progress/i,
      }),
    ).toBeVisible();
  });

  test("取消订单 403 trust_identity_restricted 映射为受限核验提示", async ({ page }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, TOURIST_ID);

    await installEscrowTrustMocks(page, "tourist_cancel_identity_restricted");

    await page.goto(`/escrow/${ORDER_ID}`);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 60_000,
    });

    const actionsHeading = page.getByRole("heading", { name: /订单操作|Order actions/i });
    await expect(actionsHeading).toBeVisible();
    await actionsHeading.locator("..").getByRole("button", { name: /取消订单|Cancel order/i }).click();

    await expect(
      page.getByRole("alert").filter({
        hasText:
          /账户核验状态受限|restricted verification status|Contact support if this is unexpected/i,
      }),
    ).toBeVisible();
  });

  test("取消订单 403 trust_risk_too_high 映射为争议风险提示", async ({ page }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, TOURIST_ID);

    await installEscrowTrustMocks(page, "tourist_cancel_risk_too_high");

    await page.goto(`/escrow/${ORDER_ID}`);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 60_000,
    });

    const actionsHeading = page.getByRole("heading", { name: /订单操作|Order actions/i });
    await expect(actionsHeading).toBeVisible();
    await actionsHeading.locator("..").getByRole("button", { name: /取消订单|Cancel order/i }).click();

    await expect(
      page.getByRole("alert").filter({
        hasText:
          /未决争议过多|Too many open disputes|Resolve open cases or contact support/i,
      }),
    ).toBeVisible();
  });

  test("取消订单 403 forbidden 映射为通用无权提示（order_error_forbidden）", async ({ page }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, TOURIST_ID);

    await installEscrowTrustMocks(page, "tourist_cancel_forbidden");

    await page.goto(`/escrow/${ORDER_ID}`);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 60_000,
    });

    const actionsHeading = page.getByRole("heading", { name: /订单操作|Order actions/i });
    await expect(actionsHeading).toBeVisible();
    await actionsHeading.locator("..").getByRole("button", { name: /取消订单|Cancel order/i }).click();

    await expect(
      page.getByRole("alert").filter({
        hasText: /您无权执行此操作|don't have permission for this action/i,
      }),
    ).toBeVisible();
  });

  test("游客点接单 403 not_guide 映射为角色提示（order_error_not_guide）", async ({ page }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, TOURIST_ID);

    await installEscrowTrustMocks(page, "tourist_accept_not_guide");

    await page.goto(`/escrow/${ORDER_ID}`);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 60_000,
    });

    const actionsHeading = page.getByRole("heading", { name: /订单操作|Order actions/i });
    await expect(actionsHeading).toBeVisible();
    await actionsHeading.locator("..").getByRole("button", { name: /接单|Accept order/i }).click();

    await expect(
      page.getByRole("alert").filter({
        hasText: /该操作仅限向导|only available to guides/i,
      }),
    ).toBeVisible();
  });

  test("接单 403 trust_guide_pending_review 映射为可读的向导审核提示", async ({ page }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, GUIDE_USER_ID);

    await installEscrowTrustMocks(page, "guide_accept_trust");

    await page.goto(`/escrow/${ORDER_ID}`);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 60_000,
    });

    const actionsHeading = page.getByRole("heading", { name: /订单操作|Order actions/i });
    await expect(actionsHeading).toBeVisible();
    await actionsHeading.locator("..").getByRole("button", { name: /接单|Accept order/i }).click();

    await expect(
      page.getByRole("alert").filter({
        hasText: /向导资料仍在审核|guide profile is still under review/i,
      }),
    ).toBeVisible();
  });

  test("向导点取消订单 403 not_tourist 映射为角色提示（order_error_not_tourist）", async ({
    page,
  }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, GUIDE_USER_ID);

    await installEscrowTrustMocks(page, "guide_cancel_not_tourist");

    await page.goto(`/escrow/${ORDER_ID}`);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 60_000,
    });

    const actionsHeading = page.getByRole("heading", { name: /订单操作|Order actions/i });
    await expect(actionsHeading).toBeVisible();
    await actionsHeading.locator("..").getByRole("button", { name: /取消订单|Cancel order/i }).click();

    await expect(
      page.getByRole("alert").filter({
        hasText: /该操作仅限游客|only available to travelers/i,
      }),
    ).toBeVisible();
  });

  test("接单 410 accept_window_expired 映射为接单时限提示（与后端 GONE 一致）", async ({
    page,
  }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, GUIDE_USER_ID);

    await installEscrowTrustMocks(page, "guide_accept_window_expired");

    await page.goto(`/escrow/${ORDER_ID}`);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 60_000,
    });

    const actionsHeading = page.getByRole("heading", { name: /订单操作|Order actions/i });
    await expect(actionsHeading).toBeVisible();
    await actionsHeading.locator("..").getByRole("button", { name: /接单|Accept order/i }).click();

    await expect(
      page.getByRole("alert").filter({
        hasText: /接单时限已过|acceptance window has expired|Refresh to see the latest status/i,
      }),
    ).toBeVisible();
  });

  test("接单 409 schedule_conflict 映射为档期冲突提示", async ({ page }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, GUIDE_USER_ID);

    await installEscrowTrustMocks(page, "guide_accept_schedule_conflict");

    await page.goto(`/escrow/${ORDER_ID}`);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 60_000,
    });

    const actionsHeading = page.getByRole("heading", { name: /订单操作|Order actions/i });
    await expect(actionsHeading).toBeVisible();
    await actionsHeading.locator("..").getByRole("button", { name: /接单|Accept order/i }).click();

    await expect(
      page.getByRole("alert").filter({
        hasText: /档期冲突|Schedule conflict|another order may be using this slot/i,
      }),
    ).toBeVisible();
  });

  test("接单 409 invalid_state 映射为状态冲突提示（order_error_state_conflict）", async ({
    page,
  }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, GUIDE_USER_ID);

    await installEscrowTrustMocks(page, "guide_accept_invalid_state");

    await page.goto(`/escrow/${ORDER_ID}`);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 60_000,
    });

    const actionsHeading = page.getByRole("heading", { name: /订单操作|Order actions/i });
    await expect(actionsHeading).toBeVisible();
    await actionsHeading.locator("..").getByRole("button", { name: /接单|Accept order/i }).click();

    await expect(
      page.getByRole("alert").filter({
        hasText:
          /订单状态已变更|The order is no longer in that state|Refresh to see the latest status/i,
      }),
    ).toBeVisible();
  });

  test("Accepted 态：确认完成（链下）403 trust_verification_pending 映射为信任提示", async ({
    page,
  }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, TOURIST_ID);

    await installEscrowTrustMocks(page, "tourist_confirm_completion_trust");

    await page.goto(`/escrow/${ORDER_ID}`);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 60_000,
    });

    const actionsHeading = page.getByRole("heading", { name: /订单操作|Order actions/i });
    await expect(actionsHeading).toBeVisible();
    await actionsHeading
      .locator("..")
      .getByRole("button", { name: /确认完成（链下）|Confirm completion \(off-chain\)/i })
      .click();

    await expect(
      page.getByRole("alert").filter({
        hasText: /身份核验仍在处理中|identity verification is still in progress/i,
      }),
    ).toBeVisible();
  });

  test("Accepted 态：双边确认 POST confirm-bilateral 403 trust_guide_pending_review 映射为向导审核提示", async ({
    page,
  }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, GUIDE_USER_ID);

    await installEscrowTrustMocks(page, "guide_bilateral_trust");

    await page.goto(`/escrow/${ORDER_ID}`);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 60_000,
    });

    await page
      .getByRole("button", { name: /确认行程与金额|Confirm itinerary and amount/i })
      .click();

    await expect(
      page.getByRole("alert").filter({
        hasText: /向导资料仍在审核|guide profile is still under review/i,
      }),
    ).toBeVisible();
  });

  test("草稿态 ChatBlock：POST messages 403 trust_verification_pending 映射为信任提示（53-S7）", async ({
    page,
  }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, TOURIST_ID);

    await installEscrowTrustMocks(page, "tourist_chat_post_trust");

    await page.goto(`/escrow/${ORDER_ID}`);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 60_000,
    });

    await page.getByPlaceholder(/输入消息|Type a message/i).fill("e2e-chat-trust");
    await page.getByRole("button", { name: /发送|Send/i }).click();

    await expect(
      page.getByRole("alert").filter({
        hasText: /身份核验仍在处理中|identity verification is still in progress/i,
      }),
    ).toBeVisible();
  });

  test("Completed 态 ReviewBlock：POST reviews 403 trust_verification_pending 映射为信任提示", async ({
    page,
  }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, TOURIST_ID);

    await installEscrowTrustMocks(page, "tourist_review_post_trust");

    await page.goto(`/escrow/${ORDER_ID}`);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 60_000,
    });

    await expect(page.getByRole("heading", { name: /评价|Reviews/i })).toBeVisible();

    await page.getByRole("button", { name: /提交评价|Submit review/i }).click();

    await expect(
      page.getByRole("alert").filter({
        hasText: /身份核验仍在处理中|identity verification is still in progress/i,
      }),
    ).toBeVisible();
  });

  test("Accepted 无托管：发起争议（链下）403 trust_verification_pending 映射为信任提示", async ({
    page,
  }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, TOURIST_ID);

    await installEscrowTrustMocks(page, "tourist_dispute_offchain_trust");

    await page.goto(`/escrow/${ORDER_ID}`);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 60_000,
    });

    const actionsHeading = page.getByRole("heading", { name: /订单操作|Order actions/i });
    await expect(actionsHeading).toBeVisible();
    await actionsHeading
      .locator("..")
      .getByRole("button", { name: /发起争议（链下）|Open dispute \(off-chain\)/i })
      .click();

    await expect(
      page.getByRole("alert").filter({
        hasText: /身份核验仍在处理中|identity verification is still in progress/i,
      }),
    ).toBeVisible();
  });

  test("草稿态 ChatBlock：POST messages 429 rate_limit_exceeded 映射为限流提示（100）", async ({
    page,
  }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, TOURIST_ID);

    await installEscrowTrustMocks(page, "tourist_chat_post_rate_limit");

    await page.goto(`/escrow/${ORDER_ID}`);

    await expect(page.getByRole("main", { name: /订单详情|Order details/i })).toBeVisible({
      timeout: 60_000,
    });

    await page.getByPlaceholder(/输入消息|Type a message/i).fill("e2e-rate-limit");
    await page.getByRole("button", { name: /发送|Send/i }).click();

    await expect(
      page.getByRole("alert").filter({
        hasText: /请求过于频繁|Too many requests|Please wait and try again/i,
      }),
    ).toBeVisible();
  });
});
