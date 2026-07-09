-- PCP Phase 1 Batch 2 · Governed Public Views for Campaign surfaces (CampaignBuilder read path)
-- Governance: deploy workflow (status + publish_status + deployed_at).
-- Item ref eligibility (OCS/DDG entity checks) remains in CampaignBuilder resolve layer.

CREATE OR REPLACE VIEW governed_campaign_surfaces_v1 AS
SELECT *
FROM ops_cold_start_campaigns c
WHERE c.status = 'deployed'
  AND c.publish_status = 'published'
  AND c.deployed_at IS NOT NULL;

CREATE OR REPLACE VIEW governed_campaign_items_v1 AS
SELECT i.*
FROM ops_cold_start_items i
INNER JOIN governed_campaign_surfaces_v1 c ON c.id = i.campaign_id
WHERE i.status = 'active';

COMMENT ON VIEW governed_campaign_surfaces_v1 IS
  'PCP Governed Public View · deployed campaigns · Database→Governance→CampaignBuilder→GET /official/cold-start/surfaces/*';
COMMENT ON VIEW governed_campaign_items_v1 IS
  'PCP Governed Public View · active campaign items · CampaignBuilder item resolution';
