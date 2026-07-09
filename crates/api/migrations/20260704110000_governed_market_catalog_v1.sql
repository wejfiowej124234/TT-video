-- PCP Phase 1 · Governed Public Views for Market catalog (MarketBuilder read path)
-- Governance: display_status + surface + schedule window.
-- DDG (data_origin, email heuristics, display_origin policy) remains in MarketBuilder query layer.

CREATE OR REPLACE VIEW governed_market_guides_v1 AS
SELECT *
FROM guides g
WHERE g.status = 'active'
  AND g.display_status = 'published'
  AND (
    cardinality(COALESCE(g.display_surfaces, '{}')) = 0
    OR 'market_feed' = ANY(COALESCE(g.display_surfaces, '{}'))
  )
  AND (g.display_start_at IS NULL OR g.display_start_at <= now())
  AND (g.display_end_at IS NULL OR g.display_end_at > now())
  AND lower(trim(g.city)) <> 'global';

CREATE OR REPLACE VIEW governed_market_listings_v1 AS
SELECT *
FROM market_listings m
WHERE m.status = 'published'
  AND m.display_status = 'published'
  AND (m.display_start_at IS NULL OR m.display_start_at <= now())
  AND (m.display_end_at IS NULL OR m.display_end_at > now());

CREATE OR REPLACE VIEW governed_discover_orders_v1 AS
SELECT *
FROM orders o
WHERE o.display_status = 'published'
  AND (
    cardinality(COALESCE(o.display_surfaces, '{}')) = 0
    OR 'market_feed' = ANY(COALESCE(o.display_surfaces, '{}'))
  )
  AND (o.display_start_at IS NULL OR o.display_start_at <= now())
  AND (o.display_end_at IS NULL OR o.display_end_at > now());

COMMENT ON VIEW governed_market_guides_v1 IS
  'PCP Governed Public View · market_feed · Database→Governance→MarketBuilder→GET /guides';
COMMENT ON VIEW governed_market_listings_v1 IS
  'PCP Governed Public View · market listings · Database→Governance→MarketBuilder→provider|acquisition';
COMMENT ON VIEW governed_discover_orders_v1 IS
  'PCP Governed Public View · discover orders · Database→Governance→MarketBuilder→GET /discover/orders';
