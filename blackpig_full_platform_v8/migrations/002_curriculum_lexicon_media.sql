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
