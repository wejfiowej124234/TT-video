import type { FormEvent, MutableRefObject } from "react";
import {
  orderAccept,
  orderCancel,
  orderConfirmCompletion,
  postOrderDispute,
  getIdempotencyKey,
} from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";

export type OrderActionsBlockOffchainHandlersInput = {
  orderId: string;
  protocolPaused: boolean;
  t: (key: string) => string;
  onSuccess: () => void;
  setLoading: (v: string | null) => void;
  setErr: (v: string | null) => void;
  setErrAction: (v: string | null) => void;
  setIntentOk: (v: string | null) => void;
  acceptIdempotencyKeyRef: MutableRefObject<string | null>;
  cancelIdempotencyKeyRef: MutableRefObject<string | null>;
  confirmCompletionIdempotencyKeyRef: MutableRefObject<string | null>;
};

export function buildOrderActionsBlockOffchainHandlers(input: OrderActionsBlockOffchainHandlersInput) {
  const {
    orderId,
    protocolPaused,
    t,
    onSuccess,
    setLoading,
    setErr,
    setErrAction,
    setIntentOk,
    acceptIdempotencyKeyRef,
    cancelIdempotencyKeyRef,
    confirmCompletionIdempotencyKeyRef,
  } = input;

  const run = (label: string, fn: () => Promise<unknown>, fallbackKey: string) => {
    if (protocolPaused) return;
    setLoading(label);
    setErr(null);
    setErrAction(null);
    setIntentOk(null);
    fn()
      .then(() => {
        setErrAction(null);
        onSuccess();
      })
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("OrderActionsBlock run:", e);
        }
        if (label === "accept") {
          acceptIdempotencyKeyRef.current = null;
        }
        setErrAction(label);
        setErr(mapApiReadError(e, t, fallbackKey));
      })
      .finally(() => setLoading(null));
  };

  const onAcceptSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const key =
      acceptIdempotencyKeyRef.current ?? (acceptIdempotencyKeyRef.current = getIdempotencyKey());
    run("accept", () => orderAccept(orderId, key), "order_error_accept_failed");
  };

  const onCancelSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const key =
      cancelIdempotencyKeyRef.current ?? (cancelIdempotencyKeyRef.current = getIdempotencyKey());
    run("cancel", () => orderCancel(orderId, key), "order_error_cancel_failed");
  };

  const onConfirmOffchainSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const key =
      confirmCompletionIdempotencyKeyRef.current ??
      (confirmCompletionIdempotencyKeyRef.current = getIdempotencyKey());
    run(
      "confirmCompletion",
      () => orderConfirmCompletion(orderId, key),
      "order_error_confirm_completion_failed",
    );
  };

  const onOpenDisputeOffchain = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (protocolPaused) return;
    setLoading("openDispute");
    setErr(null);
    setErrAction(null);
    postOrderDispute(orderId, undefined, getIdempotencyKey())
      .then(() => onSuccess())
      .catch((submitErr) => {
        if (typeof window !== "undefined") {
          console.error("OrderActionsBlock openDispute:", submitErr);
        }
        setErrAction(null);
        setErr(mapApiReadError(submitErr, t, "order_error_dispute_failed"));
      })
      .finally(() => setLoading(null));
  };

  const onRetryAccept = () => {
    const key =
      acceptIdempotencyKeyRef.current ?? (acceptIdempotencyKeyRef.current = getIdempotencyKey());
    run("accept", () => orderAccept(orderId, key), "order_error_accept_failed");
  };

  return {
    run,
    onAcceptSubmit,
    onCancelSubmit,
    onConfirmOffchainSubmit,
    onOpenDisputeOffchain,
    onRetryAccept,
  };
}
