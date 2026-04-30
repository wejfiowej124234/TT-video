-- 96-18 / 96-08 占位：Admin **已付** 资格 **财务冲销**（退款 / 拒付登记）→ **`refunded`**；**不**替代 PSP 真退款 API。
ALTER TABLE onboarding_entitlements DROP CONSTRAINT IF EXISTS onboarding_entitlements_status_check;
ALTER TABLE onboarding_entitlements ADD CONSTRAINT onboarding_entitlements_status_check
    CHECK (status IN ('pending', 'paid', 'revoked', 'expired', 'refunded'));
