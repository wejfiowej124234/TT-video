/**
 * 社区 mock 公共常量：图片池、昵称、目的地、标签、工具函数
 */

const TRAVEL_IMAGES = [
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80",
  "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&q=80",
  "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80",
  "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=600&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80",
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80",
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80",
];

const FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&q=80",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80",
  "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80",
  "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80",
];

export const AVATARS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80",
  "https://images.unsplash.com/photo-1599566150163-29194dabcad3?w=120&q=80",
];

export const NICKNAMES_TOURIST = ["云游四海", "背包客小林", "行者无疆", "旅途中的风", "看世界", "漫游者", "自由行", "山河故人"];
export const NICKNAMES_GUIDE = ["京都小张", "东京李导", "大阪王姐", "丽江纳西", "厦门鼓浪屿", "桂林山水", "三亚椰林", "成都熊猫哥"];
export const DESTINATIONS = ["东京", "京都", "曼谷", "新加坡", "巴厘岛", "巴黎", "上海", "丽江", "厦门", "三亚", "清迈", "普吉"];
export const TAGS_POOL = ["#旅行", "#美食", "#攻略", "#小众", "#周末游", "#亲子", "#海岛", "#古镇", "#樱花", "#秋叶"];

export function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

export const MOCK_CURRENT_USER_ID = "u1";

export const TRAVEL_IMAGES_POOL = TRAVEL_IMAGES;
export const FOOD_IMAGES_POOL = FOOD_IMAGES;
