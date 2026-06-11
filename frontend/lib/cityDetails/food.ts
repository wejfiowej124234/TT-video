import type { Option, FoodDetail } from "./types";
import { CITY_TO_REGION } from "./constants";
import { resolveFoodDescription, resolveFoodImage } from "./foodImageOverrides";
import { PRODUCT_COUNTRY_POI_FOOD } from "./productCountryPoi";

/** 按城市维度的美食详情（图片+介绍），供点选后展示；无配置时由 FOOD_BY_CITY 生成默认图与简介 */
const FOOD_IMAGE_BY_REGION: Record<string, string> = {
  default: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
  中国: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80",
  日本: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80",
  法国: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80",
  泰国: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&q=80",
  新加坡: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80",
  意大利: "https://images.unsplash.com/photo-1551183053-bf91a1f8113d?w=400&q=80",
  西班牙: "https://images.unsplash.com/photo-1604329760661-e71dc83f2f26?w=400&q=80",
  美国: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
  英国: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80",
  澳大利亚: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80",
  韩国: "https://images.unsplash.com/photo-1590301157894-8610ed02359b?w=400&q=80",
  阿联酋: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
};

export const FOOD_BY_CITY: Record<string, Option[]> = {
  北京: [
    { value: "全聚德烤鸭", label: "全聚德烤鸭" },
    { value: "东来顺涮肉", label: "东来顺涮肉" },
    { value: "卤煮火烧", label: "卤煮火烧" },
    { value: "豆汁焦圈", label: "豆汁焦圈" },
    { value: "炸酱面", label: "老北京炸酱面" },
  ],
  上海: [
    { value: "小笼包", label: "小笼包" },
    { value: "生煎", label: "生煎" },
    { value: "本帮菜", label: "本帮菜" },
    { value: "南翔馒头", label: "南翔馒头" },
    { value: "蟹粉面", label: "蟹粉面" },
  ],
  杭州: [
    { value: "西湖醋鱼", label: "西湖醋鱼" },
    { value: "龙井虾仁", label: "龙井虾仁" },
    { value: "片儿川", label: "片儿川" },
    { value: "知味观", label: "知味观" },
    { value: "楼外楼", label: "楼外楼" },
  ],
  西安: [
    { value: "肉夹馍", label: "肉夹馍" },
    { value: "羊肉泡馍", label: "羊肉泡馍" },
    { value: "凉皮", label: "凉皮" },
    { value: "biangbiang面", label: "Biangbiang 面" },
    { value: "回民街小吃", label: "回民街小吃" },
  ],
  成都: [
    { value: "火锅", label: "火锅" },
    { value: "串串", label: "串串" },
    { value: "担担面", label: "担担面" },
    { value: "龙抄手", label: "龙抄手" },
    { value: "兔头", label: "兔头" },
  ],
  东京: [
    { value: "寿司", label: "寿司" },
    { value: "拉面", label: "拉面" },
    { value: "天妇罗", label: "天妇罗" },
    { value: "居酒屋", label: "居酒屋" },
  ],
  大阪: [
    { value: "章鱼烧", label: "章鱼烧" },
    { value: "大阪烧", label: "大阪烧" },
    { value: "河豚", label: "河豚" },
    { value: "串炸", label: "串炸" },
  ],
  京都: [
    { value: "怀石料理", label: "怀石料理" },
    { value: "抹茶甜品", label: "抹茶甜品" },
    { value: "汤豆腐", label: "汤豆腐" },
  ],
  巴黎: [
    { value: "法餐", label: "法餐" },
    { value: "可丽饼", label: "可丽饼" },
    { value: "马卡龙", label: "马卡龙" },
    { value: "咖啡厅", label: "咖啡馆" },
  ],
  广州: [
    { value: "早茶", label: "广式早茶" },
    { value: "烧鹅", label: "烧鹅" },
    { value: "煲仔饭", label: "煲仔饭" },
    { value: "糖水", label: "广式糖水" },
    { value: "肠粉", label: "肠粉" },
  ],
  厦门: [
    { value: "沙茶面", label: "沙茶面" },
    { value: "海蛎煎", label: "海蛎煎" },
    { value: "花生汤", label: "花生汤" },
    { value: "馅饼", label: "鼓浪屿馅饼" },
    { value: "土笋冻", label: "土笋冻" },
  ],
  大理: [
    { value: "乳扇", label: "乳扇" },
    { value: "饵块", label: "饵块" },
    { value: "酸辣鱼", label: "酸辣鱼" },
    { value: "白族三道茶", label: "白族三道茶" },
    { value: "喜洲粑粑", label: "喜洲粑粑" },
  ],
  青岛: [
    { value: "海鲜", label: "海鲜" },
    { value: "啤酒", label: "青岛啤酒" },
    { value: "蛤蜊", label: "辣炒蛤蜊" },
    { value: "鲅鱼水饺", label: "鲅鱼水饺" },
    { value: "烧烤", label: "烧烤" },
  ],
  札幌: [
    { value: "味噌拉面", label: "札幌味噌拉面" },
    { value: "成吉思汗", label: "成吉思汗烤肉" },
    { value: "汤咖喱", label: "汤咖喱" },
    { value: "海鲜", label: "海鲜盖饭" },
  ],
  福冈: [
    { value: "豚骨拉面", label: "博多豚骨拉面" },
    { value: "明太子", label: "明太子" },
    { value: "水炊锅", label: "鸡肉水炊锅" },
    { value: "屋台", label: "屋台小吃" },
  ],
  曼谷: [
    { value: "冬阴功", label: "冬阴功" },
    { value: "泰式炒河粉", label: "Pad Thai" },
    { value: "芒果糯米饭", label: "芒果糯米饭" },
    { value: "青木瓜沙拉", label: "青木瓜沙拉" },
    { value: "泰式奶茶", label: "泰式奶茶" },
  ],
  清迈: [
    { value: "泰北咖喱面", label: "泰北咖喱面" },
    { value: "香肠", label: "泰北香肠" },
    { value: "芒果饭", label: "芒果糯米饭" },
    { value: "咖啡", label: "精品咖啡" },
  ],
  普吉: [
    { value: "海鲜", label: "海鲜" },
    { value: "冬阴功", label: "冬阴功" },
    { value: "菠萝饭", label: "菠萝饭" },
    { value: "泰式烧烤", label: "泰式烧烤" },
  ],
  新加坡: [
    { value: "海南鸡饭", label: "海南鸡饭" },
    { value: "肉骨茶", label: "肉骨茶" },
    { value: "辣椒螃蟹", label: "辣椒螃蟹" },
    { value: "叻沙", label: "叻沙" },
    { value: "椰浆饭", label: "椰浆饭" },
  ],
  里昂: [
    { value: "里昂菜", label: "里昂传统菜" },
    { value: "猪肠", label: "里昂猪肠" },
    { value: "可丽饼", label: "可丽饼" },
    { value: "红酒", label: "博若莱红酒" },
  ],
  尼斯: [
    { value: "尼斯沙拉", label: "尼斯沙拉" },
    { value: "索卡", label: "索卡" },
    { value: "海鲜", label: "地中海海鲜" },
    { value: "玫瑰酒", label: "普罗旺斯玫瑰酒" },
  ],
  罗马: [
    { value: "意面", label: "意面" },
    { value: "披萨", label: "罗马披萨" },
    { value: "意式冰淇淋", label: "意式冰淇淋" },
    { value: "咖啡", label: "意式咖啡" },
  ],
  米兰: [
    { value: "烩饭", label: "米兰烩饭" },
    { value: "炸肉排", label: "米兰炸肉排" },
    { value: "意式 aperitivo", label: "意式开胃酒" },
    { value: "提拉米苏", label: "提拉米苏" },
  ],
  威尼斯: [
    { value: "墨鱼面", label: "墨鱼面" },
    { value: "cicchetti", label: "威尼斯小食" },
    { value: "海鲜", label: "海鲜" },
    { value: "意式咖啡", label: "意式咖啡" },
  ],
  佛罗伦萨: [
    { value: "T骨牛排", label: "佛罗伦萨 T 骨牛排" },
    { value: "牛肚包", label: "牛肚包" },
    { value: "意式冰淇淋", label: "意式冰淇淋" },
    { value: "基安蒂红酒", label: "基安蒂红酒" },
  ],
  马德里: [
    { value: "火腿", label: "伊比利亚火腿" },
    { value: "tapas", label: "Tapas" },
    { value: "海鲜饭", label: "海鲜饭" },
    { value: "巧克力油条", label: "巧克力油条" },
  ],
  巴塞罗那: [
    { value: "海鲜饭", label: "海鲜饭" },
    { value: "tapas", label: "Tapas" },
    { value: "伊比利亚火腿", label: "伊比利亚火腿" },
    { value: "桑格利亚", label: "桑格利亚" },
  ],
  塞维利亚: [
    { value: "tapas", label: "Tapas" },
    { value: "伊比利亚火腿", label: "伊比利亚火腿" },
    { value: "橙子", label: "塞维利亚橙" },
    { value: "雪莉酒", label: "雪莉酒" },
  ],
  纽约: [
    { value: "披萨", label: "纽约披萨" },
    { value: "热狗", label: "热狗" },
    { value: "贝果", label: "贝果" },
    { value: "牛排", label: "牛排" },
    { value: "brunch", label: "Brunch" },
  ],
  洛杉矶: [
    { value: "In-N-Out", label: "In-N-Out 汉堡" },
    { value: "墨西哥菜", label: "墨西哥菜" },
    { value: "韩餐", label: "韩餐" },
    { value: "健康轻食", label: "健康轻食" },
  ],
  旧金山: [
    { value: "酸面包", label: "酸面包" },
    { value: "螃蟹", label: "邓杰内斯蟹" },
    { value: "Mission卷饼", label: "Mission 卷饼" },
    { value: "咖啡", label: "精品咖啡" },
  ],
  拉斯维加斯: [
    { value: "自助餐", label: "赌场自助餐" },
    { value: "牛排", label: "牛排馆" },
    { value: "buffet", label: "Buffet" },
  ],
  伦敦: [
    { value: "炸鱼薯条", label: "炸鱼薯条" },
    { value: "英式早餐", label: "英式早餐" },
    { value: "下午茶", label: "下午茶" },
    { value: "印度菜", label: "印度咖喱" },
  ],
  爱丁堡: [
    { value: "哈吉斯", label: "哈吉斯" },
    { value: "威士忌", label: "苏格兰威士忌" },
    { value: "下午茶", label: "下午茶" },
    { value: "海鲜", label: "海鲜" },
  ],
  曼彻斯特: [
    { value: "英式早餐", label: "英式早餐" },
    { value: "炸鱼薯条", label: "炸鱼薯条" },
    { value: "印度菜", label: "咖喱" },
    { value: "精酿", label: "精酿啤酒" },
  ],
  悉尼: [
    { value: "海鲜", label: "海鲜" },
    { value: "brunch", label: "Brunch" },
    { value: "咖啡", label: "精品咖啡" },
    { value: "牛排", label: "牛排" },
  ],
  墨尔本: [
    { value: "brunch", label: "Brunch" },
    { value: "咖啡", label: "精品咖啡" },
    { value: "多元料理", label: "多元料理" },
    { value: "海鲜", label: "海鲜" },
  ],
  黄金海岸: [
    { value: "海鲜", label: "海鲜" },
    { value: "牛排", label: "牛排" },
    { value: "brunch", label: "Brunch" },
    { value: "咖啡", label: "咖啡" },
  ],
  ...PRODUCT_COUNTRY_POI_FOOD,
};

/** 某城市美食详情（含图片、介绍），供点选后展示 */
export function getFoodDetails(city: string): FoodDetail[] {
  const opts = FOOD_BY_CITY[city] ?? [];
  const regionFallback =
    FOOD_IMAGE_BY_REGION[CITY_TO_REGION[city] ?? "default"] ?? FOOD_IMAGE_BY_REGION.default;
  return opts.map((o) => {
    const genericDesc = `${o.label}，当地特色美食，推荐品尝。`;
    return {
      ...o,
      image: resolveFoodImage(city, o.value, regionFallback),
      description: resolveFoodDescription(city, o.value, o.label, genericDesc),
    };
  });
}

export function getFood(city: string): Option[] {
  return FOOD_BY_CITY[city] ?? [];
}
