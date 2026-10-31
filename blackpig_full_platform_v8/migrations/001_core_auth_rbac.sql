-- =====================================================================
-- Migration 001: Extensions, Separate DB Roles, Users (E.164), Auth, RBAC & Legal
-- Tooling: Atlas / Flyway / Sqitch compatible versioned SQL migration
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Immutable wrapper for unaccent so it can be indexed in GIN / BTREE indexes
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS $$
  SELECT public.unaccent('public.unaccent', $1);
$$;

-- Separate application role (NOBYPASSRLS) from table owner role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'blackpig_owner') THEN
    CREATE ROLE blackpig_owner NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'blackpig_app') THEN
    CREATE ROLE blackpig_app NOLOGIN NOBYPASSRLS;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     text PRIMARY KEY,
  description text NOT NULL,
  checksum    text NOT NULL,
  applied_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- Enums ----------
CREATE TYPE card_state    AS ENUM ('new', 'learning', 'review', 'relearning');
CREATE TYPE hsk_standard  AS ENUM ('hsk2', 'hsk3', 'tocfl');
CREATE TYPE exercise_kind AS ENUM (
  'multiple_choice', 'tone_pick', 'listen_pick', 'match_pairs',
  'order_words', 'write_hanzi', 'speak', 'translate', 'measure_word'
);
CREATE TYPE ledger_kind   AS ENUM ('xp', 'gem');
CREATE TYPE media_kind    AS ENUM ('audio', 'image', 'video');
CREATE TYPE exam_kind     AS ENUM ('placement', 'hsk_mock', 'tocfl_mock', 'daily_10q', 'final_course');

-- ---------- 1. Users, Auth & E.164 Constraint ----------
CREATE TABLE users (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              citext UNIQUE,
  phone              text UNIQUE CHECK (phone IS NULL OR phone ~ '^\+[1-9]\d{7,14}$'),
  display_name       text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 60),
  locale             text NOT NULL DEFAULT 'vi',
  timezone           text NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  daily_goal_minutes smallint NOT NULL DEFAULT 15 CHECK (daily_goal_minutes BETWEEN 5 AND 240),
  preferences        jsonb NOT NULL DEFAULT '{"bgColorHex":"#f8fafc","bgPresetId":"white_jade","themeMode":"light","hanziScale":"1","speechRate":0.92}'::jsonb,
  consented_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  deleted_at         timestamptz,
  hard_purge_after   timestamptz GENERATED ALWAYS AS (deleted_at + interval '30 days') STORED,
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE auth_credentials (
  user_id       uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash text NOT NULL, -- Argon2id hash
  algo_version  text NOT NULL DEFAULT 'argon2id-v19',
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  bytea NOT NULL UNIQUE,
  device_id   text,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz
);
CREATE INDEX sessions_user_active_idx ON sessions (user_id) WHERE revoked_at IS NULL;

CREATE TABLE otp_challenges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  target      text NOT NULL,
  code_hash   bytea NOT NULL,
  purpose     text NOT NULL CHECK (purpose IN ('register', 'reset_password', 'login', 'verify_phone')),
  attempts    smallint NOT NULL DEFAULT 0 CHECK (attempts <= 5),
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz
);

-- ---------- 2. RBAC (Roles, Permissions, Devices, Push, Login Audit) ----------
CREATE TABLE roles (
  id          smallserial PRIMARY KEY,
  code        text NOT NULL UNIQUE, -- 'learner', 'teacher', 'content_admin', 'security_admin', 'super_admin'
  name        text NOT NULL,
  description text
);

CREATE TABLE permissions (
  id          smallserial PRIMARY KEY,
  code        text NOT NULL UNIQUE, -- 'content.write', 'users.read', 'security.audit', 'ledger.reconcile'
  description text NOT NULL
);

CREATE TABLE role_permissions (
  role_id       smallint NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id smallint NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id     smallint NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  granted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE user_devices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id      text NOT NULL,
  platform       text NOT NULL DEFAULT 'web',
  device_name    text,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_id)
);

CREATE TABLE push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint    text NOT NULL UNIQUE,
  p256dh_key  text NOT NULL,
  auth_key    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  revoked_at  timestamptz
);

CREATE TABLE login_audit_logs (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  identifier  text NOT NULL,
  outcome     text NOT NULL CHECK (outcome IN ('success', 'invalid_password', 'otp_failed', 'locked')),
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX login_audit_created_brin_idx ON login_audit_logs USING brin (created_at);

-- ---------- 3. Legal & Privacy Compliance (Decree 13/2023/NĐ-CP) ----------
CREATE TABLE terms_versions (
  version_code text PRIMARY KEY, -- e.g. 'nd13-2026-v1'
  title        text NOT NULL,
  content_sha256 text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_consents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  terms_version text NOT NULL REFERENCES terms_versions(version_code),
  consent_scope text NOT NULL CHECK (consent_scope IN ('core_learning', 'voice_recording', 'ai_memory', 'analytics')),
  granted       boolean NOT NULL,
  ip_address    inet,
  consented_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE data_privacy_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_kind text NOT NULL CHECK (request_kind IN ('export_json', 'erasure_delete')),
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  artifact_uri text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE data_retention_policies (
  table_name     text PRIMARY KEY,
  retention_days int NOT NULL CHECK (retention_days > 0),
  purge_strategy text NOT NULL CHECK (purge_strategy IN ('hard_delete', 'anonymize', 'parquet_cold_archive')),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

INSERT INTO schema_migrations (version, description, checksum)
VALUES ('001', 'Core extensions, separate roles, E.164 users, auth, RBAC, and Decree 13 legal tables', 'sha256_001_core_auth_rbac')
ON CONFLICT (version) DO NOTHING;
