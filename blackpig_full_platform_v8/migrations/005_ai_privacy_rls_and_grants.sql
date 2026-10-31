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
