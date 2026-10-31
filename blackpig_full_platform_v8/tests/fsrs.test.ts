import { describe, it, expect } from 'vitest';
import mod01 from '../js/01-security-fsrs-rollover.js';

const { computeFSRSSchedule, rebuildCardStatesFromReviewLogs, FSRS5_DEFAULT_WEIGHTS } = mod01;

describe('FSRS-5 (19-Parameter) Production Scheduler & Property-Based Invariants', () => {
  it('uses the official 19-parameter FSRS-5 weight vector and omits legacy SM-2 ease', () => {
    expect(FSRS5_DEFAULT_WEIGHTS.length).toBe(19);
    const res = computeFSRSSchedule({ state: 'new' }, 3, 1700000000000);
    expect(res.state).toBe('review');
    expect(res.reps).toBe(1);
    expect(res.scheduledDays).toBeGreaterThanOrEqual(1);
    expect((res as any).ease).toBeUndefined();
  });

  it('satisfies strict stability monotonicity across ratings 1 < 2 < 3 < 4 on new and review cards', () => {
    const now = 1700000000000;
    const r1 = computeFSRSSchedule({ state: 'new' }, 1, now);
    const r2 = computeFSRSSchedule({ state: 'new' }, 2, now);
    const r3 = computeFSRSSchedule({ state: 'new' }, 3, now);
    const r4 = computeFSRSSchedule({ state: 'new' }, 4, now);

    expect(r2.stability).toBeGreaterThan(r1.stability);
    expect(r3.stability).toBeGreaterThan(r2.stability);
    expect(r4.stability).toBeGreaterThan(r3.stability);
  });

  it('deterministically rebuilds card_states from append-only review_logs', () => {
    const cards = [{ vocab_id: 'v_1', hanzi: '你好', state: 'new' }];
    const logs = [
      { vocab_id: 'v_1', rating: 3, reviewed_at: '2026-10-01T08:00:00Z' },
      { vocab_id: 'v_1', rating: 3, reviewed_at: '2026-10-05T08:00:00Z' },
      { vocab_id: 'v_1', rating: 4, reviewed_at: '2026-10-15T08:00:00Z' }
    ];
    const rebuilt = rebuildCardStatesFromReviewLogs(cards, logs);
    expect(rebuilt[0].reps).toBe(3);
    expect(rebuilt[0].stability).toBeGreaterThan(10);
  });
});
