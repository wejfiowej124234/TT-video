-- F-OO-14～19 · Unified Campaign Center (SSOT-CAMPAIGN)

ALTER TABLE ops_cold_start_campaigns
    ADD COLUMN IF NOT EXISTS campaign_kind TEXT NOT NULL DEFAULT 'cold_start'
        CHECK (campaign_kind IN (
            'cold_start',
            'homepage',
            'market',
            'community',
            'festival',
            'holiday',
            'regional'
        ));

CREATE INDEX IF NOT EXISTS idx_ops_cold_start_campaigns_kind_status
    ON ops_cold_start_campaigns (campaign_kind, status, updated_at DESC);

ALTER TABLE ops_cold_start_items DROP CONSTRAINT IF EXISTS ops_cold_start_items_item_type_check;

ALTER TABLE ops_cold_start_items ADD CONSTRAINT ops_cold_start_items_item_type_check
    CHECK (item_type IN (
        'official_account',
        'guide_post',
        'itinerary_template',
        'referral_code',
        'featured_slot',
        'guide',
        'order',
        'market_listing',
        'community_post'
    ));
