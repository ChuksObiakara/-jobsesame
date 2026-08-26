export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createMessage } from '@/app/lib/anthropic-retry';

// Unauthenticated — this backs the homepage's free CV check, so gate by IP
// instead of by user, and keep the prompt/output small since there's no
// signed-in credit balance to draw down.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(ip: string, maxRequests: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 3_600_000 });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

function extractJSON(text: string): string {
  const stripped = text.replace(/```json|```/g, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start !== -1 && end > start) return stripped.slice(start, end + 1);
  return stripped;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkRateLimit(ip, 10)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again in an hour.' }, { status: 429 });
    }

    const { bullet, title } = await request.json();
    if (!bullet || typeof bullet !== 'string' || bullet.length < 5) {
      return NextResponse.json({ error: 'No bullet provided' }, { status: 400 });
    }

    const response = await createMessage({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Rewrite this one CV bullet point to be more impact-driven and ATS-friendly. Add a plausible quantified metric ONLY if the original implies a scale (team size, timeframe, volume) — otherwise strengthen the verb and specificity without inventing numbers that aren't implied. Keep it one line, no preamble.

${title ? `Role: ${title}\n` : ''}Original bullet: "${bullet}"

Return ONLY valid JSON, no markdown:
{"rewritten": "the rewritten bullet, one line"}`,
      }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(extractJSON(raw));
    if (!parsed.rewritten) throw new Error('No rewrite returned');

    return NextResponse.json({ success: true, rewritten: String(parsed.rewritten).trim() });
  } catch (error: any) {
    console.error('[cv-check/rewrite-sample] error:', error?.message);
    return NextResponse.json({ error: 'Could not rewrite this line right now' }, { status: 500 });
  }
}
