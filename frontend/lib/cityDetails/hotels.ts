import type { Option, HotelDetail } from "./types";
import { CITY_TO_REGION } from "./constants";

export const HOTELS_BY_CITY: Record<string, Option[]> = {
  北京: [
    { value: "北京饭店", label: "北京饭店" },
    { value: "王府井希尔顿", label: "王府井希尔顿" },
    { value: "四合院民宿", label: "四合院民宿" },
    { value: "国贸商圈酒店", label: "国贸商圈酒店" },
  ],
  上海: [
    { value: "外滩酒店", label: "外滩景观酒店" },
    { value: "新天地酒店", label: "新天地酒店" },
    { value: "浦东酒店", label: "浦东商务酒店" },
  ],
  杭州: [
    { value: "西湖国宾馆", label: "西湖国宾馆" },
    { value: "西溪喜来登", label: "西溪喜来登" },
    { value: "西湖边民宿", label: "西湖边民宿" },
  ],
  西安: [
    { value: "钟楼酒店", label: "钟楼附近酒店" },
    { value: "大雁塔酒店", label: "大雁塔附近酒店" },
    { value: "城墙内民宿", label: "城墙内民宿" },
  ],
  成都: [
    { value: "春熙路酒店", label: "春熙路酒店" },
    { value: "宽窄巷子民宿", label: "宽窄巷子民宿" },
  ],
  东京: [
    { value: "新宿酒店", label: "新宿酒店" },
    { value: "浅草酒店", label: "浅草酒店" },
    { value: "银座酒店", label: "银座酒店" },
  ],
  大阪: [
    { value: "心斋桥酒店", label: "心斋桥酒店" },
    { value: "梅田酒店", label: "梅田酒店" },
  ],
  京都: [
    { value: "祇园酒店", label: "祇园酒店" },
    { value: "町屋民宿", label: "町屋民宿" },
  ],
  巴黎: [
    { value: "左岸酒店", label: "左岸酒店" },
    { value: "香榭丽舍酒店", label: "香榭丽舍附近" },
  ],
  广州: [
    { value: "珠江新城酒店", label: "珠江新城酒店" },
    { value: "沙面酒店", label: "沙面酒店" },
    { value: "天河商圈酒店", label: "天河商圈酒店" },
    { value: "老城区民宿", label: "老城区民宿" },
  ],
  厦门: [
    { value: "鼓浪屿民宿", label: "鼓浪屿民宿" },
    { value: "曾厝垵民宿", label: "曾厝垵民宿" },
    { value: "环岛路酒店", label: "环岛路酒店" },
    { value: "中山路酒店", label: "中山路酒店" },
  ],
  大理: [
    { value: "古城民宿", label: "大理古城民宿" },
    { value: "洱海边酒店", label: "洱海边酒店" },
    { value: "双廊酒店", label: "双廊酒店" },
    { value: "喜洲民宿", label: "喜洲民宿" },
  ],
  青岛: [
    { value: "栈桥酒店", label: "栈桥附近酒店" },
    { value: "五四广场酒店", label: "五四广场酒店" },
    { value: "海边民宿", label: "海边民宿" },
  ],
  札幌: [
    { value: "薄野酒店", label: "薄野酒店" },
    { value: "大通酒店", label: "大通公园附近" },
    { value: "温泉旅馆", label: "定山溪温泉旅馆" },
  ],
  福冈: [
    { value: "博多站酒店", label: "博多站酒店" },
    { value: "天神酒店", label: "天神商圈酒店" },
    { value: "温泉旅馆", label: "温泉旅馆" },
  ],
  曼谷: [
    { value: "暹罗酒店", label: "暹罗商圈酒店" },
    { value: "考山路青旅", label: "考山路青旅" },
    { value: "素坤逸酒店", label: "素坤逸酒店" },
    { value: "河畔酒店", label: "湄南河畔酒店" },
  ],
  清迈: [
    { value: "古城民宿", label: "古城民宿" },
    { value: "宁曼路酒店", label: "宁曼路酒店" },
    { value: "度假村", label: "山间度假村" },
  ],
  普吉: [
    { value: "芭东海滩酒店", label: "芭东海滩酒店" },
    { value: "卡塔酒店", label: "卡塔/卡伦酒店" },
    { value: "度假村", label: "海边度假村" },
  ],
  新加坡: [
    { value: "滨海湾酒店", label: "滨海湾酒店" },
    { value: "乌节路酒店", label: "乌节路酒店" },
    { value: "牛车水酒店", label: "牛车水酒店" },
    { value: "圣淘沙酒店", label: "圣淘沙酒店" },
  ],
  里昂: [
    { value: "老城酒店", label: "里昂老城酒店" },
    { value: "Presqu'île酒店", label: "Presqu'île 酒店" },
    { value: "商务酒店", label: "商务酒店" },
  ],
  尼斯: [
    { value: "海滨酒店", label: "海滨酒店" },
    { value: "老城酒店", label: "老城酒店" },
    { value: "度假酒店", label: "度假酒店" },
  ],
  罗马: [
    { value: "历史中心酒店", label: "历史中心酒店" },
    { value: "特拉斯提弗列酒店", label: "特拉斯提弗列酒店" },
    { value: "西班牙广场酒店", label: "西班牙广场附近" },
  ],
  米兰: [
    { value: "大教堂酒店", label: "大教堂附近酒店" },
    { value: "时尚区酒店", label: "时尚区酒店" },
    { value: "中央车站酒店", label: "中央车站酒店" },
  ],
  威尼斯: [
    { value: "主岛酒店", label: "主岛酒店" },
    { value: "水边民宿", label: "水边民宿" },
    { value: "梅斯特雷酒店", label: "梅斯特雷酒店" },
  ],
  佛罗伦萨: [
    { value: "老城酒店", label: "老城酒店" },
    { value: "阿诺河畔酒店", label: "阿诺河畔酒店" },
    { value: "民宿", label: "托斯卡纳民宿" },
  ],
  马德里: [
    { value: "太阳门酒店", label: "太阳门酒店" },
    { value: "格兰大道酒店", label: "格兰大道酒店" },
    { value: "萨拉曼卡酒店", label: "萨拉曼卡区酒店" },
  ],
  巴塞罗那: [
    { value: "兰布拉酒店", label: "兰布拉大道酒店" },
    { value: "哥特区酒店", label: "哥特区酒店" },
    { value: "海滩酒店", label: "海滩酒店" },
  ],
  塞维利亚: [
    { value: "老城酒店", label: "老城酒店" },
    { value: "圣克鲁斯酒店", label: "圣克鲁斯区酒店" },
    { value: "西班牙广场酒店", label: "西班牙广场附近" },
  ],
  纽约: [
    { value: "曼哈顿酒店", label: "曼哈顿酒店" },
    { value: "时代广场酒店", label: "时代广场酒店" },
    { value: "布鲁克林酒店", label: "布鲁克林酒店" },
  ],
  洛杉矶: [
    { value: "好莱坞酒店", label: "好莱坞酒店" },
    { value: "圣莫尼卡酒店", label: "圣莫尼卡酒店" },
    { value: "比弗利酒店", label: "比弗利山庄附近" },
  ],
  旧金山: [
    { value: "联合广场酒店", label: "联合广场酒店" },
    { value: "渔人码头酒店", label: "渔人码头酒店" },
    { value: "SOMA酒店", label: "SOMA 酒店" },
  ],
  拉斯维加斯: [
    { value: "Strip酒店", label: "Strip 酒店" },
    { value: "赌场酒店", label: "赌场酒店" },
    { value: "Downtown酒店", label: "Downtown 酒店" },
  ],
  伦敦: [
    { value: "西区酒店", label: "西区酒店" },
    { value: "泰晤士河畔酒店", label: "泰晤士河畔酒店" },
    { value: "考文特花园酒店", label: "考文特花园酒店" },
  ],
  爱丁堡: [
    { value: "皇家一英里酒店", label: "皇家一英里酒店" },
    { value: "新城酒店", label: "新城酒店" },
    { value: "城堡景观酒店", label: "城堡景观酒店" },
  ],
  曼彻斯特: [
    { value: "市中心酒店", label: "市中心酒店" },
    { value: "北区酒店", label: "北区酒店" },
    { value: "索尔福德酒店", label: "索尔福德酒店" },
  ],
  悉尼: [
    { value: "环形码头酒店", label: "环形码头酒店" },
    { value: "达令港酒店", label: "达令港酒店" },
    { value: "邦迪酒店", label: "邦迪海滩酒店" },
  ],
  墨尔本: [
    { value: "CBD酒店", label: "CBD 酒店" },
    { value: "菲茨罗伊酒店", label: "菲茨罗伊酒店" },
    { value: "圣基尔达酒店", label: "圣基尔达酒店" },
  ],
  黄金海岸: [
    { value: "冲浪者天堂酒店", label: "冲浪者天堂酒店" },
    { value: "宽滩酒店", label: "宽滩酒店" },
    { value: "度假村", label: "度假村" },
  ],
};

/** 酒店展示图按地区（与 FOOD_IMAGE_BY_REGION 同键），无配置用 default */
const HOTEL_IMAGE_BY_REGION: Record<string, string> = {
  default: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  中国: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80",
  日本: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  法国: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80",
  泰国: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  新加坡: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  意大利: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&q=80",
  西班牙: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  美国: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  英国: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  澳大利亚: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
};

/** 酒店详情（含图片、介绍），由 HOTELS_BY_CITY 派生，供点选后展示 */
export const HOTELS_DETAILS_BY_CITY: Record<string, HotelDetail[]> = (() => {
  const out: Record<string, HotelDetail[]> = {};
  for (const [city, opts] of Object.entries(HOTELS_BY_CITY)) {
    const img = HOTEL_IMAGE_BY_REGION[CITY_TO_REGION[city] ?? "default"] ?? HOTEL_IMAGE_BY_REGION.default;
    out[city] = opts.map((o) => ({
      ...o,
      image: img,
      description: `${o.label}，位置便利，适合当日行程入住。`,
    }));
  }
  return out;
})();


/** 某城市酒店详情（含图片、介绍），供点选后展示 */
export function getHotelDetails(city: string): HotelDetail[] {
  return HOTELS_DETAILS_BY_CITY[city] ?? [];
}

export function getHotels(city: string): Option[] {
  return HOTELS_BY_CITY[city] ?? [];
}
