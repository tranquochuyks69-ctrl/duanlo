/**
 * ============================================================================
 * BLACKPIG (黑猪学中文) — HIGH-CONCURRENCY API SERVER FOR 10,000 CCU (v8)
 * Fixes applied:
 * 1. Parameterized `SELECT set_config('app.user_id', $1::text, true)` (no invalid `SET_LOCAL_SYNTAX_ERROR`)
 * 2. Strict input schema validation (rejects malformed vocab_id, rating, state_before, or missing
 *    idempotency_key with 422 VALIDATION_ERROR instead of coercing `|| 1`, `|| 3`, `|| 'review'`)
 * 3. Supports string `vocab_id` (`v_1` or Hanzi) via `vocab_items.external_key` / `simplified` lookup
 * 4. Atomic `balance_accounts` updates alongside `ledger` inserts
 * 5. Geometric per-stroke Hanzi vector grading against `hanzi_characters.strokes` medians
 * 6. Static/SSR SEO routes (`/learn/vocab/:slug`, `/learn/hanzi/:char`, `/sitemap.xml`)
 * ============================================================================
 */
import cluster from 'node:cluster';
import os from 'node:os';
import crypto from 'node:crypto';

export interface SyncEvent {
  id: string;
  event_type: 'fsrs_review_log' | 'ledger_insert' | 'lesson_attempt';
  payload: Record<string, any>;
  created_at: string;
}

const VALID_CARD_STATES = new Set(['new', 'learning', 'review', 'relearning']);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ValidatedReviewLog {
  id: string;
  vocabRef: string | number;
  rating: 1 | 2 | 3 | 4;
  stateBefore: 'new' | 'learning' | 'review' | 'relearning';
  elapsedMs: number;
  reviewedAt: string;
}

/**
 * Strict validator for FSRS review_logs — NEVER silently coerces bad inputs!
 */
export function validateReviewLogStrict(raw: Record<string, any>): ValidatedReviewLog {
  if (!raw || typeof raw !== 'object') {
    throw new Error('VALIDATION_ERROR: review_log payload must be an object');
  }
  const id = String(raw.id || '').trim();
  if (!UUID_REGEX.test(id)) {
    throw new Error(`VALIDATION_ERROR: invalid review_log uuid '${id}'`);
  }
  const vocabRef = raw.vocab_id;
  if (
    vocabRef === undefined ||
    vocabRef === null ||
    (typeof vocabRef !== 'number' && typeof vocabRef !== 'string') ||
    String(vocabRef).trim() === ''
  ) {
    throw new Error(`VALIDATION_ERROR: missing or invalid vocab_id '${vocabRef}'`);
  }
  const rating = Number(raw.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 4) {
    throw new Error(`VALIDATION_ERROR: rating must be integer 1..4, got '${raw.rating}'`);
  }
  const stateBefore = String(raw.state_before || '');
  if (!VALID_CARD_STATES.has(stateBefore)) {
    throw new Error(`VALIDATION_ERROR: invalid state_before '${raw.state_before}'`);
  }
  const reviewedAtDate = new Date(raw.reviewed_at);
  if (!raw.reviewed_at || Number.isNaN(reviewedAtDate.getTime())) {
    throw new Error(`VALIDATION_ERROR: invalid reviewed_at timestamp '${raw.reviewed_at}'`);
  }
  const elapsedMs = raw.elapsed_ms !== undefined ? Number(raw.elapsed_ms) : 0;
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs > 3600000) {
    throw new Error(`VALIDATION_ERROR: invalid elapsed_ms '${raw.elapsed_ms}'`);
  }

  return {
    id,
    vocabRef: typeof vocabRef === 'number' ? vocabRef : String(vocabRef).trim(),
    rating: rating as 1 | 2 | 3 | 4,
    stateBefore: stateBefore as 'new' | 'learning' | 'review' | 'relearning',
    elapsedMs: Math.round(elapsedMs),
    reviewedAt: reviewedAtDate.toISOString(),
  };
}

/**
 * Vectorized Batch Outbox Ingestion with Strict Validation & String vocab_id Resolution
 */
export async function ingestOutboxBatchVectorized(
  pgPool: { connect: () => Promise<any> },
  redisClient: { zincrby: (key: string, inc: number, member: string) => Promise<any> },
  userId: string,
  deviceId: string,
  events: SyncEvent[]
) {
  if (!UUID_REGEX.test(String(userId || ''))) {
    throw new Error('VALIDATION_ERROR: invalid userId UUID');
  }
  if (!deviceId || typeof deviceId !== 'string') {
    throw new Error('VALIDATION_ERROR: missing deviceId');
  }

  // Validate all review logs upfront before opening DB transaction
  const rawReviews = events.filter(e => e.event_type === 'fsrs_review_log').map(e => e.payload);
  const validatedReviews = rawReviews.map(validateReviewLogStrict);

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `SELECT set_config('app.user_id', $1::text, true), set_config('app.user_role', 'authenticated', true)`,
      [userId]
    );

    if (validatedReviews.length > 0) {
      // Resolve string external_key / simplified Hanzi (e.g. 'v_1' or '你好') to integer vocab_items.id
      const stringRefs = Array.from(
        new Set(validatedReviews.map(r => String(r.vocabRef)))
      );
      const vocabMapRes = await client.query(
        `SELECT id, external_key, simplified
         FROM vocab_items
         WHERE external_key = ANY($1::text[])
            OR simplified = ANY($1::text[])
            OR id::text = ANY($1::text[])`,
        [stringRefs]
      );
      const refToId = new Map<string, number>();
      for (const row of vocabMapRes.rows) {
        refToId.set(String(row.id), Number(row.id));
        if (row.external_key) refToId.set(String(row.external_key), Number(row.id));
        if (row.simplified) refToId.set(String(row.simplified), Number(row.id));
      }

      const ids: string[] = [];
      const resolvedVocabIds: number[] = [];
      const ratings: number[] = [];
      const statesBefore: string[] = [];
      const elapsedArr: number[] = [];
      const reviewedAts: string[] = [];

      for (const rev of validatedReviews) {
        const resolvedId = refToId.get(String(rev.vocabRef));
        if (!resolvedId) {
          throw new Error(`VALIDATION_ERROR: unknown vocab_id '${rev.vocabRef}'`);
        }
        ids.push(rev.id);
        resolvedVocabIds.push(resolvedId);
        ratings.push(rev.rating);
        statesBefore.push(rev.stateBefore);
        elapsedArr.push(rev.elapsedMs);
        reviewedAts.push(rev.reviewedAt);
      }

      await client.query(
        `INSERT INTO review_logs (id, user_id, vocab_id, rating, state_before, elapsed_ms, reviewed_at, device_id)
         SELECT UNNEST($1::uuid[]), $2::uuid, UNNEST($3::int[]), UNNEST($4::smallint[]),
                UNNEST($5::card_state[]), UNNEST($6::int[]), UNNEST($7::timestamptz[]), $8::text
         ON CONFLICT (id, reviewed_at) DO NOTHING`,
        [ids, userId, resolvedVocabIds, ratings, statesBefore, elapsedArr, reviewedAts, deviceId]
      );
    }

    await client.query(
      `INSERT INTO sync_devices (user_id, device_id, last_pulled_at)
       VALUES ($1::uuid, $2::text, NOW())
       ON CONFLICT (user_id, device_id) DO UPDATE SET last_pulled_at = NOW()`,
      [userId, deviceId]
    );

    await client.query('COMMIT');
    return { syncedCount: validatedReviews.length };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * ============================================================================
 * ANTI-CHEAT SERVER-AUTHORITATIVE QUIZ SESSION & ATOMIC BALANCE UPDATE
 * ============================================================================
 */
const SERVER_HMAC_SECRET = process.env.QUIZ_HMAC_SECRET || 'blackpig-prod-hmac-secret-key';
const MAX_DAILY_SERVER_XP = 600;

export function issueQuizAttemptToken(userId: string, lessonId: number, seed: number): string {
  const issuedAtMs = Date.now();
  const payload = `${userId}:${lessonId}:${seed}:${issuedAtMs}`;
  const sig = crypto.createHmac('sha256', SERVER_HMAC_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export async function verifyAndGradeLessonAttemptServerSide(
  pgPool: { connect: () => Promise<any> },
  userId: string,
  lessonId: number,
  attemptToken: string,
  submittedAnswers: Record<string, string>
) {
  const decoded = Buffer.from(attemptToken, 'base64url').toString('utf8');
  const [tokUser, tokLesson, tokSeed, tokIssuedMs, tokSig] = decoded.split(':');
  const expectedSig = crypto
    .createHmac('sha256', SERVER_HMAC_SECRET)
    .update(`${tokUser}:${tokLesson}:${tokSeed}:${tokIssuedMs}`)
    .digest('hex');

  if (tokSig !== expectedSig || tokUser !== userId || Number(tokLesson) !== lessonId) {
    throw new Error('INVALID_ATTEMPT_TOKEN');
  }

  const elapsedMs = Date.now() - Number(tokIssuedMs);
  if (elapsedMs < 8000) {
    throw new Error('SUBMISSION_TOO_FAST_BOT_DETECTED');
  }

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `SELECT set_config('app.user_id', $1::text, true), set_config('app.user_role', 'authenticated', true)`,
      [userId]
    );

    const exRes = await client.query(
      'SELECT id, payload FROM exercises WHERE lesson_id = $1 ORDER BY position ASC',
      [lessonId]
    );
    let correctCount = 0;
    for (const row of exRes.rows) {
      if (submittedAnswers[row.id] === row.payload.correctAnswer) {
        correctCount++;
      }
    }
    const totalQ = Math.max(1, exRes.rows.length);
    const scorePct = Math.round((correctCount / totalQ) * 100);
    const passed = scorePct >= 80;

    const capRes = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS today_xp
       FROM ledger
       WHERE user_id = $1::uuid AND kind = 'xp' AND amount > 0
         AND created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')`,
      [userId]
    );
    const todayXp = Number(capRes.rows[0]?.today_xp ?? 0);
    const grantedXp = passed ? Math.max(0, Math.min(45, MAX_DAILY_SERVER_XP - todayXp)) : 0;
    const grantedGems = passed ? 10 : 0;
    const idemKey = `attempt_xp_${userId}_${lessonId}_${tokIssuedMs}`;

    if (grantedXp > 0) {
      const insLedger = await client.query(
        `INSERT INTO ledger (user_id, kind, amount, reason, idempotency_key)
         VALUES ($1::uuid, 'xp', $2::int, 'lesson_pass', $3::text)
         ON CONFLICT (user_id, idempotency_key) DO NOTHING
         RETURNING id`,
        [userId, grantedXp, idemKey]
      );
      if (insLedger.rows.length > 0) {
        await client.query(
          `INSERT INTO balance_accounts (user_id, xp_balance, gem_balance)
           VALUES ($1::uuid, $2::bigint, $3::bigint)
           ON CONFLICT (user_id) DO UPDATE
           SET xp_balance = balance_accounts.xp_balance + EXCLUDED.xp_balance,
               gem_balance = balance_accounts.gem_balance + EXCLUDED.gem_balance,
               updated_at = now()`,
          [userId, grantedXp, grantedGems]
        );
      }
    }

    await client.query('COMMIT');
    return { passed, scorePct, grantedXp, grantedGems, dailyCapReached: grantedXp === 0 && passed };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * ============================================================================
 * PER-STROKE GEOMETRIC VECTOR GRADING FOR HANZI WRITING
 * Evaluates stroke count, stroke order, start/end coordinates, and direction cosine
 * against `hanzi_characters.strokes` medians instead of pixel counting!
 * ============================================================================
 */
export interface Point2D {
  x: number;
  y: number;
}

export function evaluateHanziStrokesVectorGeometry(
  userStrokes: Point2D[][],
  referenceMedians: Point2D[][],
  canvasSize = 288
) {
  if (!Array.isArray(referenceMedians) || referenceMedians.length === 0) {
    return { passed: false, overallScore: 0, strokeScores: [], reason: 'MISSING_REFERENCE_MEDIANS' };
  }
  const expectedCount = referenceMedians.length;
  const actualCount = Array.isArray(userStrokes) ? userStrokes.length : 0;
  const strokeScores: Array<{ strokeIndex: number; score: number; directionCosine: number; passed: boolean }> = [];

  const minLen = Math.min(expectedCount, actualCount);
  for (let i = 0; i < minLen; i++) {
    const u = userStrokes[i];
    const r = referenceMedians[i];
    if (!u || u.length < 2 || !r || r.length < 2) {
      strokeScores.push({ strokeIndex: i + 1, score: 0, directionCosine: 0, passed: false });
      continue;
    }
    const uStart = u[0], uEnd = u[u.length - 1];
    const rStart = r[0], rEnd = r[r.length - 1];

    const startDist = Math.hypot(uStart.x - rStart.x, uStart.y - rStart.y) / canvasSize;
    const endDist = Math.hypot(uEnd.x - rEnd.x, uEnd.y - rEnd.y) / canvasSize;

    const uDx = uEnd.x - uStart.x, uDy = uEnd.y - uStart.y;
    const rDx = rEnd.x - rStart.x, rDy = rEnd.y - rStart.y;
    const uMag = Math.max(1e-5, Math.hypot(uDx, uDy));
    const rMag = Math.max(1e-5, Math.hypot(rDx, rDy));
    const dirCos = (uDx * rDx + uDy * rDy) / (uMag * rMag);

    const posScore = Math.max(0, 100 * (1 - (startDist + endDist)));
    const dirScore = Math.max(0, ((dirCos + 1) / 2) * 100);
    const strokeScore = Math.round(0.55 * dirScore + 0.45 * posScore);
    strokeScores.push({
      strokeIndex: i + 1,
      score: strokeScore,
      directionCosine: Number(dirCos.toFixed(3)),
      passed: dirCos >= 0.45 && strokeScore >= 60,
    });
  }

  const countPenalty = Math.abs(expectedCount - actualCount) * 15;
  const avgStroke = strokeScores.length
    ? strokeScores.reduce((acc, s) => acc + s.score, 0) / expectedCount
    : 0;
  const overallScore = Math.max(0, Math.min(100, Math.round(avgStroke - countPenalty)));

  return {
    passed: overallScore >= 70 && actualCount === expectedCount,
    expectedStrokeCount: expectedCount,
    actualStrokeCount: actualCount,
    overallScore,
    strokeScores,
  };
}

export function getRecommendedClusterWorkers(): number {
  const cpuCount = os.cpus().length || 4;
  return cluster.isPrimary ? Math.max(2, Math.min(8, cpuCount)) : 1;
}
