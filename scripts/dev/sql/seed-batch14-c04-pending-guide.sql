-- Batch-14 · Staging demo only · pending guide for C-04 approve→guide loop.
-- Idempotent on fixed UUIDs. Does NOT touch tip / Hard Gate / Production GO.
-- Requires: users, guides, role_applications (no pgcrypto required).

BEGIN;

INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
VALUES (
  'a14b0001-c004-4d00-9e00-000000000001'::uuid,
  'batch14-c04-pending-guide@traveltrust.test',
  NULL,
  'traveler',
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE
  SET role = 'traveler', updated_at = now();

INSERT INTO guides (
  id, user_id, status, city, country_code, languages, service_types,
  bio, real_name, wallet_address,
  id_photo_url, language_cert_url, guide_license_url, avatar_url,
  passport_number_hash,
  created_at, updated_at
)
VALUES (
  'a14b0001-c004-4d00-9e00-000000000002'::uuid,
  'a14b0001-c004-4d00-9e00-000000000001'::uuid,
  'pending',
  'Osaka',
  'JP',
  '["ja","zh"]'::jsonb,
  '["city_walk"]'::jsonb,
  'Batch-14 C-04 pending demo guide — review materials present.',
  'B14 C04 Demo',
  '0xB14C040000000000000000000000000000000001',
  'https://cdn.traveltrust.test/demo/batch14/c04-id-photo.jpg',
  'https://cdn.traveltrust.test/demo/batch14/c04-lang-cert.jpg',
  'https://cdn.traveltrust.test/demo/batch14/c04-guide-license.jpg',
  'https://cdn.traveltrust.test/demo/batch14/c04-avatar.jpg',
  'batch14c04passporthashdemo000000000000000000000000000000000000',
  now(),
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  status = 'pending',
  city = EXCLUDED.city,
  country_code = EXCLUDED.country_code,
  id_photo_url = EXCLUDED.id_photo_url,
  language_cert_url = EXCLUDED.language_cert_url,
  guide_license_url = EXCLUDED.guide_license_url,
  avatar_url = EXCLUDED.avatar_url,
  passport_number_hash = EXCLUDED.passport_number_hash,
  updated_at = now();

DELETE FROM role_applications
WHERE user_id = 'a14b0001-c004-4d00-9e00-000000000001'::uuid
  AND kind = 'guide';

INSERT INTO role_applications (
  user_id, kind, status, legacy_ref, submitted_at, rejection_codes, metadata, created_at, updated_at
)
VALUES (
  'a14b0001-c004-4d00-9e00-000000000001'::uuid,
  'guide',
  'submitted',
  jsonb_build_object('guides_id', 'a14b0001-c004-4d00-9e00-000000000002'),
  now(),
  '[]'::jsonb,
  jsonb_build_object('phase', 'A', 'source', 'batch14_c04_seed', 'demo', true),
  now(),
  now()
);

COMMIT;
