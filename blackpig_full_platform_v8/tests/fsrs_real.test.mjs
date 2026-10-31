// Real Automated Test Suite Importing Production Module 01 Directly
import assert from 'node:assert/strict';
import mod01 from '../js/01-security-fsrs-rollover.js';

const { computeFSRSSchedule, rebuildCardStatesFromReviewLogs, getLocalDateISO, daysBetweenISODates } = mod01;

// 1. Test 19-Parameter FSRS-5 on a brand-new card across all 4 ratings
const c1 = computeFSRSSchedule({ state: 'new' }, 1, 1700000000000);
const c2 = computeFSRSSchedule({ state: 'new' }, 2, 1700000000000);
const c3 = computeFSRSSchedule({ state: 'new' }, 3, 1700000000000);
const c4 = computeFSRSSchedule({ state: 'new' }, 4, 1700000000000);

assert.equal(c1.shortIntervalText, '10 phút');
assert.ok(c2.intervalDays >= 1);
assert.ok(c3.intervalDays >= c2.intervalDays);
assert.ok(c4.intervalDays > c3.intervalDays);

// 2. Test Event-Sourced rebuildCardStatesFromReviewLogs
const initialCards = [{ vocab_id: 'v_1', hanzi: '你好', state: 'new' }];
const logs = [
  { vocab_id: 'v_1', rating: 3, reviewed_at: '2026-10-01T10:00:00Z' },
  { vocab_id: 'v_1', rating: 3, reviewed_at: '2026-10-04T10:00:00Z' },
  { vocab_id: 'v_1', rating: 4, reviewed_at: '2026-10-15T10:00:00Z' }
];
const rebuilt = rebuildCardStatesFromReviewLogs(initialCards, logs);
assert.equal(rebuilt[0].reps, 3);
assert.ok(rebuilt[0].stability > 10, 'Stability must grow after 3 successful spaced reviews');

// 3. Test YYYY-MM-DD Timezone-Safe Date Math
assert.equal(daysBetweenISODates('2026-10-28', '2026-10-30'), 2);
console.log('ALL PRODUCTION FSRS-5 & EVENT-SOURCED REBUILD TESTS PASSED!');

// 4. Test Smart Linguistic Distractor Generator (Matches word length & Pinyin similarity)
const { pickSmartLinguisticDistractors } = mod01;
const sampleBank = [
  { hanzi: '老师', pinyin: 'lǎoshī', meaning: 'Giáo viên', hanviet: 'Lão sư' },
  { hanzi: '老板', pinyin: 'lǎobǎn', meaning: 'Ông chủ', hanviet: 'Lão bản' },
  { hanzi: '老婆', pinyin: 'lǎopó', meaning: 'Vợ', hanviet: 'Lão bà' },
  { hanzi: '我', pinyin: 'wǒ', meaning: 'Tôi', hanviet: 'Ngã' },
  { hanzi: '出租车', pinyin: 'chūzūchē', meaning: 'Xe taxi', hanviet: 'Xuất tô xa' }
];
const distractors = pickSmartLinguisticDistractors(sampleBank[0], sampleBank, 2);
assert.equal(distractors.length, 2);
assert.equal(distractors[0].hanzi.length, 2, 'Top distractor should match 2-character syllable length and lǎo- initial');
console.log('SMART LINGUISTIC DISTRACTOR GENERATOR TEST PASSED!');
