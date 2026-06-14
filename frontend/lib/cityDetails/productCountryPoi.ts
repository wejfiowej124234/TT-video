import type { AttractionDetail } from "./types";
import type { Option } from "./types";

/** 十国产品期内韩、阿联酋等城市 POI（景区 + 美食） */
export const PRODUCT_COUNTRY_POI_ATTRACTIONS: Record<string, AttractionDetail[]> = {
  首尔: [
    {
      value: "景福宫",
      label: "景福宫",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80",
      description: "朝鲜王朝正宫，守门将士换岗与韩服体验人气高。",
    },
    {
      value: "北村韩屋村",
      label: "北村韩屋村",
      image: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400&q=80",
      description: "传统韩屋街巷，俯瞰首尔北山与宫殿屋顶。",
    },
    {
      value: "明洞",
      label: "明洞",
      image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80",
      description: "购物与美妆圣地，街头小吃与百货云集。",
    },
    {
      value: "N首尔塔",
      label: "N首尔塔",
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80",
      description: "南山地标，情侣锁与夜景俯瞰首尔。",
    },
    {
      value: "汉江公园",
      label: "汉江公园",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
      description: "江边骑行、炸鸡啤酒与周末市集文化。",
    },
  ],
  釜山: [
    {
      value: "海云台",
      label: "海云台海滩",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
      description: "韩国代表性海滩，海鲜市场与海滨步道。",
    },
    {
      value: "甘川文化村",
      label: "甘川文化村",
      image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80",
      description: "彩色阶梯村落，小王子打卡与文创小店。",
    },
    {
      value: "札嘎其市场",
      label: "札嘎其水产市场",
      image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&q=80",
      description: "活海鲜现挑现做，釜山本地烟火气。",
    },
    {
      value: "广安里大桥",
      label: "广安里大桥",
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80",
      description: "夜间灯光秀与海边咖啡街。",
    },
  ],
  济州: [
    {
      value: "城山日出峰",
      label: "城山日出峰",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
      description: "联合国教科文组织自然遗产，火山口海景日出。",
    },
    {
      value: "涉地可支",
      label: "涉地可支",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
      description: "海岸悬崖与教堂，韩剧取景地。",
    },
    {
      value: "汉拿山",
      label: "汉拿山",
      image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80",
      description: "韩国最高峰，徒步与四季山景。",
    },
    {
      value: "橘子园",
      label: "济州橘园",
      image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80",
      description: "柑橘采摘与橘子甜品体验。",
    },
  ],
  仁川: [
    {
      value: "中华街",
      label: "仁川中华街",
      image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80",
      description: "韩国最大唐人街，炸酱面与糖醋肉发源地之一。",
    },
    {
      value: "月尾岛",
      label: "月尾岛",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
      description: "海边步道、摩天轮与海鸥喂食。",
    },
    {
      value: "松岛新城",
      label: "松岛中央公园",
      image: "https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=400&q=80",
      description: "现代滨海新城，运河与夜景。",
    },
  ],
  迪拜: [
    {
      value: "哈利法塔",
      label: "哈利法塔",
      image: "https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=400&q=80",
      description: "世界最高建筑，观景台俯瞰沙漠都市天际线。",
    },
    {
      value: "迪拜购物中心",
      label: "迪拜购物中心",
      image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80",
      description: "巨型商场、水族馆与音乐喷泉相邻。",
    },
    {
      value: "棕榈岛",
      label: "棕榈岛",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
      description: "人工岛地标，度假酒店与海滩俱乐部。",
    },
    {
      value: "阿法迪历史区",
      label: "阿法迪历史区",
      image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80",
      description: "风塔民居与博物馆，感受老城迪拜。",
    },
    {
      value: "沙漠冲沙",
      label: "沙漠冲沙",
      image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80",
      description: "阿拉伯沙漠越野、骑骆驼与贝都因晚餐。",
    },
  ],
  阿布扎比: [
    {
      value: "谢赫扎耶德清真寺",
      label: "谢赫扎耶德大清真寺",
      image: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=400&q=80",
      description: "白色大理石穹顶与水晶灯，对非穆斯林开放参观。",
    },
    {
      value: "卢浮宫阿布扎比",
      label: "卢浮宫阿布扎比",
      image: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=400&q=80",
      description: "海上艺术博物馆，世界文明藏品。",
    },
    {
      value: "法拉利世界",
      label: "法拉利世界",
      image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80",
      description: "亚斯岛室内主题乐园，过山车与赛车文化。",
    },
    {
      value: "滨海大道",
      label: "滨海大道",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
      description: "海岸线步道、海滩与酋长皇宫远景。",
    },
  ],
  沙迦: [
    {
      value: "遗产区",
      label: "沙迦遗产区",
      image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80",
      description: "海湾文化之都，传统市集与伊斯兰建筑。",
    },
    {
      value: "蓝色市场",
      label: "蓝色市场",
      image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80",
      description: "标志性蓝色瓷砖穹顶，黄金与地毯市集。",
    },
    {
      value: "艺术博物馆",
      label: "沙迦艺术博物馆",
      image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80",
      description: "阿拉伯现代艺术重要馆藏。",
    },
  ],
};

export const PRODUCT_COUNTRY_POI_FOOD: Record<string, Option[]> = {
  首尔: [
    { value: "韩式烤肉", label: "韩式烤肉" },
    { value: "拌饭", label: "石锅拌饭" },
    { value: "炸鸡", label: "韩式炸鸡" },
    { value: "参鸡汤", label: "参鸡汤" },
  ],
  釜山: [
    { value: "猪肉汤饭", label: "猪肉汤饭" },
    { value: "生鱼片", label: "釜山生鱼片" },
    { value: "鱼饼", label: "鱼饼汤" },
    { value: "小麦面", label: "釜山小麦面" },
  ],
  济州: [
    { value: "黑猪肉", label: "济州黑猪肉" },
    { value: "海鲜面", label: "海鲜拉面" },
    { value: "橘子甜品", label: "橘子甜品" },
    { value: "鲍鱼粥", label: "鲍鱼粥" },
  ],
  仁川: [
    { value: "炸酱面", label: "仁川炸酱面" },
    { value: "海鲜", label: "西海岸海鲜" },
    { value: "辣炒年糕", label: "辣炒年糕" },
  ],
  迪拜: [
    { value: "阿拉伯烤肉", label: "阿拉伯烤肉" },
    { value: "沙威玛", label: "沙威玛" },
    { value: "椰枣甜品", label: "椰枣甜品" },
    { value: "阿拉伯咖啡", label: "阿拉伯咖啡" },
  ],
  阿布扎比: [
    { value: "鹰嘴豆泥", label: "鹰嘴豆泥" },
    { value: "海鲜饭", label: "海湾海鲜饭" },
    { value: "骆驼奶", label: "骆驼奶" },
    { value: "烤肉拼盘", label: "烤肉拼盘" },
  ],
  沙迦: [
    { value: "中东烤肉", label: "中东烤肉" },
    { value: "库斯库斯", label: "库斯库斯" },
    { value: "薄荷茶", label: "薄荷茶" },
    { value: "炸蚕豆", label: "炸蚕豆" },
  ],
};
