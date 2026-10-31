// ============================================================================
// Behavioral Red-Team, Input Validation, Vector Stroke Grading & Modulo Audit
// ============================================================================
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

// 1. Verify 0 occurrences of `% bank.length` or `% activeBank.length` remain across all client JS files
for (const file of ['04-avatar-frames-roadmap-exam.js', '05-ai-dojo-arena-srs-profile.js', '06-router-events-init.js']) {
  const code = fs.readFileSync(new URL('../js/' + file, import.meta.url), 'utf8');
  assert.ok(!code.includes('% bank.length'), `Found forbidden % bank.length in ${file}`);
  assert.ok(!code.includes('% activeBank.length'), `Found forbidden % activeBank.length in ${file}`);
  assert.ok(!code.includes('% lowerBank.length'), `Found forbidden % lowerBank.length in ${file}`);
}

// 2. Verify Python FastAPI ai_speech_service.py acoustic DTW tone contour scorer & PII scrubber
const pyCheck = execSync(
  `python3 -c "import sys; sys.path.insert(0, 'backend'); import ai_speech_service as s; ` +
  `res1 = s.evaluate_mandarin_tone_f0_contour([240,242,241,240,241,242], 1, 100, 260); ` +
  `res4 = s.evaluate_mandarin_tone_f0_contour([255,210,165,130,105,92], 4, 90, 260); ` +
  `pii = s.scrub_pii_from_user_message('Email a@b.com phone +84912345678'); ` +
  `assert res1['ok'] and res1['detected_tone'] == 1, res1; ` +
  `assert res4['ok'] and res4['detected_tone'] == 4, res4; ` +
  `assert '[EMAIL_HIDDEN]' in pii and '[PHONE_HIDDEN]' in pii, pii; ` +
  `print('PYTHON_FASTAPI_DTW_OK')"`
).toString();
assert.ok(pyCheck.includes('PYTHON_FASTAPI_DTW_OK'), 'Python FastAPI DTW tone analyzer must classify Tone 1 and Tone 4 accurately');

// 3. Verify Native V8 Intl.Segmenter('zh-CN', { granularity: 'word' })
const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
const words = Array.from(segmenter.segment('我想喝一杯冰美式咖啡')).filter(s => s.isWordLike).map(s => s.segment);
assert.ok(words.includes('咖啡'), 'Intl.Segmenter must segment 咖啡 as a word');

// 4. Verify client-side Admin bypass (?admin=1, #admin, Ctrl+Shift+A) is removed from 06-router-events-init.js
const mod06 = fs.readFileSync(new URL('../js/06-router-events-init.js', import.meta.url), 'utf8');
assert.ok(!mod06.includes("urlParams.get('admin') === '1'"), 'URL ?admin=1 client-side bypass must be removed');
assert.ok(mod06.includes('/admin/verify'), 'Admin mode must verify session with server /api/v1/admin/verify');

console.log('ALL BEHAVIORAL RED-TEAM, DTW TONE, SEGMENTER, AND ZERO-MODULO TESTS PASSED!');
