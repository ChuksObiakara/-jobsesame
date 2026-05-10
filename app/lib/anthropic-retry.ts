import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const RETRYABLE_STATUSES = new Set([429, 503, 529]);

function isRetryable(err: any): boolean {
  if (RETRYABLE_STATUSES.has(err?.status)) return true;
  const msg = (err?.message || err?.error?.message || '').toLowerCase();
  const type = (err?.error?.type || err?.error?.error?.type || '').toLowerCase();
  return type.includes('overload') || msg.includes('overload') || msg.includes('rate limit') || msg.includes('too many');
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Wraps client.messages.create with up to `maxRetries` automatic retries on
 * overloaded / rate-limit errors, using exponential back-off (1 s → 2 s → 4 s).
 */
export async function createMessage(
  params: Parameters<typeof anthropic.messages.create>[0],
  maxRetries = 3,
): Promise<Anthropic.Message> {
  let lastErr: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await anthropic.messages.create(params) as Anthropic.Message;
    } catch (err: any) {
      lastErr = err;

      if (!isRetryable(err) || attempt === maxRetries - 1) throw err;

      const wait = 2 ** attempt * 1000; // 1000 ms, 2000 ms, 4000 ms
      console.warn(`[Anthropic] overloaded — attempt ${attempt + 1}/${maxRetries}, retrying in ${wait}ms`);
      await delay(wait);
    }
  }

  throw lastErr;
}
