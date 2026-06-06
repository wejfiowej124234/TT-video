export interface LandingHeroFormProps {
  country: string;
  setCountry: (v: string) => void;
  cities: string[];
  setCities: (v: string[] | ((prev: string[]) => string[])) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  days: number;
  attractionTypes: string[];
  setAttractionTypes: (v: string[] | ((prev: string[]) => string[])) => void;
  diningStandards: string[];
  setDiningStandards: (v: string[] | ((prev: string[]) => string[])) => void;
  hotelStandards: string[];
  setHotelStandards: (v: string[] | ((prev: string[]) => string[])) => void;
  budget: string;
  setBudget: (v: string) => void;
  partySize: number;
  setPartySize: (v: number) => void;
  numRooms: number;
  setNumRooms: (v: number) => void;
  submitting: boolean;
  /** 客户端校验 i18n key（`landing_error_*`） */
  validationErrorKey: string | null;
  /** API 错误：已由 hook 内 `mapApiReadError` / `t` 翻译 */
  submitError: string | null;
  handleSubmit: (e: React.FormEvent) => void;
}
