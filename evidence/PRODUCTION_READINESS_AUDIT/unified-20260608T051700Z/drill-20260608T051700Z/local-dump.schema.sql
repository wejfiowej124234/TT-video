--
-- PostgreSQL database dump
--

\restrict qO3weu4SeLwpxBLXqrcurwLoBI3ZglP3JT49tuYsROwHa7iLg05TCE6EfpykPju

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _sqlx_migrations; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public._sqlx_migrations (
    version bigint NOT NULL,
    description text NOT NULL,
    installed_on timestamp with time zone DEFAULT now() NOT NULL,
    success boolean NOT NULL,
    checksum bytea NOT NULL,
    execution_time bigint NOT NULL
);


ALTER TABLE public._sqlx_migrations OWNER TO traveltrust;

--
-- Name: admin_approval_requests; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.admin_approval_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text NOT NULL,
    requested_by uuid NOT NULL,
    approved_by uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    reason text,
    approve_reason text,
    before_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    after_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    approved_at timestamp with time zone
);


ALTER TABLE public.admin_approval_requests OWNER TO traveltrust;

--
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.admin_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action text NOT NULL,
    resource_type text,
    resource_id text,
    actor_id uuid NOT NULL,
    request_id text,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_audit_logs OWNER TO traveltrust;

--
-- Name: admin_console_roles; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.admin_console_roles (
    user_id uuid NOT NULL,
    console_role text NOT NULL,
    assigned_by uuid,
    assignment_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_console_roles_console_role_check CHECK ((console_role = ANY (ARRAY['SuperAdmin'::text, 'Ops'::text, 'CS'::text, 'Risk'::text, 'Finance'::text, 'Auditor'::text])))
);


ALTER TABLE public.admin_console_roles OWNER TO traveltrust;

--
-- Name: admin_data_policies; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.admin_data_policies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    policy_code text NOT NULL,
    scope_type text NOT NULL,
    scope_expr text,
    binding_role text NOT NULL,
    binding_resources text,
    status text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_data_policies_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'deprecated'::text])))
);


ALTER TABLE public.admin_data_policies OWNER TO traveltrust;

--
-- Name: admin_security_policies; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.admin_security_policies (
    policy_key text NOT NULL,
    policy_value jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_security_policies OWNER TO traveltrust;

--
-- Name: admin_sessions; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.admin_sessions (
    token text NOT NULL,
    admin_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone
);


ALTER TABLE public.admin_sessions OWNER TO traveltrust;

--
-- Name: admin_tenant_scopes; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.admin_tenant_scopes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_key text NOT NULL,
    region_code text NOT NULL,
    scope_class text NOT NULL,
    status text NOT NULL,
    notes text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    CONSTRAINT admin_tenant_scopes_class_check CHECK ((scope_class = ANY (ARRAY['data_residency'::text, 'ops'::text, 'feature'::text, 'network'::text]))),
    CONSTRAINT admin_tenant_scopes_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'sunset'::text])))
);


ALTER TABLE public.admin_tenant_scopes OWNER TO traveltrust;

--
-- Name: admin_totp_enrollments; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.admin_totp_enrollments (
    user_id uuid NOT NULL,
    secret_base32 text NOT NULL,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_totp_enrollments OWNER TO traveltrust;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.admin_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text,
    role text DEFAULT 'admin'::text NOT NULL,
    mfa_enabled boolean DEFAULT false NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_users OWNER TO traveltrust;

--
-- Name: airdrop_allocations; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.airdrop_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid NOT NULL,
    user_id uuid NOT NULL,
    points bigint NOT NULL,
    gov_amount numeric(38,0) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    tx_hash text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT airdrop_allocations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'distributed'::text, 'revoked'::text])))
);


ALTER TABLE public.airdrop_allocations OWNER TO traveltrust;

--
-- Name: airdrop_campaigns; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.airdrop_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    gov_pool_amount numeric(38,0) NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    snapshot_at timestamp with time zone,
    network_points_total bigint,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    snapshot_user_count bigint,
    eligible_points_total bigint,
    calculation_version integer DEFAULT 0 NOT NULL,
    CONSTRAINT airdrop_campaigns_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'snapshot_locked'::text, 'calculated'::text, 'approved'::text, 'distributed'::text, 'cancelled'::text])))
);


ALTER TABLE public.airdrop_campaigns OWNER TO traveltrust;

--
-- Name: airdrop_snapshots; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.airdrop_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid NOT NULL,
    user_id uuid NOT NULL,
    points_at_snapshot bigint NOT NULL,
    referral_invites bigint DEFAULT 0 NOT NULL,
    referral_points_awarded bigint DEFAULT 0 NOT NULL,
    early_bird_stage integer,
    early_bird_multiplier numeric(4,2),
    growth_registration_rank bigint,
    growth_fraud_status text DEFAULT 'normal'::text NOT NULL,
    eligible boolean DEFAULT true NOT NULL
);


ALTER TABLE public.airdrop_snapshots OWNER TO traveltrust;

--
-- Name: api_versions; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.api_versions (
    api_version text NOT NULL,
    status text NOT NULL,
    released_at timestamp with time zone,
    deprecated_at timestamp with time zone,
    sunset_at timestamp with time zone,
    compat_window_days integer DEFAULT 0 NOT NULL,
    active_client_ratio_7d double precision,
    request_count_7d bigint DEFAULT 0 NOT NULL,
    last_change_at timestamp with time zone DEFAULT now() NOT NULL,
    last_change_by text,
    CONSTRAINT api_versions_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'active'::text, 'deprecated'::text, 'sunset'::text])))
);


ALTER TABLE public.api_versions OWNER TO traveltrust;

--
-- Name: async_jobs; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.async_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    queue_name text DEFAULT 'default'::text NOT NULL,
    job_type text NOT NULL,
    status text NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 8 NOT NULL,
    last_error text,
    payload_ref text,
    idempotency_key text,
    scheduled_for timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT async_jobs_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text, 'dead_letter'::text, 'cancelled'::text])))
);


ALTER TABLE public.async_jobs OWNER TO traveltrust;

--
-- Name: auth_audit_events; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.auth_audit_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    user_id uuid,
    request_id text,
    client_ip text,
    user_agent text,
    reason text,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.auth_audit_events OWNER TO traveltrust;

--
-- Name: auth_email_send_window_events; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.auth_email_send_window_events (
    id bigint NOT NULL,
    bucket text NOT NULL,
    email_key text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.auth_email_send_window_events OWNER TO traveltrust;

--
-- Name: auth_email_send_window_events_id_seq; Type: SEQUENCE; Schema: public; Owner: traveltrust
--

CREATE SEQUENCE public.auth_email_send_window_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auth_email_send_window_events_id_seq OWNER TO traveltrust;

--
-- Name: auth_email_send_window_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: traveltrust
--

ALTER SEQUENCE public.auth_email_send_window_events_id_seq OWNED BY public.auth_email_send_window_events.id;


--
-- Name: auth_email_tokens; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.auth_email_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    purpose text NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT auth_email_tokens_purpose_check CHECK ((purpose = ANY (ARRAY['email_verify'::text, 'password_reset'::text])))
);


ALTER TABLE public.auth_email_tokens OWNER TO traveltrust;

--
-- Name: backfill_jobs; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.backfill_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id text NOT NULL,
    scope text NOT NULL,
    progress double precision DEFAULT 0 NOT NULL,
    error_count bigint DEFAULT 0 NOT NULL,
    status text NOT NULL,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.backfill_jobs OWNER TO traveltrust;

--
-- Name: catalog_cities; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.catalog_cities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    country_id uuid NOT NULL,
    slug text NOT NULL,
    name_zh text NOT NULL,
    name_en text NOT NULL,
    region_label text,
    sort_order integer DEFAULT 0 NOT NULL,
    open_status text DEFAULT 'open'::text NOT NULL,
    publish_status text DEFAULT 'draft'::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    import_batch_id uuid,
    CONSTRAINT catalog_cities_open_status_check CHECK ((open_status = ANY (ARRAY['open'::text, 'closed'::text, 'preview'::text]))),
    CONSTRAINT catalog_cities_publish_status_check CHECK ((publish_status = ANY (ARRAY['draft'::text, 'in_review'::text, 'published'::text, 'archived'::text])))
);


ALTER TABLE public.catalog_cities OWNER TO traveltrust;

--
-- Name: catalog_content_revisions; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.catalog_content_revisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    version integer NOT NULL,
    before_json jsonb,
    after_json jsonb,
    actor_id uuid,
    action text NOT NULL,
    request_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT catalog_content_revisions_entity_type_check CHECK ((entity_type = ANY (ARRAY['catalog_countries'::text, 'catalog_cities'::text, 'catalog_pois'::text, 'catalog_intercity_routes'::text, 'catalog_pricing_templates'::text, 'catalog_hotel_tier_definitions'::text, 'catalog_transport_region_rules'::text, 'catalog_media_assets'::text, 'catalog_poi_image_batches'::text, 'catalog_poi_images_published'::text])))
);


ALTER TABLE public.catalog_content_revisions OWNER TO traveltrust;

--
-- Name: catalog_countries; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.catalog_countries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    iso3166 character(2) NOT NULL,
    name_zh text NOT NULL,
    name_en text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    open_status text DEFAULT 'open'::text NOT NULL,
    publish_status text DEFAULT 'draft'::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    import_batch_id uuid,
    CONSTRAINT catalog_countries_open_status_check CHECK ((open_status = ANY (ARRAY['open'::text, 'closed'::text, 'preview'::text]))),
    CONSTRAINT catalog_countries_publish_status_check CHECK ((publish_status = ANY (ARRAY['draft'::text, 'in_review'::text, 'published'::text, 'archived'::text])))
);


ALTER TABLE public.catalog_countries OWNER TO traveltrust;

--
-- Name: catalog_hotel_tier_definitions; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.catalog_hotel_tier_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tier_code text NOT NULL,
    sort_order integer NOT NULL,
    multiplier numeric(4,2) DEFAULT 1.00 NOT NULL,
    label_key text NOT NULL,
    description_key text NOT NULL,
    submit_label_zh text NOT NULL,
    stock_image_asset_id uuid,
    publish_status text DEFAULT 'published'::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    import_batch_id uuid,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT catalog_hotel_tier_definitions_publish_status_check CHECK ((publish_status = ANY (ARRAY['draft'::text, 'in_review'::text, 'published'::text, 'archived'::text]))),
    CONSTRAINT catalog_hotel_tier_definitions_tier_code_check CHECK ((tier_code = ANY (ARRAY['tier_economy'::text, 'tier_comfort'::text, 'tier_luxury'::text])))
);


ALTER TABLE public.catalog_hotel_tier_definitions OWNER TO traveltrust;

--
-- Name: catalog_intercity_routes; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.catalog_intercity_routes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_city_id uuid NOT NULL,
    to_city_id uuid NOT NULL,
    mode text NOT NULL,
    duration_min integer,
    price_ref_cents bigint,
    rules_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    publish_status text DEFAULT 'draft'::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    import_batch_id uuid,
    CONSTRAINT catalog_intercity_routes_from_to_distinct_check CHECK ((from_city_id <> to_city_id)),
    CONSTRAINT catalog_intercity_routes_mode_check CHECK ((mode = ANY (ARRAY['flight'::text, 'rail'::text]))),
    CONSTRAINT catalog_intercity_routes_publish_status_check CHECK ((publish_status = ANY (ARRAY['draft'::text, 'in_review'::text, 'published'::text, 'archived'::text])))
);


ALTER TABLE public.catalog_intercity_routes OWNER TO traveltrust;

--
-- Name: catalog_media_assets; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.catalog_media_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_kind text NOT NULL,
    source_type text NOT NULL,
    url text NOT NULL,
    source_page_url text,
    license jsonb DEFAULT '{}'::jsonb NOT NULL,
    alt_text_zh text,
    alt_text_en text,
    stock_pool_key text,
    country_id uuid,
    city_id uuid,
    poi_id uuid,
    publish_status text DEFAULT 'draft'::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    import_batch_id uuid,
    created_by uuid,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT catalog_media_assets_asset_kind_check CHECK ((asset_kind = ANY (ARRAY['poi_hero'::text, 'landing_ambient'::text, 'hotel_tier_stock'::text, 'transport_stock'::text, 'generic'::text]))),
    CONSTRAINT catalog_media_assets_publish_status_check CHECK ((publish_status = ANY (ARRAY['draft'::text, 'in_review'::text, 'published'::text, 'archived'::text]))),
    CONSTRAINT catalog_media_assets_source_type_check CHECK ((source_type = ANY (ARRAY['unsplash'::text, 'upload'::text, 'external_url'::text])))
);


ALTER TABLE public.catalog_media_assets OWNER TO traveltrust;

--
-- Name: catalog_poi_image_batches; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.catalog_poi_image_batches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    city_id uuid,
    batch_name text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    country_id uuid,
    poi_kind text DEFAULT 'attraction'::text NOT NULL,
    selected_candidate_id uuid,
    notes text,
    started_at timestamp with time zone,
    import_batch_id uuid,
    version integer DEFAULT 1 NOT NULL,
    CONSTRAINT catalog_poi_image_batches_poi_kind_check CHECK ((poi_kind = ANY (ARRAY['attraction'::text, 'food'::text]))),
    CONSTRAINT catalog_poi_image_batches_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'generating'::text, 'review'::text, 'published'::text, 'archived'::text])))
);


ALTER TABLE public.catalog_poi_image_batches OWNER TO traveltrust;

--
-- Name: catalog_poi_image_candidates; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.catalog_poi_image_candidates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    batch_id uuid NOT NULL,
    poi_id uuid NOT NULL,
    candidate_url text NOT NULL,
    source text,
    rank integer DEFAULT 0 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    source_page_url text,
    scene_description text,
    license text,
    review_status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    import_batch_id uuid,
    CONSTRAINT catalog_poi_image_candidates_review_status_check CHECK ((review_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.catalog_poi_image_candidates OWNER TO traveltrust;

--
-- Name: catalog_poi_images_published; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.catalog_poi_images_published (
    poi_id uuid NOT NULL,
    image_url text NOT NULL,
    batch_id uuid,
    published_by uuid,
    published_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    scene_description text,
    source_page_url text,
    license text,
    approved_candidate_id uuid,
    media_asset_id uuid,
    import_batch_id uuid,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.catalog_poi_images_published OWNER TO traveltrust;

--
-- Name: catalog_pois; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.catalog_pois (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    city_id uuid NOT NULL,
    poi_type text NOT NULL,
    slug text NOT NULL,
    name_zh text NOT NULL,
    name_en text NOT NULL,
    description_zh text,
    description_en text,
    tier text,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    publish_status text DEFAULT 'draft'::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    legacy_value text,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    import_batch_id uuid,
    CONSTRAINT catalog_pois_poi_type_check CHECK ((poi_type = ANY (ARRAY['attraction'::text, 'hotel'::text, 'food'::text]))),
    CONSTRAINT catalog_pois_publish_status_check CHECK ((publish_status = ANY (ARRAY['draft'::text, 'in_review'::text, 'published'::text, 'archived'::text])))
);


ALTER TABLE public.catalog_pois OWNER TO traveltrust;

--
-- Name: catalog_pricing_templates; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.catalog_pricing_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    country_id uuid NOT NULL,
    currency_code character(3) DEFAULT 'CNY'::bpchar NOT NULL,
    city_transport_price jsonb NOT NULL,
    intercity_price_per_person jsonb NOT NULL,
    per_attraction_cents bigint NOT NULL,
    per_food_cents bigint NOT NULL,
    hotel_base_per_night_cents bigint NOT NULL,
    guide_levels_per_day jsonb NOT NULL,
    publish_status text DEFAULT 'draft'::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    import_batch_id uuid,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT catalog_pricing_templates_hotel_base_per_night_cents_check CHECK ((hotel_base_per_night_cents >= 0)),
    CONSTRAINT catalog_pricing_templates_per_attraction_cents_check CHECK ((per_attraction_cents >= 0)),
    CONSTRAINT catalog_pricing_templates_per_food_cents_check CHECK ((per_food_cents >= 0)),
    CONSTRAINT catalog_pricing_templates_publish_status_check CHECK ((publish_status = ANY (ARRAY['draft'::text, 'in_review'::text, 'published'::text, 'archived'::text])))
);


ALTER TABLE public.catalog_pricing_templates OWNER TO traveltrust;

--
-- Name: catalog_transport_region_rules; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.catalog_transport_region_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    country_id uuid NOT NULL,
    default_modes text[] NOT NULL,
    rail_ui_label_key text,
    flight_ui_label_key text,
    notes text,
    publish_status text DEFAULT 'draft'::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    import_batch_id uuid,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT catalog_transport_region_rules_publish_status_check CHECK ((publish_status = ANY (ARRAY['draft'::text, 'in_review'::text, 'published'::text, 'archived'::text])))
);


ALTER TABLE public.catalog_transport_region_rules OWNER TO traveltrust;

--
-- Name: checkpoints_sharded; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.checkpoints_sharded (
    consumer_id text NOT NULL,
    chain_id bigint NOT NULL,
    block_number bigint NOT NULL,
    log_index integer NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.checkpoints_sharded OWNER TO traveltrust;

--
-- Name: community_abuse_policy; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_abuse_policy (
    id smallint DEFAULT 1 NOT NULL,
    comment_rate_window_sec integer DEFAULT 60 NOT NULL,
    comment_max_per_window integer DEFAULT 30 NOT NULL,
    comment_min_interval_sec integer DEFAULT 2 NOT NULL,
    comment_duplicate_lookback_sec integer DEFAULT 86400 NOT NULL,
    post_rate_window_sec integer DEFAULT 600 NOT NULL,
    post_max_per_window integer DEFAULT 15 NOT NULL,
    post_min_interval_sec integer DEFAULT 5 NOT NULL,
    post_duplicate_lookback_sec integer DEFAULT 86400 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    report_rate_window_sec integer DEFAULT 3600 NOT NULL,
    report_max_per_window integer DEFAULT 30 NOT NULL,
    report_min_interval_sec integer DEFAULT 15 NOT NULL,
    report_duplicate_target_lookback_sec integer DEFAULT 604800 NOT NULL,
    CONSTRAINT chk_c_dup CHECK (((comment_duplicate_lookback_sec >= 0) AND (comment_duplicate_lookback_sec <= 2592000))),
    CONSTRAINT chk_c_max CHECK (((comment_max_per_window >= 1) AND (comment_max_per_window <= 2000))),
    CONSTRAINT chk_c_minint CHECK (((comment_min_interval_sec >= 0) AND (comment_min_interval_sec <= 3600))),
    CONSTRAINT chk_c_rw CHECK (((comment_rate_window_sec >= 10) AND (comment_rate_window_sec <= 86400))),
    CONSTRAINT chk_p_dup CHECK (((post_duplicate_lookback_sec >= 0) AND (post_duplicate_lookback_sec <= 2592000))),
    CONSTRAINT chk_p_max CHECK (((post_max_per_window >= 1) AND (post_max_per_window <= 500))),
    CONSTRAINT chk_p_minint CHECK (((post_min_interval_sec >= 0) AND (post_min_interval_sec <= 86400))),
    CONSTRAINT chk_p_rw CHECK (((post_rate_window_sec >= 60) AND (post_rate_window_sec <= 86400))),
    CONSTRAINT chk_report_dup_tgt CHECK (((report_duplicate_target_lookback_sec >= 0) AND (report_duplicate_target_lookback_sec <= 7776000))),
    CONSTRAINT chk_report_max CHECK (((report_max_per_window >= 1) AND (report_max_per_window <= 500))),
    CONSTRAINT chk_report_minint CHECK (((report_min_interval_sec >= 0) AND (report_min_interval_sec <= 86400))),
    CONSTRAINT chk_report_rw CHECK (((report_rate_window_sec >= 60) AND (report_rate_window_sec <= 2592000))),
    CONSTRAINT community_abuse_policy_id_check CHECK ((id = 1))
);


ALTER TABLE public.community_abuse_policy OWNER TO traveltrust;

--
-- Name: community_collects; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_collects (
    user_id uuid NOT NULL,
    post_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.community_collects OWNER TO traveltrust;

--
-- Name: community_comments; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    parent_id uuid,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    visibility_status text DEFAULT 'visible'::text NOT NULL,
    risk_level smallint DEFAULT 0 NOT NULL,
    CONSTRAINT community_comments_visibility_check CHECK ((visibility_status = ANY (ARRAY['visible'::text, 'hidden'::text, 'removed'::text])))
);


ALTER TABLE public.community_comments OWNER TO traveltrust;

--
-- Name: community_conversations; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user1_id uuid NOT NULL,
    user2_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_conv_order CHECK ((user1_id < user2_id))
);


ALTER TABLE public.community_conversations OWNER TO traveltrust;

--
-- Name: community_dm_messages; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_dm_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.community_dm_messages OWNER TO traveltrust;

--
-- Name: community_dm_read_state; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_dm_read_state (
    user_id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    last_read_at timestamp with time zone DEFAULT '-infinity'::timestamp with time zone NOT NULL
);


ALTER TABLE public.community_dm_read_state OWNER TO traveltrust;

--
-- Name: community_feedback; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category text DEFAULT 'other'::text NOT NULL,
    content text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    official_reply text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    media_urls text[] DEFAULT '{}'::text[] NOT NULL
);


ALTER TABLE public.community_feedback OWNER TO traveltrust;

--
-- Name: community_follows; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_follows (
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_follow_not_self CHECK ((follower_id <> following_id))
);


ALTER TABLE public.community_follows OWNER TO traveltrust;

--
-- Name: community_friend_requests; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_friend_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.community_friend_requests OWNER TO traveltrust;

--
-- Name: community_friends; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_friends (
    user_id uuid NOT NULL,
    friend_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_friends_not_self CHECK ((user_id <> friend_id))
);


ALTER TABLE public.community_friends OWNER TO traveltrust;

--
-- Name: community_likes; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_likes (
    user_id uuid NOT NULL,
    post_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.community_likes OWNER TO traveltrust;

--
-- Name: community_media_assets; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_media_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_user_id uuid NOT NULL,
    object_key text NOT NULL,
    content_type text NOT NULL,
    byte_length bigint NOT NULL,
    part_size_bytes bigint NOT NULL,
    part_count integer NOT NULL,
    sha256_hex text,
    state text NOT NULL,
    duration_ms integer,
    width integer,
    height integer,
    cover_object_key text,
    playback_url text,
    playback_manifest_json jsonb,
    s3_multipart_upload_id text,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT community_media_assets_byte_length_check CHECK ((byte_length > 0)),
    CONSTRAINT community_media_assets_part_count_check CHECK (((part_count > 0) AND (part_count <= 10000))),
    CONSTRAINT community_media_assets_part_size_bytes_check CHECK ((part_size_bytes > 0)),
    CONSTRAINT community_media_assets_sha256_hex_len CHECK (((sha256_hex IS NULL) OR (char_length(sha256_hex) = 64))),
    CONSTRAINT community_media_assets_state_check CHECK ((state = ANY (ARRAY['pending_upload'::text, 'uploaded'::text, 'processing'::text, 'ready'::text, 'failed'::text])))
);


ALTER TABLE public.community_media_assets OWNER TO traveltrust;

--
-- Name: TABLE community_media_assets; Type: COMMENT; Schema: public; Owner: traveltrust
--

COMMENT ON TABLE public.community_media_assets IS '270 / 社区：对象存储直传媒体元数据；state=ready 且 playback_url 填齐后方可绑定公开视频帖';


--
-- Name: COLUMN community_media_assets.playback_manifest_json; Type: COMMENT; Schema: public; Owner: traveltrust
--

COMMENT ON COLUMN public.community_media_assets.playback_manifest_json IS '预留：HLS/DASH manifest 或自适应流描述 JSON；Phase1 可为 NULL';


--
-- Name: community_moderation_cases; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_moderation_cases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    report_id uuid NOT NULL,
    actor_id uuid NOT NULL,
    status_before text NOT NULL,
    status_after text NOT NULL,
    admin_notes_snapshot text,
    disposition_snapshot text,
    penalty_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.community_moderation_cases OWNER TO traveltrust;

--
-- Name: community_penalties; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_penalties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    report_id uuid,
    subject_user_id uuid NOT NULL,
    action text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    reason text,
    created_by uuid NOT NULL,
    expires_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT community_penalties_action_check CHECK ((action = ANY (ARRAY['warn'::text, 'limit_feed'::text, 'mute'::text, 'ban'::text, 'shadow_ban'::text, 'content_remove'::text, 'other'::text]))),
    CONSTRAINT community_penalties_status_check CHECK ((status = ANY (ARRAY['active'::text, 'lifted'::text, 'superseded'::text])))
);


ALTER TABLE public.community_penalties OWNER TO traveltrust;

--
-- Name: community_policy_change_logs; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_policy_change_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_id uuid,
    scope text DEFAULT 'community_abuse_policy'::text NOT NULL,
    summary text NOT NULL,
    before_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    after_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    source text DEFAULT 'admin_api'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT community_policy_change_logs_source_check CHECK ((source = ANY (ARRAY['migration'::text, 'sql'::text, 'admin_api'::text, 'system'::text])))
);


ALTER TABLE public.community_policy_change_logs OWNER TO traveltrust;

--
-- Name: community_posts; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    body text DEFAULT ''::text NOT NULL,
    post_type text DEFAULT 'photo'::text NOT NULL,
    destination text,
    tags text[] DEFAULT '{}'::text[],
    media_urls text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    visibility_status text DEFAULT 'public'::text NOT NULL,
    cover_url text,
    commerce_showcase_kind text,
    commerce_market_listing_id uuid,
    primary_media_asset_id uuid,
    data_origin text DEFAULT 'production'::text NOT NULL,
    content_tier text DEFAULT 'ugc'::text NOT NULL,
    official_account_id uuid,
    CONSTRAINT community_posts_commerce_showcase_kind_check CHECK (((commerce_showcase_kind IS NULL) OR (commerce_showcase_kind = ANY (ARRAY['itinerary_led'::text, 'lodging_led'::text, 'acquisition_led'::text, 'general_led'::text])))),
    CONSTRAINT community_posts_content_tier_check CHECK ((content_tier = ANY (ARRAY['ugc'::text, 'official_seed'::text, 'official'::text]))),
    CONSTRAINT community_posts_data_origin_check CHECK ((data_origin = ANY (ARRAY['production'::text, 'test'::text, 'demo'::text]))),
    CONSTRAINT community_posts_visibility_status_check CHECK ((visibility_status = ANY (ARRAY['public'::text, 'private'::text, 'archived'::text])))
);


ALTER TABLE public.community_posts OWNER TO traveltrust;

--
-- Name: COLUMN community_posts.commerce_showcase_kind; Type: COMMENT; Schema: public; Owner: traveltrust
--

COMMENT ON COLUMN public.community_posts.commerce_showcase_kind IS 'Authoritative My Products showcase line; null = clients may infer heuristically.';


--
-- Name: COLUMN community_posts.commerce_market_listing_id; Type: COMMENT; Schema: public; Owner: traveltrust
--

COMMENT ON COLUMN public.community_posts.commerce_market_listing_id IS 'Optional FK to published market_listings row owned by the same user at post time.';


--
-- Name: community_ranking_snapshots; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_ranking_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feed_mode text NOT NULL,
    item_count integer DEFAULT 0 NOT NULL,
    top_post_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT community_ranking_snapshots_mode_check CHECK ((feed_mode = ANY (ARRAY['hot'::text, 'recommend'::text, 'latest'::text])))
);


ALTER TABLE public.community_ranking_snapshots OWNER TO traveltrust;

--
-- Name: community_report_appeals; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_report_appeals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    report_id uuid NOT NULL,
    appellant_id uuid NOT NULL,
    body text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewer_note text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone,
    CONSTRAINT community_report_appeals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])))
);


ALTER TABLE public.community_report_appeals OWNER TO traveltrust;

--
-- Name: community_reports; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporter_id uuid NOT NULL,
    target_type text NOT NULL,
    target_id uuid NOT NULL,
    reason_code text NOT NULL,
    details text,
    evidence_ref text,
    status text DEFAULT 'open'::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    admin_notes text,
    disposition text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT community_reports_reason_check CHECK ((reason_code = ANY (ARRAY['spam'::text, 'harassment'::text, 'scam'::text, 'illegal'::text, 'hate'::text, 'other'::text]))),
    CONSTRAINT community_reports_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_review'::text, 'resolved'::text, 'dismissed'::text]))),
    CONSTRAINT community_reports_target_type_check CHECK ((target_type = ANY (ARRAY['post'::text, 'user'::text, 'comment'::text, 'message'::text, 'other'::text])))
);


ALTER TABLE public.community_reports OWNER TO traveltrust;

--
-- Name: community_risk_signals; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.community_risk_signals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject_user_id uuid NOT NULL,
    signal_type text NOT NULL,
    rule_id text DEFAULT 'community_abuse'::text NOT NULL,
    severity text DEFAULT 'low'::text NOT NULL,
    context jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT community_risk_signals_severity_check CHECK ((severity = ANY (ARRAY['info'::text, 'low'::text, 'medium'::text, 'high'::text])))
);


ALTER TABLE public.community_risk_signals OWNER TO traveltrust;

--
-- Name: compliance_data_request_events; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.compliance_data_request_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    event_type text NOT NULL,
    event_detail text,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.compliance_data_request_events OWNER TO traveltrust;

--
-- Name: compliance_data_requests; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.compliance_data_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_ref text NOT NULL,
    subject_id text NOT NULL,
    request_type text NOT NULL,
    status text NOT NULL,
    due_at timestamp with time zone,
    sla_hours integer,
    jurisdiction text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    export_signature text,
    record_hash_fingerprint text,
    CONSTRAINT compliance_data_requests_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'completed'::text, 'rejected'::text, 'cancelled'::text]))),
    CONSTRAINT compliance_data_requests_type_check CHECK ((request_type = ANY (ARRAY['export'::text, 'erasure'::text])))
);


ALTER TABLE public.compliance_data_requests OWNER TO traveltrust;

--
-- Name: config_releases; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.config_releases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    release_key text NOT NULL,
    version_label text NOT NULL,
    status text NOT NULL,
    effective_from timestamp with time zone,
    rolled_back_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT config_releases_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'rolled_back'::text])))
);


ALTER TABLE public.config_releases OWNER TO traveltrust;

--
-- Name: correction_log; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.correction_log (
    id bigint NOT NULL,
    order_id bytea NOT NULL,
    chain_id bigint NOT NULL,
    correction_type text NOT NULL,
    reason text,
    payload jsonb,
    approved_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.correction_log OWNER TO traveltrust;

--
-- Name: correction_log_id_seq; Type: SEQUENCE; Schema: public; Owner: traveltrust
--

CREATE SEQUENCE public.correction_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.correction_log_id_seq OWNER TO traveltrust;

--
-- Name: correction_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: traveltrust
--

ALTER SEQUENCE public.correction_log_id_seq OWNED BY public.correction_log.id;


--
-- Name: did_rank_rank_snapshots; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.did_rank_rank_snapshots (
    cache_key text NOT NULL,
    ranks_json jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.did_rank_rank_snapshots OWNER TO traveltrust;

--
-- Name: disputes; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.disputes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    status text NOT NULL,
    evidence_hashes jsonb DEFAULT '[]'::jsonb NOT NULL,
    arbitrator_id uuid,
    refund_ratio numeric,
    slash_guide boolean,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    arb_fee_paid text,
    dispute_sequence integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.disputes OWNER TO traveltrust;

--
-- Name: dual_write_checks; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.dual_write_checks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    check_id text NOT NULL,
    old_digest text,
    new_digest text,
    diff_count bigint DEFAULT 0 NOT NULL,
    status text NOT NULL,
    checked_at timestamp with time zone,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.dual_write_checks OWNER TO traveltrust;

--
-- Name: early_bird_stages; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.early_bird_stages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    stage_number integer NOT NULL,
    user_rank_from integer NOT NULL,
    user_rank_to integer,
    multiplier numeric(4,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.early_bird_stages OWNER TO traveltrust;

--
-- Name: event_log; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.event_log (
    id bigint NOT NULL,
    chain_id bigint NOT NULL,
    block_number bigint NOT NULL,
    block_hash bytea NOT NULL,
    tx_hash bytea NOT NULL,
    log_index integer NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    finality_n_used integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    track_type text DEFAULT 'legacy_backfill'::text NOT NULL,
    CONSTRAINT event_log_track_type_check CHECK ((track_type = ANY (ARRAY['A'::text, 'B'::text, 'Escrow'::text, 'Staking'::text, 'Vault'::text, 'legacy_backfill'::text])))
);


ALTER TABLE public.event_log OWNER TO traveltrust;

--
-- Name: COLUMN event_log.track_type; Type: COMMENT; Schema: public; Owner: traveltrust
--

COMMENT ON COLUMN public.event_log.track_type IS 'Rail: A | B | Escrow | Staking | Vault | legacy_backfill (pre-migration rows)';


--
-- Name: event_log_id_seq; Type: SEQUENCE; Schema: public; Owner: traveltrust
--

CREATE SEQUENCE public.event_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_log_id_seq OWNER TO traveltrust;

--
-- Name: event_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: traveltrust
--

ALTER SEQUENCE public.event_log_id_seq OWNED BY public.event_log.id;


--
-- Name: evidence_receipts; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.evidence_receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    uploader_id uuid NOT NULL,
    content_hash character varying(128) NOT NULL,
    schema_version character varying(64),
    prompt_version character varying(64),
    snapshot_hash character varying(128),
    quote_hash character varying(128),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.evidence_receipts OWNER TO traveltrust;

--
-- Name: executor_executions; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.executor_executions (
    resolution_id bytea NOT NULL,
    order_id bytea NOT NULL,
    chain_id bigint NOT NULL,
    escrow_address bytea NOT NULL,
    resolution_type text NOT NULL,
    tx_hash bytea,
    status text NOT NULL,
    approved_by text,
    snapshot_hash bytea,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.executor_executions OWNER TO traveltrust;

--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    flag_code text NOT NULL,
    description text,
    scope text DEFAULT 'global'::text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    rollout_percent integer DEFAULT 0 NOT NULL,
    region text,
    version bigint DEFAULT 1 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT feature_flags_rollout_check CHECK (((rollout_percent >= 0) AND (rollout_percent <= 100)))
);


ALTER TABLE public.feature_flags OWNER TO traveltrust;

--
-- Name: fee_router_routed_events; Type: TABLE; Schema: public; Owner: traveltrust
--

CREATE TABLE public.fee_router_routed_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chain_id bigint NOT NULL,
    block_number bigint NOT NULL,
    log_index integer NOT NULL,
    block_hash text DEFAULT ''::text NOT NULL,
    tx_hash text NOT NULL,
    router_address text NOT NULL,
    token_address text NOT NULL,
    amount_u256_hex text NOT NULL,
    to_country_u256_hex text NOT NULL,
    to_stakers_u256_hex text NOT NULL,
    to_reserve_u256_hex text NOT NULL,
