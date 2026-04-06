import type { Option, AttractionDetail } from "./types";

export const ATTRACTIONS_DETAILS_BY_CITY: Record<string, AttractionDetail[]> = {
  北京: [
    { value: "故宫", label: "故宫", image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80", description: "明清两代皇家宫殿，世界文化遗产，世界上现存规模最大的木质结构古建筑群。" },
    { value: "长城", label: "长城", image: "https://images.unsplash.com/photo-1508807525871-f67542332185?w=400&q=80", description: "中国古代军事防御工程，世界新七大奇迹之一，万里长城举世闻名。" },
    { value: "颐和园", label: "颐和园", image: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&q=80", description: "中国古典园林之首，以昆明湖、万寿山为基址，皇家园林博物馆。" },
    { value: "天坛", label: "天坛", image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80", description: "明清皇帝祭天祈谷的坛庙建筑群，祈年殿为标志性建筑。" },
    { value: "圆明园", label: "圆明园", image: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&q=80", description: "清代皇家园林，有「万园之园」之称，遗址公园可参观。" },
    { value: "南锣鼓巷", label: "南锣鼓巷", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "北京著名胡同与商业街区，汇聚老北京风情与文创小店。" },
  ],
  上海: [
    { value: "外滩", label: "外滩", image: "https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=400&q=80", description: "黄浦江畔万国建筑博览群，夜景璀璨，上海地标。" },
    { value: "东方明珠", label: "东方明珠", image: "https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=400&q=80", description: "浦东陆家嘴电视塔，登顶可俯瞰浦江两岸。" },
    { value: "豫园", label: "豫园", image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80", description: "江南古典园林，城隍庙商圈，传统建筑与小吃。" },
    { value: "田子坊", label: "田子坊", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "石库门里弄改造的创意园区，文艺小店与咖啡馆。" },
    { value: "迪士尼", label: "上海迪士尼", image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80", description: "中国大陆首座迪士尼乐园，六大主题园区。" },
  ],
  杭州: [
    { value: "西湖", label: "西湖", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80", description: "世界文化遗产，西湖十景闻名天下，湖光山色与人文古迹交融。" },
    { value: "灵隐寺", label: "灵隐寺", image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80", description: "千年古刹，飞来峰造像与寺庙建筑，香火鼎盛。" },
    { value: "雷峰塔", label: "雷峰塔", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80", description: "西湖标志性建筑，白娘子传说所在地，可登塔观湖。" },
    { value: "西溪湿地", label: "西溪湿地", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80", description: "城市湿地公园，自然生态与《非诚勿扰》取景地。" },
    { value: "宋城", label: "宋城", image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80", description: "以宋代文化为主题的大型景区，演出与体验项目丰富。" },
  ],
  西安: [
    { value: "兵马俑", label: "兵马俑", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80", description: "世界第八大奇迹，秦始皇陵陪葬坑，陶俑阵容震撼。" },
    { value: "大雁塔", label: "大雁塔", image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80", description: "唐代佛塔，玄奘译经之地，大雁塔北广场音乐喷泉。" },
    { value: "城墙", label: "西安城墙", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80", description: "中国现存最完整的古代城垣，可骑行或步行环城。" },
    { value: "回民街", label: "回民街", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "西安著名美食街，肉夹馍、泡馍、凉皮等小吃云集。" },
    { value: "华清池", label: "华清池", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80", description: "唐代皇家温泉宫，骊山脚下，长恨歌演出所在地。" },
  ],
  成都: [
    { value: "宽窄巷子", label: "宽窄巷子", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "清代古街巷，宽巷子、窄巷子、井巷子，川西民居与茶文化。" },
    { value: "大熊猫基地", label: "大熊猫基地", image: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400&q=80", description: "成都大熊猫繁育研究基地，可近距离观看国宝大熊猫。" },
    { value: "锦里", label: "锦里", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "武侯祠旁仿古街，川味小吃与民俗体验。" },
    { value: "都江堰", label: "都江堰", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80", description: "世界文化遗产，古代水利工程，李冰父子治水杰作。" },
    { value: "武侯祠", label: "武侯祠", image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80", description: "纪念诸葛亮的祠庙，三国文化主题，与锦里相邻。" },
  ],
  东京: [
    { value: "浅草寺", label: "浅草寺", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "东京最古老寺庙，雷门与仲见世通商店街，和风浓郁。" },
    { value: "东京塔", label: "东京塔", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "东京地标红白塔，观景台可俯瞰东京都心。" },
    { value: "新宿", label: "新宿", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "繁华商业与娱乐中心，新宿御苑、歌舞伎町等。" },
    { value: "涩谷", label: "涩谷", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "潮流圣地，涩谷十字路口、忠犬八公像。" },
    { value: "上野公园", label: "上野公园", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "樱花名所，内有动物园、博物馆、美术馆。" },
  ],
  大阪: [
    { value: "大阪城", label: "大阪城", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "日本三名城之一，丰臣秀吉所建，天守阁与公园。" },
    { value: "道顿堀", label: "道顿堀", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "大阪美食街，格力高广告牌、章鱼烧、大阪烧。" },
    { value: "环球影城", label: "环球影城", image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80", description: "日本环球影城 USJ，哈利波特、任天堂等主题园区。" },
    { value: "心斋桥", label: "心斋桥", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "购物与美食街区，与道顿堀相连。" },
  ],
  京都: [
    { value: "伏见稻荷", label: "伏见稻荷大社", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "千本鸟居闻名世界，狐狸神使与稻荷信仰。" },
    { value: "清水寺", label: "清水寺", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "世界文化遗产，清水舞台与音羽瀑布。" },
    { value: "金阁寺", label: "金阁寺", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "金箔覆盖的楼阁建筑，镜湖池倒影经典。" },
    { value: "祇园", label: "祇园", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "花街与艺伎文化，八坂神社、花见小路。" },
  ],
  巴黎: [
    { value: "埃菲尔铁塔", label: "埃菲尔铁塔", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80", description: "巴黎地标，铁制镂空塔楼，可登顶俯瞰巴黎。" },
    { value: "卢浮宫", label: "卢浮宫", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80", description: "世界最大艺术博物馆之一，蒙娜丽莎、断臂维纳斯。" },
    { value: "凯旋门", label: "凯旋门", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80", description: "香榭丽舍大街西端，拿破仑为纪念奥斯特里茨战役而建。" },
    { value: "圣母院", label: "巴黎圣母院", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80", description: "哥特式大教堂，雨果名著背景，修复中。" },
  ],
  // 中国：广州、厦门、大理、青岛
  广州: [
    { value: "广州塔", label: "广州塔", image: "https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=400&q=80", description: "广州地标小蛮腰，可登塔观景，珠江夜景璀璨。" },
    { value: "陈家祠", label: "陈家祠", image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80", description: "岭南建筑艺术明珠，广东民间工艺博物馆。" },
    { value: "沙面", label: "沙面岛", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "欧陆风情建筑群，文艺街区与咖啡馆。" },
    { value: "长隆", label: "长隆度假区", image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80", description: "野生动物世界、欢乐世界、水上乐园一站式度假。" },
    { value: "白云山", label: "白云山", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80", description: "羊城第一秀，登高览城、摩星岭观景。" },
  ],
  厦门: [
    { value: "鼓浪屿", label: "鼓浪屿", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80", description: "海上花园，世界文化遗产，钢琴之岛与万国建筑。" },
    { value: "南普陀", label: "南普陀寺", image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80", description: "闽南名刹，背靠五老峰，与厦大相邻。" },
    { value: "曾厝垵", label: "曾厝垵", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "文艺渔村，民宿、小吃与创意小店。" },
    { value: "环岛路", label: "环岛路", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80", description: "海滨步道与骑行绿道，椰风海韵。" },
    { value: "土楼", label: "福建土楼", image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80", description: "世界文化遗产，可一日游永定或南靖土楼。" },
  ],
  大理: [
    { value: "洱海", label: "洱海", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80", description: "高原明珠，环湖骑行、游船，苍山洱海相映。" },
    { value: "古城", label: "大理古城", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "文献名邦，古城漫步、洋人街与白族风情。" },
    { value: "崇圣寺", label: "崇圣寺三塔", image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80", description: "大理地标，千年佛塔与苍山远景。" },
    { value: "双廊", label: "双廊", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80", description: "洱海边古镇，海景民宿与日落。" },
    { value: "喜洲", label: "喜洲古镇", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "白族民居与喜洲粑粑，田园与扎染体验。" },
  ],
  青岛: [
    { value: "栈桥", label: "栈桥", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80", description: "青岛象征，回澜阁与海鸥，海滨步道起点。" },
    { value: "八大关", label: "八大关", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "万国建筑博览，红瓦绿树与海边别墅。" },
    { value: "崂山", label: "崂山", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80", description: "海上第一名山，道教名山与太清宫。" },
    { value: "啤酒博物馆", label: "青岛啤酒博物馆", image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80", description: "百年啤酒文化与鲜啤体验。" },
    { value: "金沙滩", label: "金沙滩", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80", description: "沙质细软，亚洲一流沙滩，啤酒节主会场。" },
  ],
  // 日本：札幌、福冈
  札幌: [
    { value: "大通公园", label: "大通公园", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "札幌中心绿轴，雪祭与啤酒节主会场。" },
    { value: "时计台", label: "时计台", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "札幌地标，美国风木造钟楼。" },
    { value: "羊之丘", label: "羊之丘展望台", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80", description: "眺望札幌市区与克拉克博士像。" },
    { value: "白色恋人工厂", label: "白色恋人公园", image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80", description: "巧克力工厂与英式庭园，亲子人气景点。" },
    { value: "藻岩山", label: "藻岩山", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80", description: "夜景胜地，缆车登山览札幌夜色。" },
  ],
  福冈: [
    { value: "博多", label: "博多", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "交通枢纽与拉面文化，博多运河城购物。" },
    { value: "太宰府", label: "太宰府天满宫", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "学问之神菅原道真，梅枝饼与星巴克建筑。" },
    { value: "能古岛", label: "能古岛", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80", description: "博多湾离岛，花田、海滩与自然。" },
    { value: "屋台", label: "屋台街", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", description: "中洲等地路边摊，关东煮、拉面与烟火气。" },
  ],
  // 泰国：曼谷、清迈、普吉
  曼谷: [
    { value: "大皇宫", label: "大皇宫", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&q=80", description: "泰国王室宫殿与玉佛寺，金碧辉煌。" },
    { value: "卧佛寺", label: "卧佛寺", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&q=80", description: "巨型卧佛与泰式按摩学校。" },
    { value: "郑王庙", label: "郑王庙", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&q=80", description: "黎明寺，湄南河畔高塔，日落绝景。" },
    { value: "考山路", label: "考山路", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "背包客天堂，夜市、酒吧与马杀鸡。" },
    { value: "水上市场", label: "水上市场", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80", description: "丹嫩沙多或安帕瓦，船上市集与泰式小吃。" },
  ],
  清迈: [
    { value: "古城", label: "清迈古城", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&q=80", description: "四方城墙与护城河，寺庙与咖啡馆。" },
    { value: "素贴山", label: "素贴山双龙寺", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&q=80", description: "俯瞰清迈全景，金塔与朝圣。" },
    { value: "宁曼路", label: "宁曼路", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "文艺街区，网红咖啡与创意小店。" },
    { value: "大象营", label: "大象保护营", image: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400&q=80", description: "大象互动与丛林体验， ethical 保护型营地。" },
    { value: "周日夜市", label: "周日夜市", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "塔佩门起巨型夜市，手作与小吃。" },
  ],
  普吉: [
    { value: "芭东海滩", label: "芭东海滩", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80", description: "最热闹海滩，水上活动与芭东夜市。" },
    { value: "攀牙湾", label: "攀牙湾", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80", description: "海上喀斯特与詹姆斯·邦德岛。" },
    { value: "皮皮岛", label: "皮皮岛", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80", description: "跳岛游人气目的地，碧海与浮潜。" },
    { value: "大佛", label: "普吉大佛", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&q=80", description: "山顶大佛俯瞰普吉与安达曼海。" },
    { value: "老镇", label: "普吉老镇", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "中葡建筑与彩色街巷，周末夜市。" },
  ],
  // 新加坡
  新加坡: [
    { value: "滨海湾", label: "滨海湾", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80", description: "金沙、鱼尾狮、 Gardens by the Bay 与灯光秀。" },
    { value: "圣淘沙", label: "圣淘沙", image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80", description: "环球影城、海滩与度假设施。" },
    { value: "牛车水", label: "牛车水", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "唐人街，美食与佛牙寺。" },
    { value: "小印度", label: "小印度", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80", description: "印度风情街与竹脚中心。" },
    { value: "动物园", label: "新加坡动物园", image: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400&q=80", description: "开放式动物园与夜间动物园。" },
  ],
  // 法国：里昂、尼斯
  里昂: [
    { value: "富维耶", label: "富维耶山", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80", description: "圣母院与古罗马剧场，俯瞰里昂老城。" },
    { value: "老城", label: "里昂老城", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "世界文化遗产， traboule 密道与文艺复兴建筑。" },
    { value: "壁画", label: "里昂壁画", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80", description: "墙画之都，名人墙与丝绸墙。" },
    { value: "金头公园", label: "金头公园", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80", description: "欧洲最大城市公园之一，湖与玫瑰园。" },
  ],
  尼斯: [
    { value: "天使湾", label: "天使湾", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80", description: "蔚蓝海岸弧形海湾，英国人漫步大道。" },
    { value: "老城", label: "尼斯老城", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "色彩建筑、市集与尼斯菜。" },
    { value: "埃兹", label: "埃兹小镇", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80", description: "山顶中世纪村落与异国花园。" },
    { value: "马蒂斯博物馆", label: "马蒂斯博物馆", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80", description: "马蒂斯作品与罗马尼竞技场遗迹。" },
  ],
  // 意大利：罗马、米兰、威尼斯、佛罗伦萨
  罗马: [
    { value: "斗兽场", label: "罗马斗兽场", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80", description: "古罗马象征，角斗士与帝国遗迹。" },
    { value: "梵蒂冈", label: "梵蒂冈", image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80", description: "圣彼得大教堂与梵蒂冈博物馆、西斯廷。" },
    { value: "许愿池", label: "特莱维喷泉", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80", description: "许愿池投币，巴洛克杰作。" },
    { value: "万神殿", label: "万神殿", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80", description: "古罗马保存最完好的建筑，穹顶与拉斐尔墓。" },
    { value: "西班牙广场", label: "西班牙广场", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "台阶与破船喷泉，罗马假日取景。" },
  ],
  米兰: [
    { value: "大教堂", label: "米兰大教堂", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80", description: "哥特式主座教堂，登顶俯瞰米兰。" },
    { value: "斯卡拉", label: "斯卡拉歌剧院", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80", description: "世界顶级歌剧院，歌剧与芭蕾。" },
    { value: "埃马努埃莱二世长廊", label: "埃马努埃莱二世长廊", image: "https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=400&q=80", description: "奢侈品拱廊与马赛克地画。" },
    { value: "斯福尔扎城堡", label: "斯福尔扎城堡", image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80", description: "文艺复兴城堡与博物馆。" },
  ],
  威尼斯: [
    { value: "圣马可", label: "圣马可广场", image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&q=80", description: "欧洲客厅，大教堂、钟楼与总督宫。" },
    { value: "大运河", label: "大运河", image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&q=80", description: "贡多拉或水上巴士，两岸宫殿与桥梁。" },
    { value: "里亚托桥", label: "里亚托桥", image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&q=80", description: "商业与地标石桥，莎士比亚威尼斯商人。" },
    { value: "彩色岛", label: "布拉诺岛", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80", description: "彩色岛，蕾丝与拍照圣地。" },
  ],
  佛罗伦萨: [
    { value: "圣母百花", label: "圣母百花大教堂", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80", description: "文艺复兴地标，穹顶与乔托钟楼。" },
    { value: "乌菲兹", label: "乌菲兹美术馆", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80", description: "波提切利、达芬奇等文艺复兴名作。" },
    { value: "米开朗基罗广场", label: "米开朗基罗广场", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80", description: "俯瞰佛罗伦萨全景与阿诺河日落。" },
    { value: "老桥", label: "老桥", image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&q=80", description: "金店与但丁邂逅贝雅特丽齐的桥。" },
  ],
  // 西班牙：马德里、巴塞罗那、塞维利亚
  马德里: [
    { value: "王宫", label: "马德里王宫", image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80", description: "西班牙王室官邸，欧洲第三大皇宫。" },
    { value: "普拉多", label: "普拉多博物馆", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80", description: "戈雅、委拉斯开兹等西班牙与欧洲名画。" },
    { value: "太阳门", label: "太阳门", image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80", description: "零公里地标与熊与草莓树雕塑。" },
    { value: "丽池公园", label: "丽池公园", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80", description: "水晶宫与划船湖，市民休闲地。" },
  ],
  巴塞罗那: [
    { value: "圣家堂", label: "圣家堂", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80", description: "高迪未竟杰作，世界文化遗产。" },
    { value: "古埃尔公园", label: "古埃尔公园", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80", description: "高迪马赛克与蜥蜴，童话般景观。" },
    { value: "兰布拉", label: "兰布拉大道", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "步行街、街头艺人与博盖利亚市场。" },
    { value: "米拉之家", label: "米拉之家", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80", description: "高迪曲线建筑，屋顶烟囱与博物馆。" },
  ],
  塞维利亚: [
    { value: "王宫", label: "塞维利亚王宫", image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80", description: "摩尔与基督教风格融合，权游多恩取景。" },
    { value: "大教堂", label: "塞维利亚大教堂", image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80", description: "世界最大哥特式教堂，哥伦布墓与吉拉达塔。" },
    { value: "西班牙广场", label: "西班牙广场", image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80", description: "半圆形广场与瓷砖省徽，运河与马车。" },
    { value: "弗拉明戈", label: "弗拉明戈", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "发源地，剧场与 tablao 欣赏正宗表演。" },
  ],
  // 美国：纽约、洛杉矶、旧金山、拉斯维加斯
  纽约: [
    { value: "自由女神", label: "自由女神像", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80", description: "美国象征，乘船登岛或远眺曼哈顿。" },
    { value: "时代广场", label: "时代广场", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80", description: "百老汇与巨型广告屏，跨年倒计时。" },
    { value: "中央公园", label: "中央公园", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80", description: "曼哈顿绿肺，散步、骑行与草莓园。" },
    { value: "大都会", label: "大都会艺术博物馆", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80", description: "世界顶级艺术博物馆，埃及厅与屋顶花园。" },
    { value: "帝国大厦", label: "帝国大厦", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80", description: "登顶观景台，曼哈顿天际线。" },
  ],
  洛杉矶: [
    { value: "好莱坞", label: "好莱坞", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80", description: "星光大道、中国剧院与杜比剧院。" },
    { value: "环球影城", label: "环球影城", image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80", description: "好莱坞环球影城，片场 tour 与主题园区。" },
    { value: "圣莫尼卡", label: "圣莫尼卡海滩", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80", description: "码头、66号公路终点与日落。" },
    { value: "盖蒂", label: "盖蒂中心", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80", description: "艺术博物馆与花园，俯瞰 LA 与太平洋。" },
  ],
  旧金山: [
    { value: "金门大桥", label: "金门大桥", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&q=80", description: "地标红桥，步行、骑行与观景点。" },
    { value: "渔人码头", label: "渔人码头", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80", description: "螃蟹、海狮与恶魔岛远眺。" },
    { value: "缆车", label: "叮当车", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "百年缆车，爬坡与城市景观。" },
    { value: "九曲花街", label: "九曲花街", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80", description: "伦巴底街，世界上最弯的街道之一。" },
  ],
  拉斯维加斯: [
    { value: "大道", label: "拉斯维加斯大道", image: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=400&q=80", description: "赌场酒店、喷泉秀与霓虹夜景。" },
    { value: "百乐宫喷泉", label: "百乐宫喷泉", image: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=400&q=80", description: "音乐喷泉秀，免费必看。" },
    { value: "大峡谷", label: "大峡谷", image: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=400&q=80", description: "一日游或直升机，西峡或南峡。" },
    { value: "秀", label: "秀场", image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80", description: "太阳马戏、魔术与演唱会。" },
  ],
  // 英国：伦敦、爱丁堡、曼彻斯特
  伦敦: [
    { value: "大本钟", label: "大本钟与议会", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80", description: "泰晤士河畔地标，威斯敏斯特宫。" },
    { value: "大英博物馆", label: "大英博物馆", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80", description: "世界级博物馆，免费参观，罗塞塔石碑等。" },
    { value: "塔桥", label: "伦敦塔桥", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80", description: "可开合桥与塔内展览，泰晤士景观。" },
    { value: "白金汉宫", label: "白金汉宫", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80", description: "女王宫邸，卫兵换岗仪式。" },
    { value: "伦敦眼", label: "伦敦眼", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80", description: "摩天轮观景，对岸议会与泰晤士。" },
  ],
  爱丁堡: [
    { value: "城堡", label: "爱丁堡城堡", image: "https://images.unsplash.com/photo-15491406010-847a6506e2f1?w=400&q=80", description: "皇家城堡与苏格兰王冠，俯瞰王子街。" },
    { value: "皇家英里", label: "皇家英里大道", image: "https://images.unsplash.com/photo-15491406010-847a6506e2f1?w=400&q=80", description: "城堡至荷里路德宫，老街与威士忌。" },
    { value: "卡尔顿山", label: "卡尔顿山", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&q=80", description: "国家纪念碑与日落全景。" },
    { value: "大象咖啡馆", label: "大象咖啡馆", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "哈利·波特诞生地，J.K.罗琳写作咖啡馆。" },
  ],
  曼彻斯特: [
    { value: "老特拉福德", label: "老特拉福德", image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80", description: "曼联主场，球场 tour 与博物馆。" },
    { value: "北角", label: "北角", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "创意街区，独立店铺与街头艺术。" },
    { value: "科学与工业博物馆", label: "科学与工业博物馆", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&q=80", description: "工业革命遗存与互动展览。" },
  ],
  // 澳大利亚：悉尼、墨尔本、黄金海岸
  悉尼: [
    { value: "歌剧院", label: "悉尼歌剧院", image: "https://images.unsplash.com/photo-1523059623039-a9ed027e7fad?w=400&q=80", description: "世界文化遗产，帆船造型与港湾大桥。" },
    { value: "海港大桥", label: "海港大桥", image: "https://images.unsplash.com/photo-1523059623039-a9ed027e7fad?w=400&q=80", description: "攀登或步行，港湾与歌剧院视角。" },
    { value: "邦迪海滩", label: "邦迪海滩", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80", description: "经典沙滩与邦迪至库吉步道。" },
    { value: "岩石区", label: "岩石区", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "老城区、周末市集与殖民历史。" },
  ],
  墨尔本: [
    { value: "联邦广场", label: "联邦广场", image: "https://images.unsplash.com/photo-1523059623039-a9ed027e7fad?w=400&q=80", description: "文化广场与弗林德斯街车站对望。" },
    { value: "大洋路", label: "大洋路", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80", description: "一日或两日游，十二门徒与海岸线。" },
    { value: "涂鸦巷", label: "霍西尔巷", image: "https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=400&q=80", description: "涂鸦街与街头艺术。" },
    { value: "菲利普岛", label: "菲利普岛", image: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400&q=80", description: "企鹅归巢与自然生态。" },
  ],
  黄金海岸: [
    { value: "冲浪者天堂", label: "冲浪者天堂", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80", description: "沙滩、高楼与冲浪文化。" },
    { value: "梦幻世界", label: "梦幻世界", image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80", description: "主题乐园与考拉、袋鼠互动。" },
    { value: "可伦宾", label: "可伦宾动物园", image: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400&q=80", description: "抱考拉、喂袋鼠与野生动物。" },
    { value: "Q1", label: "Q1 观景台", image: "https://images.unsplash.com/photo-1523059623039-a9ed027e7fad?w=400&q=80", description: "南半球最高住宅楼观景，海岸全景。" },
  ],
};

/** @deprecated 使用 ATTRACTIONS_DETAILS_BY_CITY + getAttractionDetails */
export const ATTRACTIONS_BY_CITY: Record<string, Option[]> = Object.fromEntries(
  Object.entries(ATTRACTIONS_DETAILS_BY_CITY).map(([k, v]) => [k, v.map(({ value, label }) => ({ value, label }))])
);

/** 某城市若无配置则返回空数组 */
export function getAttractions(city: string): Option[] {
  return ATTRACTIONS_BY_CITY[city] ?? [];
}

/** 某城市景区详情（含图片、介绍），供选中后展示 */
export function getAttractionDetails(city: string): AttractionDetail[] {
  return ATTRACTIONS_DETAILS_BY_CITY[city] ?? [];
}