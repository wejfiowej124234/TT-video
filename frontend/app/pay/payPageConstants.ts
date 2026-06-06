import { TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE } from "@/lib/marketingUi";

/** 与 `OrderFlowSteps` 内 STEP_LABEL_KEYS 顺序一致（1～8），供支付页文案与步骤条对齐 */
export const PAY_ORDER_FLOW_STEP_LABEL_KEYS = [
  "order_steps_step_draft",
  "order_steps_step_guide_confirm",
  "order_steps_step_bilateral",
  "order_steps_step_confirm",
  "order_steps_step_pay",
  "order_steps_step_done",
  "order_steps_step_rating",
  "order_steps_step_release",
] as const;

export const payOrderIdInputFocusClass = TT_MARKETING_FORM_FIELD_FOCUS_CONSOLE;
