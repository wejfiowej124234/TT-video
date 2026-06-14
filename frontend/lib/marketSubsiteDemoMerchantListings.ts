import type { DemoMerchantListing } from "@/lib/marketSubsiteDemoTypes";
import { marketSubsiteDemoImageUrl } from "@/lib/marketSubsiteDemoImageUrl";

const img = marketSubsiteDemoImageUrl;

export const DEMO_MERCHANT_LISTINGS: DemoMerchantListing[] = [
  {
    id: "m-seaside-suite",
    countryIso: "CN",
    categorySlug: "hotel",
    sortKey: 10,
    title: {
      zh: "海景套房 · 四天三晚慢旅行",
      en: "Seaside suite · slow travel 4D3N",
    },
    subtitle: {
      zh: "含早餐与机场接送，链上托管结算",
      en: "Breakfast + airport transfer; settle in on-chain escrow",
    },
    city: { zh: "三亚", en: "Sanya" },
    category: { zh: "酒店", en: "Hotel" },
    shopName: { zh: "南湾旅居 DID", en: "South Bay Stay DID" },
    imageSrc: img("photo-1582719478250-c89cae4dc85b"),
    priceUsdc: 1280,
    story: [
      {
        zh: "面向家庭与情侣的临海套房，步行可达沙滩。行程节奏由本地管家协助编排，所有加价项在订单协议中列明。",
        en: "Ocean-facing suites for couples and families, minutes to the beach. Pace is curated with a local host; add-ons are spelled out in the order agreement.",
      },
      {
        zh: "支付使用 USDC 进入托管合约；服务完成并按里程碑确认后释放。",
        en: "Pay with USDC into escrow; funds release after milestone confirmations.",
      },
    ],
    highlights: [
      { zh: "含双早", en: "Breakfast for two" },
      { zh: "机场接送各一次", en: "One round-trip airport transfer" },
      { zh: "可改期（按协议）", en: "Reschedule per agreement" },
    ],
  },
  {
    id: "m-rooftop-dinner",
    countryIso: "JP",
    categorySlug: "dining",
    sortKey: 60,
    title: { zh: "城市天际线 · 双人晚宴席位", en: "Skyline chef's table for two" },
    subtitle: { zh: "米其林合作菜单预览", en: "Tasting menu preview with MICHELIN partner" },
    city: { zh: "东京", en: "Tokyo" },
    category: { zh: "餐饮", en: "Dining" },
    shopName: { zh: "云端餐桌 Lab", en: "Cloud Table Lab" },
    imageSrc: img("photo-1414235077428-338989a2e8c0"),
    priceUsdc: 520,
    story: [
      {
        zh: "限定时段与席位，预订后生成订单与双边协议；尾款与定金规则写入托管参数。",
        en: "Limited seats and time windows. Booking creates an order and bilateral agreement; deposit and balance rules map to escrow params.",
      },
    ],
    highlights: [
      { zh: "侍酒师配对", en: "Sommelier pairing" },
      { zh: "素食可预约", en: "Vegetarian on request" },
    ],
  },
  {
    id: "m-heritage-tour",
    countryIso: "CN",
    categorySlug: "attraction",
    sortKey: 20,
    title: { zh: "古城小团讲解 · 半日", en: "Heritage walking tour · half day" },
    subtitle: { zh: "6 人内小团，含耳麦", en: "Small group (≤6), headsets included" },
    city: { zh: "西安", en: "Xi'an" },
    category: { zh: "景区", en: "Attraction" },
    shopName: { zh: "城墙故事社", en: "Rampart Stories Co." },
    imageSrc: img("photo-1508804185872-d7badad00f7d"),
    priceUsdc: 88,
    story: [
      {
        zh: "向导持证接待，结束后在订单内确认履约再触发托管释放。",
        en: "Licensed guide hosting; confirm fulfillment in the order before escrow release.",
      },
    ],
    highlights: [{ zh: "含门票代订", en: "Ticket assist" }, { zh: "雨天改室内展", en: "Rain plan to indoor exhibits" }],
  },
  {
    id: "m-spa-retreat",
    countryIso: "TH",
    categorySlug: "hotel",
    sortKey: 40,
    title: { zh: "山谷温泉疗愈周末", en: "Mountain onsen wellness weekend" },
    subtitle: { zh: "两晚住宿 + 两次 SPA", en: "2 nights + two SPA sessions" },
    city: { zh: "曼谷", en: "Bangkok" },
    category: { zh: "酒店", en: "Hotel" },
    shopName: { zh: "雾泉别院", en: "Mist Springs Retreat" },
    imageSrc: img("photo-1540555700478-4be289fbecef"),
    priceUsdc: 2100,
    story: [
      {
        zh: "疗愈行程含私密泡池时段，具体时段表在确认订单后发送。",
        en: "Private onsen slots included; schedule sent after the order is confirmed.",
      },
    ],
    highlights: [{ zh: "欢迎礼遇", en: "Welcome amenity" }, { zh: "延迟退房视房态", en: "Late checkout subject to availability" }],
  },
  {
    id: "m-kayak-sunrise",
    countryIso: "AU",
    categorySlug: "experience",
    sortKey: 50,
    title: { zh: "日出皮划艇体验", en: "Sunrise kayak experience" },
    subtitle: { zh: "含教练与安全装备", en: "Coach + safety gear included" },
    city: { zh: "黄金海岸", en: "Gold Coast" },
    category: { zh: "体验", en: "Experience" },
    shopName: { zh: "浪人水上运动", en: "Wave Nomad Sports" },
    imageSrc: img("photo-1530870110042-98b2cb110834"),
    priceUsdc: 168,
    story: [
      {
        zh: "受海况影响可能改期，改期规则写入订单协议。",
        en: "Weather-dependent; reschedule rules are in the order agreement.",
      },
    ],
    highlights: [{ zh: "小团上限 8 人", en: "Max 8 guests" }],
  },
  {
    id: "m-farm-table",
    countryIso: "FR",
    categorySlug: "dining",
    sortKey: 30,
    title: { zh: "农场餐桌 · 季食限定", en: "Farm table · seasonal menu" },
    subtitle: { zh: "从采摘到上桌半日体验", en: "Pick-to-table half-day" },
    city: { zh: "巴黎", en: "Paris" },
    category: { zh: "餐饮", en: "Dining" },
    shopName: { zh: "田埂餐桌计划", en: "Ridge Table Project" },
    imageSrc: img("photo-1504674900247-0877df9cc836"),
    priceUsdc: 398,
    story: [
      {
        zh: "食材随节气更换，过敏源请在下单备注并在协议中确认。",
        en: "Menu rotates with seasons; declare allergens in notes and confirm in the agreement.",
      },
    ],
    highlights: [{ zh: "含采摘篮", en: "Picking basket included" }],
  },
];
