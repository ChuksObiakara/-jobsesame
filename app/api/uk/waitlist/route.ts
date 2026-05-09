export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

const waitlistRateLimit = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
  const now = Date.now();
  const entry = waitlistRateLimit.get(ip);
  if (entry && now < entry.resetAt && entry.count >= 3) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }
  if (!entry || now >= entry.resetAt) {
    waitlistRateLimit.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
  } else {
    entry.count++;
  }

  try {
    const { email, market = 'GB' } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const { prisma } = await import('@/app/lib/prisma');

    // Avoid duplicates — silently succeed if already on waitlist
    const existing = await prisma.waitlistEntry.findFirst({ where: { email: email.toLowerCase(), market } });
    if (existing) return NextResponse.json({ success: true, alreadyJoined: true });

    await prisma.waitlistEntry.create({
      data: { email: email.toLowerCase(), market },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[UK Waitlist]', err);
    return NextResponse.json({ error: 'Failed to save. Please try again.' }, { status: 500 });
  }
}
