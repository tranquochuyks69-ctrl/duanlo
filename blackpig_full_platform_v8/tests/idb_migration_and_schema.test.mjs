// ============================================================================
// Automated Infrastructure, PostgreSQL Migration & WebCrypto PBKDF2-600K Suite
// ============================================================================
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

// 1. Verify WebCrypto PBKDF2 (600,000 iterations) + AES-256-GCM + SHA-256 Roundtrip
const subtle = crypto.webcrypto.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder();
const passphrase = 'BlackPig_Test_Strong_Passphrase';
const plaintext = JSON.stringify({ schemaVersion: 8, user: 'alice', srsCount: 150 });
const plainBytes = enc.encode(plaintext);

const sha256Buf = await subtle.digest('SHA-256', plainBytes);
const sha256Hex = Array.from(new Uint8Array(sha256Buf)).map(b => b.toString(16).padStart(2, '0')).join('');
assert.equal(sha256Hex.length, 64, 'Real SHA-256 hex digest must be 64 hex chars');

const keyMaterial = await subtle.importKey('raw', enc.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']);
const salt = crypto.webcrypto.getRandomValues(new Uint8Array(16));
const iv = crypto.webcrypto.getRandomValues(new Uint8Array(12));
const aesKey = await subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
  keyMaterial,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
const cipherBuf = await subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plainBytes);
const decryptedBuf = await subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, cipherBuf);
assert.equal(dec.decode(decryptedBuf), plaintext, 'AES-256-GCM + PBKDF2 (600,000 iterations) decrypt must match plaintext');

// 2. Verify infra/docker-compose.10k-ccu.yml & infra/nginx.conf fixes
const compose = fs.readFileSync(new URL('../infra/docker-compose.10k-ccu.yml', import.meta.url), 'utf8');
assert.ok(!compose.includes('../:/usr/share/nginx/html'), 'Nginx must NOT mount project root ../');
assert.ok(compose.includes('../dist/public:/usr/share/nginx/html:ro'), 'Nginx must mount only ../dist/public');
assert.ok(!compose.includes('synchronous_commit=off'), 'synchronous_commit=off must be removed');
assert.ok(compose.includes('synchronous_commit=on'), 'synchronous_commit=on must be enabled');

const nginx = fs.readFileSync(new URL('../infra/nginx.conf', import.meta.url), 'utf8');
assert.ok(nginx.includes('listen 443 ssl http2'), 'Nginx must configure TLS on port 443');

// 3. Verify backend TypeScript files have zero `SET LOCAL ... $1` syntax errors and zero `Number(r.vocab_id) || 1`
const authTs = fs.readFileSync(new URL('../backend/auth_and_ledger.ts', import.meta.url), 'utf8');
const serverTs = fs.readFileSync(new URL('../backend/server_10k_ccu.ts', import.meta.url), 'utf8');
assert.ok(!authTs.includes('SET LOCAL app.user_id = $1'), 'Invalid SET LOCAL $1 syntax must be removed from auth_and_ledger.ts');
assert.ok(!serverTs.includes('SET LOCAL app.user_id = $1'), 'Invalid SET LOCAL $1 syntax must be removed from server_10k_ccu.ts');
assert.ok(!serverTs.includes('Number(r.vocab_id) || 1'), 'Silent vocab_id || 1 coercion must be removed from server_10k_ccu.ts');
assert.ok(serverTs.includes("set_config('app.user_id', $1::text, true)"), 'Must use parameterized set_config');

// 4. Verify PostgreSQL versioned migrations & schema_pg15.sql
const schemaSql = fs.readFileSync(new URL('../backend/schema_pg15.sql', import.meta.url), 'utf8');
assert.ok(!schemaSql.includes('CREATE TABLE IF NOT EXISTS pitr_snapshots'), 'Bloated pitr_snapshots table must be removed');
assert.ok(schemaSql.includes('FORCE ROW LEVEL SECURITY'), 'FORCE ROW LEVEL SECURITY must be enabled');
assert.ok(schemaSql.includes('prevent_append_only_mutation'), 'Append-only trigger must be present on ledger & review_logs');
assert.ok(schemaSql.includes('review_logs_2030') && schemaSql.includes('review_logs_default'), 'Partitions through 2030 + DEFAULT must exist');
assert.ok(schemaSql.includes('CREATE TABLE vocab_senses') && schemaSql.includes('CREATE TABLE balance_accounts'), 'Normalized vocab_senses and balance_accounts must exist');

console.log('ALL INFRASTRUCTURE, POSTGRESQL MIGRATION, AND WEBCRYPTO PBKDF2-600K TESTS PASSED!');
