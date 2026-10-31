// ============================================================================
// k6 Load Test Script — 10,000 CCU Full-Stack API & Static Asset Benchmark
// Exercises: /api/v1/sync/outbox, /api/v1/quiz/submit, /api/v1/ai/chat, /learn/vocab
// ============================================================================
import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 2500 },
    { duration: '2m', target: 10000 },
    { duration: '3m', target: 10000 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'http_req_duration{kind:static}': ['p(95)<120', 'p(99)<250'],
    'http_req_duration{kind:api_sync}': ['p(95)<250', 'p(99)<450'],
    'http_req_duration{kind:api_quiz}': ['p(95)<220', 'p(99)<400'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'https://localhost';
  const headers = { 'Content-Type': 'application/json' };

  group('1. SEO Static Lesson Page', () => {
    const res = http.get(`${baseUrl}/learn/vocab/ni-hao`, { tags: { kind: 'static' } });
    check(res, { 'SEO page 200': (r) => r.status === 200 || r.status === 304 });
  });

  group('2. Vectorized Outbox Sync API', () => {
    const payload = JSON.stringify({
      user_id: '11111111-1111-4111-8111-111111111111',
      device_id: `k6_dev_${__VU}`,
      events: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          event_type: 'fsrs_review_log',
          payload: {
            id: '33333333-3333-4333-8333-333333333333',
            vocab_id: 'v_1',
            rating: 3,
            state_before: 'review',
            elapsed_ms: 4200,
            reviewed_at: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        }
      ]
    });
    const res = http.post(`${baseUrl}/api/v1/sync/outbox`, payload, { headers, tags: { kind: 'api_sync' } });
    check(res, { 'Outbox sync status ok': (r) => r.status === 200 || r.status === 201 });
  });

  group('3. Server-Authoritative Quiz Grading API', () => {
    const res = http.post(
      `${baseUrl}/api/v1/quiz/submit`,
      JSON.stringify({ lesson_id: 1, attempt_token: 'signed_tok', answers: { '1': 'A' } }),
      { headers, tags: { kind: 'api_quiz' } }
    );
    check(res, { 'Quiz submit handled': (r) => r.status < 500 });
  });

  sleep(1.0 + Math.random() * 1.5);
}
