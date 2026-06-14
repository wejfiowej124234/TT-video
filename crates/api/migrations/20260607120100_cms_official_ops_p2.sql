-- 101 v1.1.0 · S1 · P2 Official OPS ops_* 表族 + community_posts 扩展

CREATE TABLE IF NOT EXISTS ops_official_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    account_kind TEXT NOT NULL CHECK (
        account_kind IN ('traveler', 'guide', 'merchant', 'community_author')
    ),
    display_label TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    showcase_eligible BOOLEAN NOT NULL DEFAULT true,
    data_origin TEXT NOT NULL DEFAULT 'official_seed'
        CHECK (data_origin IN ('production', 'test', 'demo', 'official_seed')),
    linked_guide_id UUID REFERENCES guides (id) ON DELETE SET NULL,
    linked_provider_app UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops_official_itinerary_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    country_iso CHAR(2),
    city_id UUID REFERENCES catalog_cities (id) ON DELETE SET NULL,
    days_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    budget_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    cover_image_url TEXT,
    author_account_id UUID REFERENCES ops_official_accounts (id) ON DELETE SET NULL,
    publish_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (publish_status IN ('draft', 'in_review', 'published', 'archived')),
    data_origin TEXT NOT NULL DEFAULT 'official_seed',
    linked_order_id UUID REFERENCES orders (id) ON DELETE SET NULL,
    version INT NOT NULL DEFAULT 1,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops_official_guide_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_post_id UUID UNIQUE REFERENCES community_posts (id) ON DELETE SET NULL,
    author_account_id UUID NOT NULL REFERENCES ops_official_accounts (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    destination TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    cover_url TEXT,
    featured BOOLEAN NOT NULL DEFAULT false,
    publish_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (publish_status IN ('draft', 'in_review', 'published', 'archived')),
    data_origin TEXT NOT NULL DEFAULT 'official_seed',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops_cold_start_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'in_review', 'deployed', 'rolled_back', 'archived')),
    surfaces TEXT[] NOT NULL DEFAULT '{}',
    publish_status TEXT NOT NULL DEFAULT 'draft'
        CHECK (publish_status IN ('draft', 'in_review', 'published', 'archived')),
    version INT NOT NULL DEFAULT 1,
    deployed_at TIMESTAMPTZ,
    rolled_back_at TIMESTAMPTZ,
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ops_cold_start_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES ops_cold_start_campaigns (id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (
        item_type IN (
            'official_account',
            'guide_post',
            'itinerary_template',
            'referral_code',
            'featured_slot'
        )
    ),
    item_ref_id UUID,
    sort_order INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'rolled_back', 'archived')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_cold_start_items_campaign
    ON ops_cold_start_items (campaign_id, sort_order);

ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS content_tier TEXT NOT NULL DEFAULT 'ugc'
        CHECK (content_tier IN ('ugc', 'official_seed', 'official')),
    ADD COLUMN IF NOT EXISTS official_account_id UUID
        REFERENCES ops_official_accounts (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_community_posts_content_tier
    ON community_posts (content_tier);

CREATE INDEX IF NOT EXISTS idx_guides_data_origin ON guides (data_origin);

CREATE INDEX IF NOT EXISTS idx_market_listings_data_origin ON market_listings (data_origin);
