/** Feed GET 查询 · geo / 锚点（② 前向兼容） */
export type CommunityFeedGeoQuery = {
  anchor_poi_id?: string;
  max_distance_m?: number;
  anchor_lat?: number;
  anchor_lng?: number;
};
