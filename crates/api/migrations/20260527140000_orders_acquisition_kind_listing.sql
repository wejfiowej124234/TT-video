-- PD-009 L5：收购订单元数据落库（AQ-005 分池 SSOT）
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_kind TEXT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS market_listing_id UUID NULL
    REFERENCES market_listings (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_order_kind ON orders (order_kind)
    WHERE order_kind IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_market_listing_id ON orders (market_listing_id)
    WHERE market_listing_id IS NOT NULL;

COMMENT ON COLUMN orders.order_kind IS
    'Business order kind e.g. acquisition_listing, merchant_listing; NULL = legacy guide itinerary order.';
COMMENT ON COLUMN orders.market_listing_id IS
    'FK to market_listings when order originated from catalog listing POST …/listings/:id/orders.';
