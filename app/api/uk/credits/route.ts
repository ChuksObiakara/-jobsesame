export const dynamic = 'force-dynamic';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// ── GET: return current UK credits for the logged-in user ─────────────────────
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ credits: 0, plan: null, active: false }, { status: 401 });
  }

  const { prisma } = await import('@/app/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { ukSubscription: true },
  });

  if (!user?.ukSubscription || !user.ukSubscription.active) {
    return NextResponse.json({ credits: 0, plan: null, active: false });
  }

  const sub = user.ukSubscription;
  return NextResponse.json({
    credits: sub.credits,
    plan: sub.plan,
    active: sub.active,
    expiresAt: sub.expiresAt,
  });
}

// ── POST: deduct UK credits after a successful application ────────────────────
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const body = await req.json();
  const amount: number = typeof body.amount === 'number' && body.amount > 0 ? body.amount : 1;

  const { prisma } = await import('@/app/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { ukSubscription: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const sub = user.ukSubscription;

  if (!sub || !sub.active) {
    return NextResponse.json({ error: 'No active UK subscription', redirect: '/uk/subscribe' }, { status: 402 });
  }

  // Pro plan has effectively unlimited credits — skip deduction
  if (sub.plan === 'pro') {
    return NextResponse.json({ success: true, credits: sub.credits, plan: 'pro' });
  }

  if (sub.credits < amount) {
    return NextResponse.json({ error: 'Insufficient UK credits', credits: sub.credits, redirect: '/uk/subscribe' }, { status: 402 });
  }

  const updated = await prisma.uKSubscription.update({
    where: { userId: user.id },
    data: { credits: { decrement: amount } },
  });

  return NextResponse.json({
    success: true,
    credits: updated.credits,
    plan: updated.plan,
  });
}
