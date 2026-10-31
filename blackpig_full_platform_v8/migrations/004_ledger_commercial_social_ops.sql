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
