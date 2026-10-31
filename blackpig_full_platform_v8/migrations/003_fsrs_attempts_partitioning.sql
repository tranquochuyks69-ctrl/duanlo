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
