import type { Locale } from "@/lib/i18n";
import type { ProductCountryIso } from "@/lib/productCountries";

/** 子站演示数据（94）：列表页在无 PG 目录时作客户端回退；详情 SSR 回退见 `marketSubsiteDetailPageModel` + **`marketSubsiteDemoStudioFallbackEnabled`**（production 默认关）。 */
export type L10n = { zh: string; en: string };

export type MerchantCategorySlug = "hotel" | "dining" | "attraction" | "experience";
export type AcquisitionCategorySlug = "luxury" | "sneakers" | "electronics" | "health" | "accessories";

export function pickL10n(s: L10n, locale: Locale): string {
  return s[locale];
}

export type DemoMerchantListing = {
  id: string;
  /** 与 `PRODUCT_COUNTRIES` 一致，供列表国家筛选 */
  countryIso: ProductCountryIso;
  categorySlug: MerchantCategorySlug;
  /** 越新越大，用于 `sort=recent` */
  sortKey: number;
  title: L10n;
  subtitle: L10n;
  city: L10n;
  category: L10n;
  shopName: L10n;
  imageSrc: string;
  priceUsdc: number;
  /** 详情富文本段落 */
  story: L10n[];
  highlights: L10n[];
};

export type DemoAcquisitionListing = {
  id: string;
  /** 交割/需求方主标国（十国），供国家筛选 */
  destinationCountryIso: ProductCountryIso;
  categorySlug: AcquisitionCategorySlug;
  sortKey: number;
  title: L10n;
  summary: L10n;
  route: L10n;
  bountyMinUsdc: number;
  bountyMaxUsdc: number;
  deadlineNote: L10n;
  imageSrc: string;
  inspectionStandard: L10n;
  authenticity: L10n;
  condition: L10n;
  rejections: L10n;
  handoff: L10n;
  story: L10n[];
};

const unsplash = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

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
    imageSrc: unsplash("photo-1582719478250-c89cae4dc85b"),
    priceUsdc: 1280,
    story: [
      {
        zh: "面向家庭与情侣的临海套房，步行可达沙滩。行程节奏由本地管家协助编排，所有加价项在订单协议中列明。",
        en: "Ocean-facing suites for couples and families, minutes to the beach. Pace is curated with a local host; add-ons are spelled out in the order agreement.",
      },
      {
        zh: "支付使用 USDC/USDT 进入托管合约；服务完成并按里程碑确认后释放。",
        en: "Pay with USDC/USDT into escrow; funds release after milestone confirmations.",
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
    imageSrc: unsplash("photo-1414235077428-338989a2e8c0"),
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
    imageSrc: unsplash("photo-1508804185872-d7badad00f7d"),
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
    imageSrc: unsplash("photo-1540555700478-4be289fbecef"),
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
    imageSrc: unsplash("photo-1530870110042-98b2cb110834"),
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
    imageSrc: unsplash("photo-1504674900247-0877df9cc836"),
    priceUsdc: 398,
    story: [
      {
        zh: "食材随节气更换，过敏源请在下单备注并在协议中确认。",
        en: "Menu rotates with seasons; declare allergens in notes and confirm in the agreement.",
      },
    ],
    highlights: [{ zh: "含采摘篮", en: "Picking basket included" }],
  },
  {
    id: "m-beijing-teahouse",
    countryIso: "CN",
    categorySlug: "dining",
    sortKey: 25,
    title: { zh: "胡同茶室 · 午后雅集", en: "Hutong tea salon · afternoon tasting" },
    subtitle: { zh: "含茶点与包间，Escrow 结算", en: "Tea snacks + private room; escrow settlement" },
    city: { zh: "北京", en: "Beijing" },
    category: { zh: "餐饮", en: "Dining" },
    shopName: { zh: "京味茶叙 DID", en: "Capital Tea DID" },
    imageSrc: unsplash("photo-1545569341-9eb8b30979d9"),
    priceUsdc: 268,
    story: [
      {
        zh: "演示橱窗：双人雅集套餐，时段预约后写入订单协议；到店核销后确认里程碑。",
        en: "Demo showcase: duo tasting set; time slots written into the order agreement; confirm milestone after visit.",
      },
    ],
    highlights: [{ zh: "含茶点", en: "Tea snacks included" }, { zh: "可改期", en: "Reschedule per agreement" }],
  },
  {
    id: "m-hangzhou-silk",
    countryIso: "CN",
    categorySlug: "experience",
    sortKey: 35,
    title: { zh: "丝绸手作体验 · 半日", en: "Silk craft workshop · half day" },
    subtitle: { zh: "非遗老师带做小件", en: "Intangible heritage host" },
    city: { zh: "杭州", en: "Hangzhou" },
    category: { zh: "体验", en: "Experience" },
    shopName: { zh: "织梦工坊", en: "Loom Dream Studio" },
    imageSrc: unsplash("photo-1558618666-fcd25c85cd64"),
    priceUsdc: 188,
    story: [
      {
        zh: "演示商品：材料包与成品可邮寄；邮寄费用在协议中单列。",
        en: "Demo listing: materials kit optional ship-out; shipping fee listed in agreement.",
      },
    ],
    highlights: [{ zh: "含成品带走", en: "Take-home piece" }],
  },
];

export const DEMO_ACQUISITION_LISTINGS: DemoAcquisitionListing[] = [
  {
    id: "a-lux-bag",
    destinationCountryIso: "CN",
    categorySlug: "luxury",
    sortKey: 50,
    title: { zh: "求带：某奢牌手袋（专柜小票）", en: "Carry request: luxury handbag (boutique receipt)" },
    summary: { zh: "美国购入 → 带回上海，需中检可验", en: "US purchase → hand-carry to Shanghai; third-party inspection OK" },
    route: { zh: "洛杉矶 → 上海", en: "Los Angeles → Shanghai" },
    bountyMinUsdc: 2200,
    bountyMaxUsdc: 2800,
    deadlineNote: { zh: "希望 45 天内到手", en: "Delivery within ~45 days preferred" },
    imageSrc: unsplash("photo-1594223274512-ad4803739b7c"),
    inspectionStandard: {
      zh: "必须提供专柜原始小票照片与序列号清晰图；到货后支持中检或双方约定鉴定机构；与描述不符则拒收并走争议流程。",
      en: "Original boutique receipt photos + clear serial shots required; third-party authentication as agreed; disputes if not as described.",
    },
    authenticity: {
      zh: "不接受代购仓转寄；须本人或可信亲友店内购买视频片段（不露脸可）佐证。",
      en: "No drop-ship from unknown consolidators; short in-store purchase clip (face optional) as proof.",
    },
    condition: {
      zh: "全新全套：防尘袋、盒子、雪梨纸完整；五金贴膜未撕。",
      en: "Brand new full set: dust bag, box, tissue intact; hardware films untouched.",
    },
    rejections: {
      zh: "无票、剪标、陈列品、已过季两年以上款式。",
      en: "No receipt, cut tags, floor models, or styles discontinued >2 seasons ago.",
    },
    handoff: {
      zh: "上海浦东机场或静安区当面交割；可接受托管释放后再取货（按订单里程碑）。",
      en: "Handoff at PVG or Jing'an, Shanghai; escrow milestones may gate pickup timing.",
    },
    story: [
      {
        zh: "国内无货号，需指定颜色与尺寸。悬赏为 USDC 区间，实际以双边协议与托管金额为准。",
        en: "Exact color/size specified. Bounty is a USDC range; final amount follows bilateral agreement and escrow.",
      },
    ],
  },
  {
    id: "a-sneaker-drop",
    destinationCountryIso: "CN",
    categorySlug: "sneakers",
    sortKey: 40,
    title: { zh: "求带：限量球鞋 US11", en: "Carry request: limited sneakers US 11" },
    summary: { zh: "欧洲抽签款 → 北京", en: "EU raffle pair → Beijing" },
    route: { zh: "巴黎 → 北京", en: "Paris → Beijing" },
    bountyMinUsdc: 450,
    bountyMaxUsdc: 600,
    deadlineNote: { zh: "发售日起 20 天内", en: "Within ~20 days of drop" },
    imageSrc: unsplash("photo-1542291026-7eec264c27ff"),
    inspectionStandard: {
      zh: "鞋盒八角尖、鞋标与鞋垫印刷对齐官方图；支持得物/验货宝其一。",
      en: "Box corners crisp; label and insole match official refs; one agreed verify channel.",
    },
    authenticity: { zh: "需中签邮件或门店小票截图。", en: "Raffle win email or store receipt screenshot." },
    condition: { zh: "仅试穿不接受；不接受鞋盒破损。", en: "No try-ons; no damaged shoebox." },
    rejections: { zh: "无原盒、换底、后配鞋带。", en: "No aftermarket sole swap or re-laced swaps." },
    handoff: { zh: "北京朝阳面交。", en: "Handoff in Chaoyang, Beijing." },
    story: [{ zh: "尺码固定 US11，错码拒收。", en: "US 11 only; wrong size rejected." }],
  },
  {
    id: "a-camera-lens",
    destinationCountryIso: "CN",
    categorySlug: "electronics",
    sortKey: 30,
    title: { zh: "求带：长焦镜头（行货包装）", en: "Carry request: telephoto lens (sealed domestic SKU)" },
    summary: { zh: "日本免税 → 广州", en: "Japan duty-free → Guangzhou" },
    route: { zh: "东京 → 广州", en: "Tokyo → Guangzhou" },
    bountyMinUsdc: 120,
    bountyMaxUsdc: 180,
    deadlineNote: { zh: "30 天内", en: "Within ~30 days" },
    imageSrc: unsplash("photo-1502920917128-1aa500764cbd"),
    inspectionStandard: {
      zh: "封条完整可拍照；拆封须当面并录像，序列号与保修卡一致。",
      en: "Seals intact or unboxed on camera; serial matches warranty card.",
    },
    authenticity: { zh: "需 BicCamera/Yodobashi 小票。", en: "Receipt from named retailers." },
    condition: { zh: "不接受样机或已注册保修。", en: "No demo units or pre-registered warranty." },
    rejections: { zh: "水货无票。", en: "Grey import without receipt." },
    handoff: { zh: "广州白云机场 T2。", en: "CAN Terminal 2." },
    story: [{ zh: "易碎品需妥善缓冲包装。", en: "Fragile; padded packing required." }],
  },
  {
    id: "a-vitamins-bundle",
    destinationCountryIso: "CN",
    categorySlug: "health",
    sortKey: 20,
    title: { zh: "求带：复合维生素套装", en: "Carry request: vitamin bundle" },
    summary: { zh: "美国 OTC → 深圳", en: "US OTC → Shenzhen" },
    route: { zh: "旧金山 → 深圳", en: "San Francisco → Shenzhen" },
    bountyMinUsdc: 80,
    bountyMaxUsdc: 120,
    deadlineNote: { zh: "宽松 60 天", en: "Flexible ~60 days" },
    imageSrc: unsplash("photo-1587854692152-cbe660dbde88"),
    inspectionStandard: {
      zh: "保质期不低于 12 个月；瓶口密封完好；批次号拍照。",
      en: "≥12 months shelf life; sealed caps; batch photos.",
    },
    authenticity: { zh: "需 CVS/Target 小票。", en: "CVS/Target receipt." },
    condition: { zh: "不接受临期或胀罐。", en: "No near-expiry or bloated seals." },
    rejections: { zh: "拆盒混装。", en: "No mixed loose pills." },
    handoff: { zh: "深圳湾口岸附近面交。", en: "Near Shenzhen Bay Port." },
    story: [{ zh: "个人用量范围内；禁运品类请勿接单。", en: "Personal-use quantities; no prohibited goods." }],
  },
  {
    id: "a-watch-straps",
    destinationCountryIso: "CN",
    categorySlug: "accessories",
    sortKey: 10,
    title: { zh: "求带：原厂表带两条", en: "Carry request: two OEM watch straps" },
    summary: { zh: "瑞士专柜 → 成都", en: "Swiss boutique → Chengdu" },
    route: { zh: "苏黎世 → 成都", en: "Zurich → Chengdu" },
    bountyMinUsdc: 200,
    bountyMaxUsdc: 260,
    deadlineNote: { zh: "21 天内", en: "Within ~21 days" },
    imageSrc: unsplash("photo-1524592094714-0f0654e20314"),
    inspectionStandard: {
      zh: "需专柜袋与贴纸完整；长度规格 20/18 各一。",
      en: "Boutique bag and stickers intact; sizes 20mm and 18mm one each.",
    },
    authenticity: { zh: "保卡照片与店铺章。", en: "Warranty card photo with store stamp." },
    condition: { zh: "不接受陈列折痕过深。", en: "No deep creases from long display." },
    rejections: { zh: "第三方表匠改装件。", en: "No third-party modified parts." },
    handoff: { zh: "成都双流面交。", en: "Handoff near Chengdu Shuangliu." },
    story: [{ zh: "小件高价，建议托管分阶段释放。", en: "High value small item; staged escrow release recommended." }],
  },
  {
    id: "a-tea-gift",
    destinationCountryIso: "CN",
    categorySlug: "health",
    sortKey: 45,
    title: { zh: "求带：明前龙井礼盒", en: "Carry request: pre-Qingming Longjing gift set" },
    summary: { zh: "杭州产地 → 深圳", en: "Hangzhou origin → Shenzhen" },
    route: { zh: "杭州 → 深圳", en: "Hangzhou → Shenzhen" },
    bountyMinUsdc: 120,
    bountyMaxUsdc: 160,
    deadlineNote: { zh: "春茶季 30 天内", en: "Within ~30 days of spring harvest" },
    /** 原 photo-1564890369478 已 404；茶礼示意 */
    imageSrc: unsplash("photo-1558618666-fcd25c85cd64"),
    inspectionStandard: {
      zh: "需防伪码可查、外盒无压痕；开封须当面。",
      en: "Anti-counterfeit code verifiable; box undented; open on handoff.",
    },
    authenticity: { zh: "需茶厂直营小票或授权店小票。", en: "Factory or authorized store receipt." },
    condition: { zh: "冷藏链路说明须附在包裹内。", en: "Cold-chain note inside parcel if applicable." },
    rejections: { zh: "散装无品牌。", en: "No unbranded bulk." },
    handoff: { zh: "深圳福田面交。", en: "Futian, Shenzhen handoff." },
    story: [{ zh: "演示收购：易碎品请加固包装。", en: "Demo acquisition: reinforce fragile packing." }],
  },
  {
    id: "a-vinyl-jp",
    destinationCountryIso: "JP",
    categorySlug: "electronics",
    sortKey: 55,
    title: { zh: "求带：限定黑胶唱片", en: "Carry request: limited vinyl LP" },
    summary: { zh: "涩谷唱片店 → 上海", en: "Shibuya record shop → Shanghai" },
    route: { zh: "东京 → 上海", en: "Tokyo → Shanghai" },
    bountyMinUsdc: 90,
    bountyMaxUsdc: 130,
    deadlineNote: { zh: "两周内", en: "Within ~2 weeks" },
    /** 原 photo-1619983081563 已 404；唱片/音乐示意 */
    imageSrc: unsplash("photo-1493225457124-a3eb161ffa5f"),
    inspectionStandard: {
      zh: "封套无折痕、盘面无划痕；编号卡齐全。",
      en: "Sleeve uncreased; disc no scratches; numbered card complete.",
    },
    authenticity: { zh: "须店内购物小票。", en: "In-store receipt required." },
    condition: { zh: "不接受已拆封试听盘。", en: "No opened shop-play copies." },
    rejections: { zh: "bootleg。", en: "No bootlegs." },
    handoff: { zh: "上海静安面交。", en: "Jing'an, Shanghai handoff." },
    story: [{ zh: "演示：悬赏为 USDC 区间示意。", en: "Demo: bounty shown as USDC range." }],
  },
];

export function getDemoMerchantListing(id: string): DemoMerchantListing | undefined {
  return DEMO_MERCHANT_LISTINGS.find((x) => x.id === id);
}

export function getDemoAcquisitionListing(id: string): DemoAcquisitionListing | undefined {
  return DEMO_ACQUISITION_LISTINGS.find((x) => x.id === id);
}

export function demoMerchantListingIds(): string[] {
  return DEMO_MERCHANT_LISTINGS.map((x) => x.id);
}

export function demoAcquisitionListingIds(): string[] {
  return DEMO_ACQUISITION_LISTINGS.map((x) => x.id);
}
