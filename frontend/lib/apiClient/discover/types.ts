export type DiscoverOrdersResult = {
  items: unknown[];
  page?: { limit: number; next_cursor: string | null; has_more: boolean };
};
