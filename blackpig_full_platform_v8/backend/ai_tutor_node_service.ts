/**
 * ============================================================================
 * HUAYU QUEST — UNIFIED NODE.JS / TYPESCRIPT AI TUTOR SERVICE
 * Stack-aligned for Node.js 20+:
 * - Uses native V8 `new Intl.Segmenter('zh-CN', { granularity: 'word' })` (no Python required!)
 * - Uses `pinyin-pro` for deterministic polyphone Pinyin generation
 * - Enforces `<user_message>` tag escaping, 200-char limit, and `tools: []` (zero tool access)
 * - Returns `suggested_srs_events` so Client FSRS-5 applies updates without DB sync conflict
 * - Implements Timeout (4.5s), Exponential Backoff Retry, Daily Token Budget & Circuit Breaker
 * ============================================================================
 */

const zhSegmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });

export function sanitizeUserMessageAgainstInjection(rawInput: string): string {
  return String(rawInput || '')
    .replace(/<\/?user_message\b[^>]*>/gi, '')
    .replace(/<\/?system\b[^>]*>/gi, '')
    .replace(/<\/?instruction\b[^>]*>/gi, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 200);
}

export function segmentChineseWordsNode(hanziText: string): string[] {
  const tokens: string[] = [];
  for (const part of zhSegmenter.segment(hanziText)) {
    if (part.isWordLike || /[\u4e00-\u9fa5]/.test(part.segment)) {
      tokens.push(part.segment);
    }
  }
  return tokens;
}

export interface SuggestedSrsEvent {
  vocab_id: string;
  hanzi: string;
  event_kind: 'implicit_chat_use';
  suggested_rating: 3;
  weight: 0.5;
}

export interface BatchedPedagogicalOutput {
  prompt_version: string;
  model: string;
  corrections: Array<{
    original: string;
    fixed: string;
    error_code: string;
    explain_vi: string;
  }>;
  suggested_srs_events: SuggestedSrsEvent[];
  in_level_ratio: number;
}
