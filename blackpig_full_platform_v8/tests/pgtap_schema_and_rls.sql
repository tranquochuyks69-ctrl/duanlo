-- =====================================================================
-- pgTAP Schema, Append-Only Trigger & Multi-User RLS Isolation Test Suite
-- Run with: pg_prove -d blackpig_prod tests/pgtap_schema_and_rls.sql
-- =====================================================================
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(18);

SELECT has_table('public', 'vocab_items', 'vocab_items table exists');
SELECT has_table('public', 'vocab_senses', 'vocab_senses polysemous table exists');
SELECT has_table('public', 'vocab_sense_translations', 'vocab_sense_translations table exists');
SELECT has_table('public', 'hanzi_components', 'hanzi_components decomposition table exists');
SELECT has_table('public', 'media_assets', 'media_assets license table exists');
SELECT has_table('public', 'balance_accounts', 'balance_accounts materialized table exists');
SELECT hasnt_table('public', 'pitr_snapshots', 'bloated pitr_snapshots table is removed');

SELECT has_column('public', 'card_states', 'scheduled_days', 'card_states has scheduled_days');
SELECT hasnt_column('public', 'card_states', 'ease', 'legacy SM-2 ease column is removed');

SELECT col_not_null('public', 'ledger', 'idempotency_key', 'ledger.idempotency_key is NOT NULL');

SELECT has_table('public', 'review_logs_2027', 'review_logs_2027 partition exists');
SELECT has_table('public', 'review_logs_2030', 'review_logs_2030 partition exists');
SELECT has_table('public', 'review_logs_default', 'review_logs_default partition exists');

PREPARE bad_phone_insert AS
  INSERT INTO users (phone, display_name) VALUES ('0912345678', 'Invalid E164');
SELECT throws_ok('bad_phone_insert', '23514', NULL, 'Rejects non-E.164 phone number');

INSERT INTO users (id, email, phone, display_name) VALUES
  ('11111111-1111-4111-8111-111111111111', 'alice@example.com', '+84912345678', 'Alice'),
  ('22222222-2222-4222-8222-222222222222', 'bob@example.com',   '+84987654321', 'Bob');

SET LOCAL ROLE blackpig_app;
SELECT set_config('app.user_id', '11111111-1111-4111-8111-111111111111', true);

INSERT INTO ledger (user_id, kind, amount, reason, idempotency_key)
VALUES ('11111111-1111-4111-8111-111111111111', 'xp', 50, 'lesson_1', 'idem_alice_001');

PREPARE illegal_ledger_update AS
  UPDATE ledger SET amount = 9999 WHERE idempotency_key = 'idem_alice_001';
SELECT throws_ok('illegal_ledger_update', NULL, NULL, 'Blocks UPDATE on append-only ledger');

SELECT set_config('app.user_id', '22222222-2222-4222-8222-222222222222', true);
SELECT is(
  (SELECT count(*)::int FROM ledger),
  0,
  'FORCE RLS prevents Bob from reading Alice ledger rows'
);

PREPARE cross_tenant_insert AS
  INSERT INTO ledger (user_id, kind, amount, reason, idempotency_key)
  VALUES ('11111111-1111-4111-8111-111111111111', 'gem', 100, 'spoof', 'idem_spoof_001');
SELECT throws_ok('cross_tenant_insert', '42501', NULL, 'FORCE RLS blocks cross-user INSERT');

RESET ROLE;
SELECT is(
  (SELECT count(*)::int FROM error_catalog WHERE active = true),
  16,
  'error_catalog contains 16 active Vietnamese error taxonomy rows'
);

SELECT * FROM finish();
ROLLBACK;
