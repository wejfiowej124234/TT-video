/**
 * Landing Hero 表单底部告警：校验结果为 i18n key，接口错误为已翻译文案。
 */
export function landingHeroFormAlertText(
  validationErrorKey: string | null,
  submitError: string | null,
  t: (key: string) => string
): string | null {
  if (submitError) return submitError;
  if (validationErrorKey) return t(validationErrorKey);
  return null;
}
