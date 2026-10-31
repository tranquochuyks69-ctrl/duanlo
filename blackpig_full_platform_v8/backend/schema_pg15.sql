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


-- =====================================================================
-- Migration 002: Normalized Lexicon (Senses, Translations, Radicals,
-- Components, 26 Topics M2M, Media Assets with Licenses & Content Revisions)
-- =====================================================================

CREATE TABLE media_assets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_kind       media_kind NOT NULL,
  storage_uri      text NOT NULL UNIQUE,
  mime_type        text NOT NULL,
  duration_ms      int CHECK (duration_ms IS NULL OR duration_ms >= 0),
  sha256_hex       text NOT NULL,
  source_name      text NOT NULL,            -- e.g. 'CC-CEDICT / Tatoeba / BlackPig Studio'
  license_spdx     text NOT NULL,            -- e.g. 'CC-BY-SA-4.0', 'CC-BY-2.0-FR', 'Proprietary-BlackPig'
  attribution_text text NOT NULL,
  embed_allowed    boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE courses (
  id       smallint PRIMARY KEY,
  code     text NOT NULL UNIQUE,             -- 'HSK1'..'HSK9', 'TOCFL_A1'..
  standard hsk_standard NOT NULL DEFAULT 'hsk3',
  title    text NOT NULL,
  position smallint NOT NULL
);

CREATE TABLE units (
  id        serial PRIMARY KEY,
  course_id smallint NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title     text NOT NULL,
  position  smallint NOT NULL,
  UNIQUE (course_id, position)
);

CREATE TABLE lessons (
  id               serial PRIMARY KEY,
  unit_id          int NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  slug             text NOT NULL UNIQUE,
  title            text NOT NULL,
  position         smallint NOT NULL,
  is_boss          boolean NOT NULL DEFAULT false,
  lecture_media_id uuid REFERENCES media_assets(id),
  version          int NOT NULL DEFAULT 1,
  published        boolean NOT NULL DEFAULT false,
  UNIQUE (unit_id, position)
);

-- 26 Pedagogical Topics (Many-to-Many with Vocabulary & Lessons)
CREATE TABLE topics (
  id          smallserial PRIMARY KEY,
  slug        text NOT NULL UNIQUE,          -- e.g. 'beginner', 'grammar', 'vocab_measure', 'video_learn'
  group_code  text NOT NULL,                 -- 'courses', 'skills', 'practice', 'vocab', 'system'
  title_vi    text NOT NULL,
  title_zh    text,
  position    smallint NOT NULL DEFAULT 1
);

-- Orthographic Headword Table (Supports external_key like 'v_1' for client sync compatibility)
CREATE TABLE vocab_items (
  id             serial PRIMARY KEY,
  external_key   text UNIQUE,                -- e.g. 'v_1', 'v_2'
  simplified     text NOT NULL,
  traditional    text,
  pinyin         text NOT NULL,              -- 'nǐ hǎo'
  pinyin_num     text NOT NULL,              -- 'ni3 hao3'
  han_viet       text,
  audio_asset_id uuid REFERENCES media_assets(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (simplified, pinyin_num)
);

-- Polysemous Senses Table (Multiple meanings, POS, and HSK levels per word!)
CREATE TABLE vocab_senses (
  id            serial PRIMARY KEY,
  vocab_id      int NOT NULL REFERENCES vocab_items(id) ON DELETE CASCADE,
  sense_order   smallint NOT NULL DEFAULT 1,
  pos           text NOT NULL,               -- 'n', 'v', 'adj', 'adv', 'mw', 'conj', 'prep', 'part'
  hsk_standard  hsk_standard NOT NULL DEFAULT 'hsk3',
  hsk_level     smallint NOT NULL CHECK (hsk_level BETWEEN 1 AND 9),
  freq_rank     int,
  meaning_vi    text NOT NULL,
  register_note text,
  UNIQUE (vocab_id, sense_order)
);

-- Multilingual Sense Translations (English, Japanese, Korean, etc.)
CREATE TABLE vocab_sense_translations (
  sense_id     int NOT NULL REFERENCES vocab_senses(id) ON DELETE CASCADE,
  locale       text NOT NULL,                -- 'vi', 'en', 'zh_tw', 'ja', 'ko'
  meaning_text text NOT NULL,
  explanation  text,
  PRIMARY KEY (sense_id, locale)
);

-- Many-to-Many Mapping between Vocabulary and the 26 Topics
CREATE TABLE vocab_topics (
  vocab_id int NOT NULL REFERENCES vocab_items(id) ON DELETE CASCADE,
  topic_id smallint NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (vocab_id, topic_id)
);

CREATE TABLE lesson_vocab (
  lesson_id int NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  vocab_id  int NOT NULL REFERENCES vocab_items(id) ON DELETE CASCADE,
  sense_id  int REFERENCES vocab_senses(id) ON DELETE SET NULL,
  PRIMARY KEY (lesson_id, vocab_id)
);

CREATE TABLE example_sentences (
  id             serial PRIMARY KEY,
  vocab_id       int NOT NULL REFERENCES vocab_items(id) ON DELETE CASCADE,
  sense_id       int REFERENCES vocab_senses(id) ON DELETE SET NULL,
  hanzi          text NOT NULL,
  pinyin         text NOT NULL,
  meaning_vi     text NOT NULL,
  audio_asset_id uuid REFERENCES media_assets(id),
  source_license text NOT NULL DEFAULT 'CC-BY-2.0-FR (Tatoeba)'
);

-- Radicals (214 Kangxi Radicals) & Character Decomposition
CREATE TABLE radicals (
  id           smallint PRIMARY KEY CHECK (id BETWEEN 1 AND 214),
  radical_char text NOT NULL UNIQUE,
  variant_char text,
  pinyin       text NOT NULL,
  han_viet     text NOT NULL,
  meaning_vi   text NOT NULL,
  stroke_count smallint NOT NULL
);

CREATE TABLE hanzi_characters (
  char         text PRIMARY KEY CHECK (char_length(char) = 1),
  stroke_count smallint NOT NULL CHECK (stroke_count > 0),
  radical_id   smallint REFERENCES radicals(id),
  strokes      jsonb NOT NULL,               -- SVG paths + reference median polylines for vector grading
  hsk_level    smallint CHECK (hsk_level BETWEEN 1 AND 9),
  etymology_vi text
);

CREATE TABLE hanzi_components (
  char           text NOT NULL REFERENCES hanzi_characters(char) ON DELETE CASCADE,
  component_char text NOT NULL,
  component_role text NOT NULL CHECK (component_role IN ('semantic', 'phonetic', 'radical', 'graphic')),
  position_type  text NOT NULL DEFAULT 'left_right', -- 'left_right', 'top_bottom', 'enclosure'
  position_order smallint NOT NULL DEFAULT 1,
  mnemonic_vi    text,
  PRIMARY KEY (char, component_char, position_order)
);

CREATE TABLE exercises (
  id        serial PRIMARY KEY,
  lesson_id int NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  topic_id  smallint REFERENCES topics(id),
  hsk_level smallint NOT NULL DEFAULT 1 CHECK (hsk_level BETWEEN 1 AND 9),
  kind      exercise_kind NOT NULL,
  payload   jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  position  smallint NOT NULL
);
CREATE INDEX exercises_lesson_idx ON exercises (lesson_id, position);

-- Content Revision Audit Trail (Versioned CMS history)
CREATE TABLE content_revisions (
  id             bigserial PRIMARY KEY,
  entity_type    text NOT NULL CHECK (entity_type IN ('vocab_item', 'vocab_sense', 'lesson', 'exercise', 'hanzi_character')),
  entity_id      text NOT NULL,
  version_num    int NOT NULL CHECK (version_num >= 1),
  author_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  diff_payload   jsonb NOT NULL,
  change_note    text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Trigram + Unaccent Indexes for Hanzi, Pinyin, and Diacritic-Insensitive Vietnamese Search
CREATE INDEX vocab_hanzi_trgm_idx   ON vocab_items USING gin (simplified gin_trgm_ops);
CREATE INDEX vocab_pinyin_trgm_idx  ON vocab_items USING gin (pinyin_num gin_trgm_ops);
CREATE INDEX senses_vi_trgm_idx     ON vocab_senses USING gin (meaning_vi gin_trgm_ops);
CREATE INDEX senses_vi_unaccent_idx ON vocab_senses USING gin (immutable_unaccent(meaning_vi) gin_trgm_ops);
CREATE INDEX senses_level_idx       ON vocab_senses (hsk_standard, hsk_level);

INSERT INTO schema_migrations (version, description, checksum)
VALUES ('002', 'Normalized lexicon, senses, translations, radicals, hanzi_components, 26 topics, media_assets, and unaccent/trigram indexes', 'sha256_002_curriculum_lexicon_media')
ON CONFLICT (version) DO NOTHING;


-- =====================================================================
-- Migration 003: FSRS-5 Per-User Parameters, Card States (HOT-tuned),
-- Partitioned Review Logs & Attempts (2025-2030 + DEFAULT), Exams & Speaking
-- =====================================================================

-- Per-User FSRS-5 Parameters & Desired Retention for Personalized Optimization
CREATE TABLE user_fsrs_params (
  user_id                  uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  algorithm_version        text NOT NULL DEFAULT 'FSRS-5.0',
  weights                  real[] NOT NULL DEFAULT ARRAY[0.40255,1.18385,3.173,15.69105,7.1949,0.5345,1.4604,0.0046,1.54575,0.1192,1.01925,1.9395,0.11,0.29605,2.2698,0.2315,2.9898,0.51655,0.6621]::real[],
  desired_retention        real NOT NULL DEFAULT 0.90 CHECK (desired_retention BETWEEN 0.70 AND 0.99),
  learning_steps_minutes   int[] NOT NULL DEFAULT ARRAY[1, 10],
  relearning_steps_minutes int[] NOT NULL DEFAULT ARRAY[10],
  sample_size_reviews      int NOT NULL DEFAULT 0,
  optimized_at             timestamptz,
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CHECK (array_length(weights, 1) = 19)
);

-- FSRS-5 Card States (Removed legacy SM-2 `ease`; added scheduled_days & learning_step; tuned fillfactor=80 for HOT updates)
CREATE TABLE card_states (
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vocab_id       int  NOT NULL REFERENCES vocab_items(id) ON DELETE CASCADE,
  sense_id       int  REFERENCES vocab_senses(id) ON DELETE SET NULL,
  state          card_state NOT NULL DEFAULT 'new',
  due_at         timestamptz NOT NULL DEFAULT now(),
  stability      real NOT NULL DEFAULT 0,
  difficulty     real NOT NULL DEFAULT 5.0 CHECK (difficulty BETWEEN 1.0 AND 10.0),
  elapsed_days   int  NOT NULL DEFAULT 0 CHECK (elapsed_days >= 0),
  scheduled_days int  NOT NULL DEFAULT 0 CHECK (scheduled_days >= 0),
  learning_step  smallint NOT NULL DEFAULT 0 CHECK (learning_step >= 0),
  reps           int  NOT NULL DEFAULT 0 CHECK (reps >= 0),
  lapses         int  NOT NULL DEFAULT 0 CHECK (lapses >= 0),
  last_review_at timestamptz,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, vocab_id)
) WITH (
  fillfactor = 80,
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- Partial Index for Due Cards + Covering Index
CREATE INDEX card_due_partial_idx ON card_states (user_id, due_at)
  INCLUDE (vocab_id, state, stability, difficulty, scheduled_days)
  WHERE state <> 'new';

-- Partitioned Append-Only Review Logs (2025..2030 + DEFAULT Partition + BRIN index)
CREATE TABLE review_logs (
  id             uuid NOT NULL,
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vocab_id       int  NOT NULL REFERENCES vocab_items(id),
  rating         smallint NOT NULL CHECK (rating BETWEEN 1 AND 4),
  state_before   card_state NOT NULL,
  stability_after real,
  difficulty_after real,
  scheduled_days int,
  elapsed_ms     int CHECK (elapsed_ms IS NULL OR elapsed_ms >= 0),
  reviewed_at    timestamptz NOT NULL,
  device_id      text,
  received_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, reviewed_at)
) PARTITION BY RANGE (reviewed_at);

CREATE TABLE review_logs_2025 PARTITION OF review_logs FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE review_logs_2026 PARTITION OF review_logs FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE review_logs_2027 PARTITION OF review_logs FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
CREATE TABLE review_logs_2028 PARTITION OF review_logs FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');
CREATE TABLE review_logs_2029 PARTITION OF review_logs FOR VALUES FROM ('2029-01-01') TO ('2030-01-01');
CREATE TABLE review_logs_2030 PARTITION OF review_logs FOR VALUES FROM ('2030-01-01') TO ('2031-01-01');
CREATE TABLE review_logs_default PARTITION OF review_logs DEFAULT;

CREATE INDEX review_user_btree_idx ON review_logs (user_id, reviewed_at DESC);
CREATE INDEX review_time_brin_idx  ON review_logs USING brin (reviewed_at);

-- Cold Storage Parquet Archive Manifest for Historical Review Logs
CREATE TABLE cold_storage_archives (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table    text NOT NULL,
  partition_name  text NOT NULL UNIQUE,
  range_start     timestamptz NOT NULL,
  range_end       timestamptz NOT NULL,
  parquet_s3_uri  text NOT NULL,
  row_count       bigint NOT NULL,
  sha256_checksum text NOT NULL,
  archived_at     timestamptz NOT NULL DEFAULT now()
);

-- Lesson Progress & Partitioned Lesson Attempts
CREATE TABLE lesson_progress (
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    int  NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  best_stars   smallint NOT NULL DEFAULT 0 CHECK (best_stars BETWEEN 0 AND 3),
  attempts     int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE lesson_attempts (
  id             uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id      int  NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  lesson_version int  NOT NULL,
  score_pct      smallint NOT NULL CHECK (score_pct BETWEEN 0 AND 100),
  duration_s     int  NOT NULL CHECK (duration_s >= 0),
  answers        jsonb NOT NULL DEFAULT '[]',
  started_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, started_at)
) PARTITION BY RANGE (started_at);

CREATE TABLE lesson_attempts_2026 PARTITION OF lesson_attempts FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE lesson_attempts_2027 PARTITION OF lesson_attempts FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
CREATE TABLE lesson_attempts_2028 PARTITION OF lesson_attempts FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');
CREATE TABLE lesson_attempts_default PARTITION OF lesson_attempts DEFAULT;
CREATE INDEX attempts_user_idx ON lesson_attempts (user_id, started_at DESC);
CREATE INDEX attempts_brin_idx ON lesson_attempts USING brin (started_at);

-- Placement Tests, HSK 1-9 Mock Exams & TOCFL Attempts
CREATE TABLE exam_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind            exam_kind NOT NULL,
  hsk_level       smallint NOT NULL CHECK (hsk_level BETWEEN 1 AND 9),
  score_listening smallint NOT NULL DEFAULT 0 CHECK (score_listening BETWEEN 0 AND 100),
  score_reading   smallint NOT NULL DEFAULT 0 CHECK (score_reading BETWEEN 0 AND 100),
  score_writing   smallint NOT NULL DEFAULT 0 CHECK (score_writing BETWEEN 0 AND 100),
  score_speaking  smallint NOT NULL DEFAULT 0 CHECK (score_speaking BETWEEN 0 AND 100),
  total_score     smallint NOT NULL CHECK (total_score BETWEEN 0 AND 400),
  passed          boolean NOT NULL,
  breakdown       jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX exam_attempts_user_idx ON exam_attempts (user_id, completed_at DESC);

-- Speaking & Pronunciation Attempts (References Audio Media Asset + Recording Consent)
CREATE TABLE speaking_attempts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id            int REFERENCES lessons(id) ON DELETE SET NULL,
  vocab_id             int REFERENCES vocab_items(id) ON DELETE SET NULL,
  audio_media_id       uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  recording_consent_id uuid NOT NULL REFERENCES user_consents(id) ON DELETE RESTRICT,
  prompt_hanzi         text NOT NULL,
  transcript_hanzi     text,
  tone_accuracy_pct    smallint NOT NULL CHECK (tone_accuracy_pct BETWEEN 0 AND 100),
  gop_score_pct        smallint NOT NULL CHECK (gop_score_pct BETWEEN 0 AND 100),
  fluency_pct          smallint NOT NULL CHECK (fluency_pct BETWEEN 0 AND 100),
  pitch_contour_chao   jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX speaking_attempts_user_idx ON speaking_attempts (user_id, created_at DESC);

-- Achievements & Badges
CREATE TABLE achievements (
  id          text PRIMARY KEY, -- e.g. 'streak_7', 'hsk1_master', 'tone_sniper'
  title_vi    text NOT NULL,
  description text NOT NULL,
  reward_xp   int NOT NULL DEFAULT 50,
  reward_gems int NOT NULL DEFAULT 20
);

CREATE TABLE user_achievements (
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress_value int NOT NULL DEFAULT 1,
  unlocked_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

INSERT INTO schema_migrations (version, description, checksum)
VALUES ('003', 'FSRS-5 params, HOT-tuned card_states, partitioned review_logs & lesson_attempts through 2030 + DEFAULT, exam_attempts, speaking_attempts, achievements', 'sha256_003_fsrs_attempts_partitioning')
ON CONFLICT (version) DO NOTHING;


-- =====================================================================
-- Migration 004: Immutable Append-Only Ledger (idempotency_key NOT NULL),
-- Materialized balance_accounts, Commercial, Social, Operations & API Outbox
-- =====================================================================

-- Immutable Append-Only Ledger (idempotency_key is strictly NOT NULL)
CREATE TABLE ledger (
  id              bigserial PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind            ledger_kind NOT NULL,
  amount          int NOT NULL CHECK (amount <> 0),
  reason          text NOT NULL,
  ref_id          uuid,
  idempotency_key text NOT NULL CHECK (char_length(trim(idempotency_key)) >= 6),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX ledger_user_idx ON ledger (user_id, kind, created_at DESC);
CREATE INDEX ledger_created_brin_idx ON ledger USING brin (created_at);

-- Materialized Transactional Balance Account (Replaces slow SUM(ledger) view on hot paths)
CREATE TABLE balance_accounts (
  user_id            uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp_balance         bigint NOT NULL DEFAULT 0 CHECK (xp_balance >= 0),
  gem_balance        bigint NOT NULL DEFAULT 0 CHECK (gem_balance >= 0),
  streak_days        int NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  streak_freeze_qty  int NOT NULL DEFAULT 1 CHECK (streak_freeze_qty >= 0),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  last_reconciled_at timestamptz NOT NULL DEFAULT now()
);

-- Keep read-only audit view for nightly reconciliation comparison
CREATE OR REPLACE VIEW user_balances_reconciliation_view AS
  SELECT b.user_id,
         b.xp_balance AS account_xp,
         b.gem_balance AS account_gems,
         COALESCE(SUM(l.amount) FILTER (WHERE l.kind = 'xp'),  0)::bigint AS ledger_xp,
         COALESCE(SUM(l.amount) FILTER (WHERE l.kind = 'gem'), 0)::bigint AS ledger_gems
  FROM balance_accounts b
  LEFT JOIN ledger l ON l.user_id = b.user_id
  GROUP BY b.user_id, b.xp_balance, b.gem_balance;

CREATE TABLE shop_items (
  id        text PRIMARY KEY,
  name      text NOT NULL,
  cost_gems int NOT NULL CHECK (cost_gems >= 0),
  active    boolean NOT NULL DEFAULT true
);

CREATE TABLE inventory (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id text NOT NULL REFERENCES shop_items(id),
  qty     int NOT NULL DEFAULT 0 CHECK (qty >= 0),
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE study_days (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day         date NOT NULL,
  minutes     int NOT NULL DEFAULT 0 CHECK (minutes >= 0),
  freeze_used boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, day)
);

-- ---------- Commercial Tables (Plans, Subscriptions, Orders, Payments, Refunds, Webhooks) ----------
CREATE TABLE subscription_plans (
  id             text PRIMARY KEY,           -- 'free', 'pro_monthly', 'pro_yearly', 'lifetime_hsk9'
  name           text NOT NULL,
  price_vnd      bigint NOT NULL CHECK (price_vnd >= 0),
  billing_period text NOT NULL CHECK (billing_period IN ('none', 'month', 'year', 'lifetime')),
  active         boolean NOT NULL DEFAULT true
);

CREATE TABLE subscriptions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id            text NOT NULL REFERENCES subscription_plans(id),
  status             text NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  current_period_end timestamptz NOT NULL,
  cancel_at_end      boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_user_idx ON subscriptions (user_id, status);

CREATE TABLE orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  plan_id         text REFERENCES subscription_plans(id),
  amount_vnd      bigint NOT NULL CHECK (amount_vnd >= 0),
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  idempotency_key text NOT NULL UNIQUE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  provider            text NOT NULL CHECK (provider IN ('vnpay', 'momo', 'stripe', 'VietQR', 'apple_iap', 'google_play')),
  provider_payment_id text NOT NULL UNIQUE,
  amount_vnd          bigint NOT NULL CHECK (amount_vnd >= 0),
  status              text NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed')),
  paid_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE refunds (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id         uuid NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  user_id            uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_vnd         bigint NOT NULL CHECK (amount_vnd > 0),
  reason             text NOT NULL,
  approved_by_admin  uuid REFERENCES users(id),
  refunded_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payment_webhook_logs (
  id                bigserial PRIMARY KEY,
  provider          text NOT NULL,
  provider_event_id text NOT NULL UNIQUE,
  signature_valid   boolean NOT NULL,
  payload           jsonb NOT NULL,
  processed_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX webhook_created_brin_idx ON payment_webhook_logs USING brin (created_at);

-- ---------- Social Tables (Friendships, Leagues, Weekly Leaderboard Snapshots) ----------
CREATE TABLE friendships (
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id <> friend_id)
);

CREATE TABLE leagues (
  id          smallserial PRIMARY KEY,
  code        text NOT NULL UNIQUE,          -- 'bronze', 'silver', 'gold', 'jade', 'imperial_dragon'
  title_vi    text NOT NULL,
  min_weekly_xp int NOT NULL DEFAULT 0
);

CREATE TABLE weekly_leaderboard_snapshots (
  week_start  date NOT NULL,
  league_id   smallint NOT NULL REFERENCES leagues(id),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekly_xp   int NOT NULL DEFAULT 0,
  rank_pos    int NOT NULL,
  promoted    boolean NOT NULL DEFAULT false,
  PRIMARY KEY (week_start, league_id, user_id)
);

-- ---------- Operations & API Reliability Tables ----------
CREATE TABLE admin_audit_logs (
  id              bigserial PRIMARY KEY,
  admin_user_id   uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role_code       text NOT NULL,
  action_code     text NOT NULL,
  target_resource text NOT NULL,
  client_ip       text,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_brin_idx ON admin_audit_logs USING brin (created_at);

CREATE TABLE feature_flags (
  key          text PRIMARY KEY,
  enabled      boolean NOT NULL DEFAULT false,
  rollout_pct  smallint NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  description  text,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ab_experiments (
  id           text PRIMARY KEY,
  name         text NOT NULL,
  variants     jsonb NOT NULL DEFAULT '["control","treatment"]'::jsonb,
  status       text NOT NULL DEFAULT 'running' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ab_assignments (
  experiment_id text NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant       text NOT NULL,
  assigned_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (experiment_id, user_id)
);

CREATE TABLE content_reports (
  id            bigserial PRIMARY KEY,
  reporter_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  entity_type   text NOT NULL,
  entity_id     text NOT NULL,
  issue_kind    text NOT NULL CHECK (issue_kind IN ('wrong_pinyin', 'wrong_meaning', 'audio_mismatch', 'typo', 'other')),
  description   text NOT NULL,
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolved_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE api_idempotency_keys (
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  request_path    text NOT NULL,
  response_status smallint NOT NULL,
  response_body   jsonb NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  PRIMARY KEY (user_id, idempotency_key)
);

CREATE TABLE server_event_outbox (
  id            bigserial PRIMARY KEY,
  aggregate_type text NOT NULL,
  aggregate_id   text NOT NULL,
  event_type     text NOT NULL,
  payload        jsonb NOT NULL,
  published_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX outbox_unpublished_idx ON server_event_outbox (id) WHERE published_at IS NULL;

CREATE TABLE sync_devices (
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id      text NOT NULL,
  last_pulled_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, device_id)
);

-- ---------- Append-Only Trigger Guard on ledger, review_logs, and admin_audit_logs ----------
CREATE OR REPLACE FUNCTION prevent_append_only_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'APPEND_ONLY_VIOLATION: UPDATE and DELETE are strictly forbidden on immutable table %', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER trg_ledger_append_only
  BEFORE UPDATE OR DELETE ON ledger
  FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();

CREATE TRIGGER trg_review_logs_append_only
  BEFORE UPDATE OR DELETE ON review_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();

CREATE TRIGGER trg_admin_audit_append_only
  BEFORE UPDATE OR DELETE ON admin_audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();

INSERT INTO schema_migrations (version, description, checksum)
VALUES ('004', 'Append-only ledger trigger, materialized balance_accounts, commercial, social, ops, and API outbox tables', 'sha256_004_ledger_commercial_social')
ON CONFLICT (version) DO NOTHING;


-- =====================================================================
-- Migration 005: Authoritative error_catalog, Prompt/Model Registry,
-- Partitioned ai_messages, Encrypted friend_memory with TTL, FORCE RLS & Grants
-- =====================================================================

-- Single Source of Truth for Vietnamese Pedagogical Error Taxonomy
CREATE TABLE error_catalog (
  error_code   text PRIMARY KEY,
  title_vi     text NOT NULL,
  explain_vi   text NOT NULL,
  hsk_level    smallint NOT NULL DEFAULT 1 CHECK (hsk_level BETWEEN 1 AND 9),
  active       boolean NOT NULL DEFAULT true,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

INSERT INTO error_catalog (error_code, title_vi, explain_vi, hsk_level) VALUES
  ('particle_le_misuse', 'Dùng thừa trợ từ 了', '了 diễn tả sự thay đổi hoặc hoàn thành, không dùng sau 想/喜欢 để chỉ mong muốn chung.', 1),
  ('particle_guo_experiential', 'Phủ định sai trợ từ 过', 'Khi phủ định trải nghiệm đã từng xảy ra (过), dùng 没(有) + Động từ + 过 chứ không dùng 不.', 2),
  ('particle_zhe_continuous', 'Vị trí trợ từ trạng thái 着', 'Trợ từ 着 đứng ngay sau động từ để diễn tả trạng thái đang duy trì (Ví dụ: 门开着).', 2),
  ('word_order_time_place', 'Sai trật tự Thời gian / Địa điểm', 'Trạng ngữ Thời gian và Địa điểm trong tiếng Trung phải đứng TRƯỚC động từ chính ([Chủ ngữ + Thời gian + Địa điểm + Động từ]).', 1),
  ('word_order_modifier_head', 'Ngược vị trí Định ngữ + Danh từ', 'Trong tiếng Trung, Định ngữ (cụm bổ nghĩa) luôn đứng TRƯỚC danh từ chính và nối bằng 的.', 1),
  ('adjective_shi_error', 'Thừa chữ 是 trước Tính từ', 'Tính từ làm vị ngữ trong tiếng Trung đi kèm phó từ mức độ (như 很) chứ không dùng 是 (Ví dụ: 我很好, không nói 我是好).', 1),
  ('missing_measure_word', 'Thiếu Lượng từ giữa Số từ và Danh từ', 'Giữa số từ / đại từ chỉ định (一, 两, 这, 那) và danh từ bắt buộc phải có lượng từ (như 个, 杯, 本).', 1),
  ('wrong_measure_word_ge', 'Lạm dụng lượng từ 个', 'Hãy dùng lượng từ chuyên biệt thay cho 个 (Ví dụ: 一杯咖啡, 一本书, 一件衣服, 一辆车).', 2),
  ('de_possessive_adjective', 'Nhầm trợ từ kết cấu 的', 'Trợ từ kết cấu 的 (bạch đích) đứng trước Danh từ để nối định ngữ sở hữu hoặc miêu tả.', 2),
  ('de_manner_adverbial', 'Nhầm trợ từ trạng ngữ 地', 'Trợ từ 地 (thổ địa) đứng trước Động từ để biến tính từ thành trạng ngữ chỉ cách thức.', 3),
  ('de_complement_degree', 'Nhầm trợ từ bổ ngữ 得', 'Trợ từ 得 (song nhân đắc) đứng SAU động từ để dẫn ra bổ ngữ chỉ mức độ/kết quả (Ví dụ: 说得很好).', 3),
  ('ba_construction_missing_result', 'Câu chữ 把 thiếu thành phần kết quả', 'Trong câu chữ 把, sau động từ bắt buộc phải có thành phần bổ ngữ kết quả, xu hướng hoặc 了/着.', 3),
  ('ma_ne_interrogative_mix', 'Thừa 吗 trong câu đã có từ để hỏi', 'Khi trong câu đã có đại từ nghi vấn (什么, 哪儿, 怎么, 谁) thì cuối câu KHÔNG thêm 吗.', 1),
  ('bu_mei_negation_mix', 'Nhầm lẫn phủ định 不 và 没', 'Động từ 有 (có) và hành động đã xảy ra trong quá khứ luôn phủ định bằng 没 (没有), không dùng 不.', 1),
  ('er_liang_number_confusion', 'Nhầm số đếm 二 và 两', 'Khi đếm số lượng (2 cái) trước lượng từ bắt buộc dùng 两 (两个, 两杯), còn 二 dùng cho số thứ tự/toán học.', 1),
  ('han_viet_false_friend', 'Bẫy từ đồng âm Hán-Việt khác nghĩa', 'Cẩn thận từ đồng âm Hán-Việt khác nghĩa: 走 nghĩa là đi bộ (chạy là 跑); 方便 nghĩa là tiện lợi.', 2)
ON CONFLICT (error_code) DO UPDATE
SET title_vi = EXCLUDED.title_vi,
    explain_vi = EXCLUDED.explain_vi,
    hsk_level = EXCLUDED.hsk_level,
    updated_at = now();

-- Prompt & Model Registry (No hardcoded model default on ai_messages!)
CREATE TABLE prompt_model_registry (
  prompt_version          text PRIMARY KEY,  -- e.g. 'v3.0-blackpig-dialogue'
  task_kind               text NOT NULL,     -- 'xiao_long_chat', 'pedagogical_eval', 'pronunciation_coach'
  model_provider          text NOT NULL,     -- 'openai', 'anthropic', 'google_gemini'
  model_name              text NOT NULL,
  system_template         text NOT NULL,
  max_tokens              int NOT NULL DEFAULT 450,
  temperature             real NOT NULL DEFAULT 0.6,
  cost_per_1k_input_usd   numeric(10, 6) NOT NULL DEFAULT 0.000150,
  cost_per_1k_output_usd  numeric(10, 6) NOT NULL DEFAULT 0.000600,
  is_active               boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario   text NOT NULL DEFAULT 'free',
  hsk_level  smallint NOT NULL DEFAULT 1 CHECK (hsk_level BETWEEN 1 AND 9),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Partitioned AI Messages (No hardcoded model default; tracks cost & latency)
CREATE TABLE ai_messages (
  id              bigserial,
  conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            text NOT NULL CHECK (role IN ('user', 'assistant')),
  prompt_version  text NOT NULL REFERENCES prompt_model_registry(prompt_version),
  model_name      text NOT NULL,
  hanzi           text,
  pinyin          text,
  meaning_vi      text,
  corrections     jsonb,
  tokens_in       int NOT NULL DEFAULT 0,
  tokens_out      int NOT NULL DEFAULT 0,
  latency_ms      int,
  cost_usd        numeric(10, 6) NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE ai_messages_2026 PARTITION OF ai_messages FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE ai_messages_2027 PARTITION OF ai_messages FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
CREATE TABLE ai_messages_2028 PARTITION OF ai_messages FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');
CREATE TABLE ai_messages_default PARTITION OF ai_messages DEFAULT;

CREATE INDEX ai_msg_conv_idx ON ai_messages (conversation_id, created_at);
CREATE INDEX ai_msg_brin_idx ON ai_messages USING brin (created_at);

CREATE TABLE learner_errors (
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  error_code text NOT NULL REFERENCES error_catalog(error_code) ON DELETE RESTRICT,
  count      int  NOT NULL DEFAULT 1 CHECK (count >= 1),
  last_seen  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, error_code)
);

-- Sensitive Personal Memory Table with Retention TTL (`expires_at`) & pgcrypto Column Encryption
CREATE TABLE friend_memory (
  id              bigserial PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fact_text       text NOT NULL CHECK (char_length(fact_text) BETWEEN 1 AND 200),
  encrypted_fact  bytea,                     -- pgp_sym_encrypt(fact_text, key) for sensitive notes
  user_visible    boolean NOT NULL DEFAULT true,
  updated_by_user boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '180 days'),
  deleted_at      timestamptz
);
CREATE INDEX friend_mem_user_idx ON friend_memory (user_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE ai_feedback_reports (
  id              bigserial PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  error_code      text REFERENCES error_catalog(error_code),
  note            text,
  status          text NOT NULL DEFAULT 'pending_review',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mistake_notebook (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vocab_id   int REFERENCES vocab_items(id) ON DELETE SET NULL,
  hanzi      text NOT NULL,
  pinyin     text NOT NULL,
  meaning_vi text NOT NULL,
  tag        text NOT NULL DEFAULT 'Sổ tay cá nhân',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mistake_notebook_user_idx ON mistake_notebook (user_id, created_at DESC);
CREATE INDEX mistake_notebook_trgm_idx ON mistake_notebook USING gin (immutable_unaccent(meaning_vi) gin_trgm_ops);

-- Automated Hard-Purge Function for Soft-Deleted Users & Expired Friend Memories
CREATE OR REPLACE FUNCTION purge_soft_deleted_users_and_expired_memories()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  purged_users int;
  purged_memories int;
BEGIN
  DELETE FROM friend_memory
  WHERE expires_at <= now() OR (deleted_at IS NOT NULL AND deleted_at <= now() - interval '7 days');
  GET DIAGNOSTICS purged_memories = ROW_COUNT;

  DELETE FROM users
  WHERE deleted_at IS NOT NULL AND hard_purge_after <= now();
  GET DIAGNOSTICS purged_users = ROW_COUNT;

  RETURN jsonb_build_object('purged_users', purged_users, 'purged_memories', purged_memories, 'executed_at', now());
END;
$$;

-- =====================================================================
-- FORCE ROW LEVEL SECURITY ON ALL USER-SCOPED TABLES
-- =====================================================================
DO $$
DECLARE
  t text;
  user_tables text[] := ARRAY[
    'user_fsrs_params', 'card_states', 'review_logs', 'lesson_progress',
    'lesson_attempts', 'exam_attempts', 'speaking_attempts', 'user_achievements',
    'ledger', 'balance_accounts', 'inventory', 'study_days', 'subscriptions',
    'orders', 'payments', 'refunds', 'user_devices', 'push_subscriptions',
    'user_consents', 'data_privacy_requests', 'friendships', 'sync_devices',
    'ai_conversations', 'ai_messages', 'learner_errors', 'friend_memory',
    'ai_feedback_reports', 'mistake_notebook', 'api_idempotency_keys'
  ];
BEGIN
  FOREACH t IN ARRAY user_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (user_id = nullif(current_setting(''app.user_id'', true), '''')::uuid) WITH CHECK (user_id = nullif(current_setting(''app.user_id'', true), '''')::uuid);',
      'rls_own_' || t, t
    );
  END LOOP;
END
$$;

-- Least-Privilege Role Grants (blackpig_app cannot UPDATE/DELETE append-only tables!)
GRANT USAGE ON SCHEMA public TO blackpig_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO blackpig_app;
REVOKE UPDATE, DELETE ON ledger, review_logs, admin_audit_logs FROM blackpig_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO blackpig_app;

INSERT INTO schema_migrations (version, description, checksum)
VALUES ('005', 'Authoritative error_catalog, prompt_model_registry, partitioned ai_messages, encrypted friend_memory with TTL, FORCE RLS on 29 user tables, and least-privilege grants', 'sha256_005_ai_privacy_rls_and_grants')
ON CONFLICT (version) DO NOTHING;
