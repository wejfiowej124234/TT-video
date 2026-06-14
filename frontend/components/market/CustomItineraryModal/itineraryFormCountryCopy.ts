/** 按产品国家返回人数计费说明 i18n key */
export function headcountPricingNoteKey(country: string): string {
  switch (country.trim()) {
    case "日本":
      return "market_headcountPricingNote_jp";
    case "韩国":
      return "market_headcountPricingNote_kr";
    case "阿联酋":
      return "market_headcountPricingNote_ae";
    case "美国":
    case "澳大利亚":
      return "market_headcountPricingNote_us";
    case "泰国":
      return "market_headcountPricingNote_th";
    default:
      return "market_headcountPricingNote";
  }
}

/** 跨城交通费用说明 i18n key */
export function interCityTransportFeeHintKey(country: string): string {
  switch (country.trim()) {
    case "阿联酋":
      return "market_interCityTransportFeeHint_ae";
    case "美国":
    case "澳大利亚":
      return "market_interCityTransportFeeHint_us";
    default:
      return "market_interCityTransportFeeHint";
  }
}
