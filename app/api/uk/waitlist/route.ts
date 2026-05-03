export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
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
