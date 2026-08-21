import type {
  TravelTrustAnnouncementDisplay,
  TravelTrustCmsCopy,
} from "./traveltrustCmsAnnouncements";
import type { TravelTrustAnnouncement } from "./traveltrustNetworkAnnouncements";

/**
 * Official www CMS titles / ticker summaries / detail bodies.
 * Used only when local CMS pulse/list is empty (static fallback).
 * Ticker summaries follow the Official homepage chips; dialog bodies follow Official CMS.
 */
export const TRAVELTRUST_STATIC_ANNOUNCEMENT_CMS_COPY: Record<string, TravelTrustCmsCopy> = {
  "product-ttg-v8-25t": {
    titleZh: "TTG 已按 25 万亿总量部署",
    titleEn: "TTG is live at 25 trillion total supply",
    summaryZh:
      "官网治理代币为 25T 面额：团队 15 / DAO 35 / 公众 50。认购市场已部署，交易尚未对公众开放。这不是 Production GO。",
    summaryEn:
      "Official governance token is the 25T denomination: Team 15 / DAO 35 / Public 50. The primary market is deployed; trading is not open to the public. This is not Production GO.",
    bodyZh:
      "治理代币 TTG 公示总量 25,000,000,000,000（25 万亿）。\n\n创世分配：公开份额 50%、DAO 35%、团队 3%、营销 5%、金库 7%（后三项合计 15%）。公开解锁五批：第一批 2026 年 10 月 15 日，之后每批间隔两个月。首批公示参考价约 1 USDC ≈ 1,000,000 TTG，最低 1 USDC。\n\n一级市场各批窗口结束后，未售出的公开份额可销毁一部分，不留作库存。这是公示目标，细则以随后公布的协议说明为准。销毁不是价格保护，也不是收益承诺。\n\n本页批次、比例与价格是产品公示计划；合约将按该计划更新。兑换窗口和公众投票尚未对公众开放。行程订金走 USDC 托管，与取得 TTG 分开。公示计划不等于可以买入。",
    bodyEn:
      "TTG public plan is 25,000,000,000,000 (25 trillion) total supply.\n\nGenesis split: Public 50%, DAO 35%, Team 3%, Marketing 5%, Treasury 7% (last three = 15%). Public unlock is five batches: first on 15 October 2026, then every two months. First-batch reference is about 1 USDC ≈ 1,000,000 TTG, minimum 1 USDC.\n\nAfter each primary-market batch closes, unsold public-share remainder may be burned in part and is not kept as inventory. This is a published target; details follow in the protocol paper when signed. A burn is not price protection and not a return promise.\n\nBatch sizes, ratios, and prices on this page are the product plan; contracts will be updated to match. The exchange window and public voting are not open. Trip deposits use USDC escrow, separate from obtaining TTG. A published plan is not an invitation to buy.",
  },
  "campaign-referral": {
    titleZh: "邀请好友，一起拿成长积分",
    titleEn: "Invite friends and earn growth points",
    summaryZh:
      "分享你的邀请码。好友注册并完成体验后，双方都能获得成长积分。积分用于站内成长，不是代币空投。",
    summaryEn:
      "Share your invite code. After a friend registers and completes an experience, both of you earn growth points. Points are for in-app progress and cannot be swapped for tokens or cash.",
    bodyZh:
      "怎么参加\n\n1. 打开「我的 → 推荐中心」，复制你的邀请链接。\n2. 把链接发给朋友。朋友用这个链接注册后，系统会自动记下推荐关系。\n3. 朋友完成一次公开规则下的体验后，你们双方都会获得成长积分。\n\n成长积分只用于站内进度，不能兑换成代币或现金。本活动不发放代币。",
    bodyEn:
      "How it works\n\n1. Open Me → Referrals and copy your invite link.\n2. Share the link. When a friend registers through it, the referral is bound automatically.\n3. After your friend completes an experience under published rules, both of you earn growth points.\n\nGrowth points are for in-app progress. They cannot be swapped for tokens or cash. This campaign does not distribute tokens.",
  },
  "product-role-traveler": {
    titleZh: "旅行者：链上托管，专属向导",
    titleEn: "Traveler: on-chain escrow, a dedicated guide",
    summaryZh: "行程资金锁定在已部署的托管合约，双方确认后才释放。注册后可找专属向导。",
    summaryEn:
      "Trip funds lock in escrow under published rules and release only after both sides confirm. Register to find a dedicated guide.",
    bodyZh:
      "你是旅行者：用 USDC 付行程，一位专属向导带完整旅程。\n\n资金不进平台账户，锁定在托管合约里，双方确认后才释放。\n\n下一步：注册账号，浏览行程并预约。",
    bodyEn:
      "You are a traveler: pay in USDC, and a dedicated guide connects the full trip.\n\nFunds do not sit in a platform account. They lock in escrow and release after both sides confirm.\n\nNext: register, browse trips, and book.",
  },
  "product-role-guide": {
    titleZh: "向导：完成入驻后接待旅行订单",
    titleEn: "Guide: onboard, then take travel orders",
    summaryZh:
      "完成认证后，直接接待全球旅行者。服务更自主，平台成本更低，用 USDC 结算。",
    summaryEn:
      "After platform onboarding review, take travel orders. Orders use the same escrow settlement — not a private transfer.",
    bodyZh:
      "您是向导：完成平台入驻审核后接待旅行订单。\n\n订单资金走同一套托管，不私下收款。\n\n下一步：申请入驻，通过后发布可预约的服务。",
    bodyEn:
      "You are a guide: after platform onboarding review, take travel orders.\n\nOrder funds use the same escrow path — not a private transfer.\n\nNext: apply to onboard, then publish bookable services.",
  },
  "product-role-merchant": {
    titleZh: "商家：让本地服务直连全球旅行市场",
    titleEn: "Merchant: connect local services to global travel",
    summaryZh:
      "酒店、餐厅、景区可用合法资质开店，直接接到旅行者与向导，USDC 结算。",
    summaryEn:
      "Hotels, restaurants, and attractions can open a trusted shop and reach travelers and guides; orders settle in escrow.",
    bodyZh:
      "你是商家：把本地服务直接接到全球旅行订单。\n\n规则公开，付款进入托管，确认后结算。\n\n下一步：申请入驻，通过后在市场发布商品或服务。",
    bodyEn:
      "You are a merchant: connect local services directly to global travel orders.\n\nRules are public. Payments lock in escrow and settle after confirmation.\n\nNext: apply to onboard, then list goods or services.",
  },
  "product-role-acquisition": {
    titleZh: "旅行收购：需求先行，不是传统代购",
    titleEn: "Travel acquisition: demand-first, not traditional daigou",
    summaryZh: "买方先发布需求，旅行者用真实行程响应并交付。不是传统代购，也不是证券。",
    summaryEn:
      "Buyers post demand first. Travelers on real trips respond and deliver. Not traditional daigou, and not a security.",
    bodyZh:
      "旅行收购是需求先行：收购人写清要什么，旅行者在真实行程里响应、采购、交付。\n\n不是传统代购，不是证券发行，不承诺收益。\n\n下一步：从「我的 → 身份」进入收购子站，按该页门闸操作。",
    bodyEn:
      "Acquisition is demand-first: buyers publish what they need; travelers on real trips respond, buy, and deliver.\n\nNot traditional daigou, not a securities offering, and no promised yield.\n\nNext: open the acquisition sub-site from Me → Identities and follow the gates there.",
  },
  "product-role-steward": {
    titleZh: "区域主理人：连接协议与本地旅行生态",
    titleEn: "Region steward: connect protocol to the local travel economy",
    summaryZh: "服务一座城的旅行网络：参与建设、申请审核席位，并通过提案参与治理。",
    summaryEn:
      "Serve a city’s travel network: help build it, apply for a reviewed seat, and join governance proposals.",
    bodyZh:
      "区域主理人连接全球协议和本地旅行生态，不是网站后台管理员。\n\n可以参与区域建设、申请审核与质押席位，并用治理提案监督平台。资格以入驻审核为准，不是买入赠品。\n\n下一步：申请成为区域主理人。",
    bodyEn:
      "A region steward connects the global protocol to the local travel economy. This is not a back-office admin role.\n\nYou can help build the region, apply for a reviewed and staked seat, and oversee the platform through proposals. Eligibility follows review — not a purchase bonus.\n\nNext: apply to become a region steward.",
  },
};

export function withStaticAnnouncementCmsCopy(
  items: TravelTrustAnnouncement[],
): TravelTrustAnnouncementDisplay[] {
  return items.map((item) => {
    const cmsCopy = TRAVELTRUST_STATIC_ANNOUNCEMENT_CMS_COPY[item.id];
    return cmsCopy ? { ...item, cmsCopy } : { ...item };
  });
}
