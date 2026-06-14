import { poiStockUrl } from "../poiStockPool";
import { ATTRACTION_SEMANTIC } from "../poiSemanticMaps";
import { buildPoiImageId } from "./poiImageId";
import { UNSPLASH_LICENSE, unsplashPhotoUrl } from "./unsplash";
import type { PoiImageCandidate, PoiImageVerificationEntry } from "./types";

const COUNTRY = "中国";
const CITY = "北京";
const BATCH_ID = "CN-北京-attraction-01";

function productionAttractionUrl(value: string): string {
  const stockKey = ATTRACTION_SEMANTIC[value];
  return stockKey ? poiStockUrl(stockKey) : "";
}

function cand(
  id: string,
  photoId: string,
  sourcePageUrl: string,
  sceneDescription: string,
  status: PoiImageCandidate["status"] = "PENDING",
  notes?: string
): PoiImageCandidate {
  return {
    id,
    previewUrl: unsplashPhotoUrl(photoId),
    sourcePageUrl,
    sceneDescription,
    license: UNSPLASH_LICENSE,
    status,
    notes,
  };
}

function entry(
  value: string,
  label: string,
  candidates: PoiImageCandidate[]
): PoiImageVerificationEntry {
  return {
    poiId: buildPoiImageId({ country: COUNTRY, city: CITY, kind: "attraction", value }),
    country: COUNTRY,
    city: CITY,
    kind: "attraction",
    label,
    value,
    productionImageUrl: productionAttractionUrl(value),
    batchId: BATCH_ID,
    batchStatus: "PENDING",
    candidates,
  };
}

/**
 * 北京景区 · 批次 01 候选清单（机读 SSOT）
 * 人读版：frontend/evidence/poi-image-verification/中国/北京/POI-图片候选清单.md
 */
export const POI_IMAGE_CANDIDATE_ENTRIES: PoiImageVerificationEntry[] = [
  entry("故宫", "故宫", [
    cand(
      "cand-01",
      "1656171600501-456e5fd9614f",
      "https://unsplash.com/photos/forbidden-city-with-a-large-ornate-roof-OSehE1XZWi0",
      "故宫红墙黄瓦与宫殿屋顶，典型紫禁城建筑视角",
      "PENDING",
      "当前线上语义池同款；用户反馈此张匹配较好"
    ),
    cand(
      "cand-02",
      "1680537006773-67878eb8b20a",
      "https://unsplash.com/photos/an-aerial-view-of-the-forbidden-city-of-china--UVRyZuDdQI",
      "紫禁城鸟瞰，中轴对称宫殿群与周边城市"
    ),
    cand(
      "cand-03",
      "1751688412331-720d7f6d91f2",
      "https://unsplash.com/photos/detailed-architecture-in-beijings-forbidden-city-is-shown-pz_Vyi7wXqY",
      "故宫建筑细部：斗拱、彩绘与屋檐"
    ),
    cand(
      "cand-04",
      "1656293563191-1c3a5463e7f4",
      "https://unsplash.com/photos/forbidden-city-with-a-large-ornate-roof-OSehE1XZWi0",
      "故宫博物院正门视角，人群与华丽屋顶"
    ),
    cand(
      "cand-05",
      "1547981609-4b6bfe67ca0b",
      "https://unsplash.com/photos/people-at-forbidden-city-in-china-during-daytime-yBroAF1cN3I",
      "白天故宫广场与游客，宫殿主体清晰"
    ),
  ]),
  entry("长城", "长城", [
    cand(
      "cand-01",
      "1693721783596-afebf1d4354f",
      "https://unsplash.com/photos/the-great-wall-of-china-on-a-sunny-day-1-mhG1DZMOA",
      "慕田峪长城晴日，城墙蜿蜒于山脊"
    ),
    cand(
      "cand-02",
      "1551101509-f6f2cbae3604",
      "https://unsplash.com/photos/great-wall-of-china-3wwiqmOm3gQ",
      "长城敌楼与山峦，经典徒步视角"
    ),
    cand(
      "cand-03",
      "1751862958456-6e62a5c45468",
      "https://unsplash.com/photos/the-great-wall-of-china-stretches-across-the-mountains-EDV9blSc3bA",
      "八达岭段长城横跨山脊，城墙与敌楼清晰"
    ),
    cand(
      "cand-04",
      "1779720878128-d420ee3a17eb",
      "https://unsplash.com/photos/the-great-wall-of-china-winding-through-misty-mountains-xiWtfDawguc",
      "云雾山峦中的长城蜿蜒远景"
    ),
    cand(
      "cand-05",
      "1559827260-dc66d52bef19",
      "https://unsplash.com/photos/",
      "（线上现状）语义池当前 ID",
      "REJECTED",
      "用户截图反馈：预览卡显示海浪，与长城不符"
    ),
  ]),
  entry("天坛", "天坛", [
    cand(
      "cand-01",
      "1743841422310-d940f1dc7e2c",
      "https://unsplash.com/photos/the-temple-of-heaven-in-beijing-NmvW_uySAh0",
      "天坛祈年殿圆形三重檐，蓝天背景"
    ),
    cand(
      "cand-02",
      "1769953556286-ad1dd97c9320",
      "https://unsplash.com/photos/temple-of-heaven-with-many-people-on-stairs-B9k1_7GMboU",
      "祈年殿台阶与游客，建筑主体完整"
    ),
    cand(
      "cand-03",
      "1754258987207-77b13e528d30",
      "https://unsplash.com/photos/the-temple-of-heaven-beijing-china-973Fy3SkG_Y",
      "天坛建筑近景，地标识别度高"
    ),
    cand(
      "cand-04",
      "1747159458229-ae3c24b984d0",
      "https://unsplash.com/photos/the-temple-of-heaven-stands-majestically-in-beijing-U9PSovaILh8",
      "天坛全景，绿树环绕"
    ),
    cand(
      "cand-05",
      "1474181487882-5abf3f0ba6c2",
      "https://unsplash.com/photos/",
      "（线上现状）语义池当前 ID",
      "REJECTED",
      "用户截图反馈：城市夜景，非天坛"
    ),
  ]),
  entry("颐和园", "颐和园", [
    cand(
      "cand-01",
      "1573657860396-d7b1656adc53",
      "https://unsplash.com/photos/boats-on-body-of-water-near-summer-palace-under-white-and-blue-sky-G-wOu0GmNPA",
      "颐和园昆明湖游船，湖岸与佛香阁远景"
    ),
    cand(
      "cand-02",
      "1547036967-23d11aacaee0",
      "https://unsplash.com/photos/",
      "万寿山与昆明湖经典皇家园林湖面"
    ),
    cand(
      "cand-03",
      "1754119520553-0b5392981f4d",
      "https://unsplash.com/photos/sunset-casts-a-golden-glow-over-the-water-dPZ-kQUiPOs",
      "颐和园昆明湖日落，玉泉山剪影与金色水面"
    ),
    cand(
      "cand-04",
      "1506905925346-21bda4d32df4",
      "https://unsplash.com/photos/",
      "（线上现状）语义池当前 ID",
      "REJECTED",
      "用户截图反馈：雪山风景，非颐和园"
    ),
  ]),
  entry("圆明园", "圆明园", [
    cand(
      "cand-01",
      "1578662996442-48f60103fc96",
      "https://unsplash.com/photos/",
      "（线上现状）石砌废墟与园林水面",
      "PENDING",
      "Unsplash 上圆明园专属素材稀少；需人工确认画面是否为遗址公园"
    ),
    cand(
      "cand-02",
      "1573657860396-d7b1656adc53",
      "https://unsplash.com/photos/boats-on-body-of-water-near-summer-palace-under-white-and-blue-sky-G-wOu0GmNPA",
      "备选：北京西郊皇家园林湖面（实为颐和园，仅风格参考）",
      "REJECTED",
      "地点为颐和园昆明湖，不可用于圆明园"
    ),
    cand(
      "cand-03",
      "1680537006773-67878eb8b20a",
      "https://unsplash.com/photos/an-aerial-view-of-the-forbidden-city-of-china--UVRyZuDdQI",
      "备选：紫禁城鸟瞰",
      "REJECTED",
      "画面为故宫，不可用于圆明园"
    ),
  ]),
  entry("南锣鼓巷", "南锣鼓巷", [
    cand(
      "cand-01",
      "1772764058009-e6cb2203d773",
      "https://unsplash.com/photos/traditional-buildings-line-a-bustling-street-at-dusk-nu_WWrWUxM0",
      "北京胡同商业街黄昏：传统门面与行人"
    ),
    cand(
      "cand-02",
      "1516528387618-afa90b13e000",
      "https://unsplash.com/photos/",
      "（线上现状）灰砖胡同巷道，通用北京胡同图"
    ),
    cand(
      "cand-03",
      "1749532554703-0048b423d7a8",
      "https://unsplash.com/photos/a-quiet-street-scene-overarched-by-green-trees-kKw_zGmU6zI",
      "东城胡同绿树掩映的安静街巷（东四一带，风格接近南锣）"
    ),
    cand(
      "cand-04",
      "1516528387618-afa90b13e000",
      "https://unsplash.com/photos/red-and-white-textile-on-brown-wooden-door-ctuVvXUyjos",
      "胡同灰砖巷道（通用北京胡同素材）",
      "PENDING",
      "与 cand-02 同 CDN 帧"
    ),
  ]),
];

export function getPoiImageCandidateEntry(poiId: string): PoiImageVerificationEntry | undefined {
  return POI_IMAGE_CANDIDATE_ENTRIES.find((e) => e.poiId === poiId);
}
