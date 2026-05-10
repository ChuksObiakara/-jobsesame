import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(userId: string, max: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 3_600_000 });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ credits: 0, isPro: false });
    const { prisma } = await import('@/app/lib/prisma');
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ credits: 3, isPro: false });
    // Auto-expire Pro if past proExpiresAt
    if (user.isPro && user.proExpiresAt && new Date() > user.proExpiresAt) {
      await prisma.user.update({ where: { clerkId: userId }, data: { isPro: false } });
      return NextResponse.json({ credits: user.credits, isPro: false, proExpiresAt: user.proExpiresAt });
    }
    return NextResponse.json({ credits: user.credits, isPro: user.isPro, proExpiresAt: user.proExpiresAt });
  } catch (error: any) {
    return NextResponse.json({ credits: 0, isPro: false });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!checkRateLimit(userId, 10)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const { action } = await request.json();
    if (action === 'deduct') {
      const { prisma } = await import('@/app/lib/prisma');
      const user = await prisma.user.findUnique({ where: { clerkId: userId } });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      if (!user.isPro && user.credits <= 0) return NextResponse.json({ error: 'No credits remaining', paywall: true }, { status: 402 });
      if (!user.isPro) {
        await prisma.user.update({ where: { clerkId: userId }, data: { credits: { decrement: 1 } } });
      }
      return NextResponse.json({ success: true, credits: user.isPro ? 999 : user.credits - 1 });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
