"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { isComplianceError } from "@/lib/apiClient";

/** 展示 API 错误；403/OFAC 时用风控样式；Failed to fetch 时提示启动后端；i18n */
export default function ApiErrorAlert({
  message,
  /** 深色页身（社区壳等）：主文与 Hint 用浅字，避免 `text-ink-*` 继承 body 深字 */
  tone = "default",
}: {
  message: string | null;
  tone?: "default" | "dark";
}) {
  const { t } = useTranslation();
  if (!message) return null;
  const isCompliance = isComplianceError(new Error(message));
  /** 与各页收口后的通用失败文案对齐，便于提示检查后端（13-1） */
  const isKnownLoadOrRequestFailure =
    message === t("escrow_loadFailed") ||
    message === t("pay_orderLoadFailed") ||
    message === t("pay_orderSliceMissing") ||
    message === t("orders_requestFailed") ||
    message === t("order_error_cancel_failed") ||
    message === t("orders_createFailed") ||
    message === t("orders_createResponseMissingOrderId") ||
    message === t("guides_requestFailed") ||
    message === t("guides_responseInvalid") ||
    message === t("disputes_requestFailed") ||
    message === t("dispute_fund_split_loadFailed") ||
    message === t("dispute_loadFailed") ||
    message === t("dispute_meRoleLoadFailed") ||
    message === t("guideDetail_loadFailed") ||
    message === t("guideRegister_errorSubmit") ||
    message === t("guideRegister_guideDbUnavailable") ||
    message === t("guideRegister_pendingIdPhotoUploadFailed") ||
    message === t("guideRegister_pendingLangCertUploadFailed") ||
    message === t("guideRegister_pendingPassportDataIncomplete") ||
    message === t("didRank_loadError") ||
    message === t("me_requestFailed") ||
    message === t("governance_requestFailed") ||
    message === t("itin_error_requestFailed") ||
    message === t("itin_fromOrder_loadFailed") ||
    message === t("meta_fetchFailed") ||
    message === t("community_activity_likes_load_failed") ||
    message === t("community_error_feed") ||
    message === t("community_messages_listLoadFailed") ||
    message === t("community_messages_threadLoadFailed") ||
    message === t("community_messages_sendFailed") ||
    message === t("community_orderContext_loadError") ||
    message === t("community_friends_loadFailed") ||
    message === t("community_friends_unfollowFailed") ||
    message === t("community_friends_addRequestFailed") ||
    message === t("community_friends_resolveRequestFailed") ||
    message === t("community_user_posts_loadFailed") ||
    message === t("community_user_conversations_loadFailed") ||
    message === t("community_user_followingList_loadFailed") ||
    message === t("community_me_posts_loadFailed") ||
    message === t("community_me_collects_loadFailed") ||
    message === t("community_feedback_list_not_synced") ||
    message === t("community_feedback_list_load_failed") ||
    message === t("community_comments_loadFailed") ||
    message === t("community_postDeepLink_loadFailed") ||
    message === t("orders_guides_loadFailed") ||
    message === t("governance_params_load_error") ||
    message === t("governance_proposals_loadFailed") ||
    message === t("community_report_list_load_failed") ||
    message === t("community_report_ticket_load_failed") ||
    message === t("community_report_appeal_failed") ||
    message === t("community_report_failed") ||
    message === t("market_apiError_orders") ||
    message === t("market_apiError_guides") ||
    message === t("market_apiError_both") ||
    message === t("guideDetail_stakeFailed") ||
    message === t("escrow_factoryCreateTxFailed") ||
    message === t("escrow_factoryCreateParseFailed") ||
    message === t("escrow_factoryCreateSyncFailed") ||
    message === t("escrow_writeFailed") ||
    message === t("escrow_chatSendFailed") ||
    message === t("escrow_chatLoadFailed") ||
    message === t("escrow_chatDbUnavailable") ||
    message === t("order_error_accept_failed") ||
    message === t("order_error_accept_window_expired");
  const isNetworkError =
    message === "Failed to fetch" ||
    message.includes("Failed to fetch") ||
    message.includes("NetworkError") ||
    isKnownLoadOrRequestFailure;
  const isDev = process.env.NODE_ENV === "development";
  return (
    <div
      className={
        isCompliance
          ? tone === "dark"
            ? "rounded-[var(--radius-sm)] border border-red-400/45 bg-red-950/40 p-4"
            : "rounded-[var(--radius-sm)] border border-danger/50 bg-danger/10 p-4"
          : tone === "dark"
            ? "rounded-[var(--radius-sm)] border border-red-400/35 bg-red-950/30 p-4"
            : "rounded-[var(--radius-sm)] border border-danger/30 bg-danger/10 p-4"
      }
      role="alert"
    >
      {isCompliance && (
        <p
          className={
            tone === "dark"
              ? "text-small font-semibold text-red-300 mb-1"
              : "text-small font-semibold text-danger mb-1"
          }
        >
          {t("api_error_complianceTitle")}
        </p>
      )}
      <p className={tone === "dark" ? "text-small text-red-300" : "text-small text-danger"}>{message}</p>
      {isCompliance && (
        <p className={tone === "dark" ? "text-meta text-slate-200 mt-2" : "text-meta text-ink-600 mt-2"}>
          {t("api_error_contact")}
        </p>
      )}
      {isNetworkError && !isCompliance && (
        <p
          className={
            tone === "dark" ? "text-meta text-slate-200 mt-2" : "text-meta text-ink-700 mt-2"
          }
        >
          {isDev ? t("api_error_backendHint") : t("api_error_retryShort")}
        </p>
      )}
    </div>
  );
}
