export const dynamic = 'force-dynamic';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// ── GET: check subscription status for the logged-in user ────────────────────
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ subscribed: false, plan: null, credits: 0, expiresAt: null }, { status: 401 });
  }

  const { prisma } = await import('@/app/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { ukSubscription: true },
  });

  if (!user) return NextResponse.json({ subscribed: false, plan: null, credits: 0, expiresAt: null });

  const sub = user.ukSubscription;
  if (!sub || !sub.active) {
    return NextResponse.json({ subscribed: false, plan: null, credits: 0, expiresAt: null });
  }

  return NextResponse.json({
    subscribed: true,
    // keep legacy `active` field so existing dashboard/jobs pages don't break
    active: true,
    plan: sub.plan,
    credits: sub.credits,
    expiresAt: sub.expiresAt,
  });
}

// ── POST: manually activate a UK subscription (admin/testing only) ────────────
export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Jobsesame2024Admin';

  const body = await req.json();
  const { password, userId: targetUserId, plan, credits } = body;

  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  if (!targetUserId || !plan) {
    return NextResponse.json({ error: 'userId and plan are required' }, { status: 400 });
  }

  const validPlans = ['free', 'credits', 'pro'];
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: `plan must be one of: ${validPlans.join(', ')}` }, { status: 400 });
  }

  const { prisma } = await import('@/app/lib/prisma');

  // Accept either a Clerk userId (starts with "user_") or a Prisma user id
  const user = await prisma.user.findFirst({
    where: targetUserId.startsWith('user_')
      ? { clerkId: targetUserId }
      : { id: targetUserId },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const creditCount = plan === 'credits' ? (typeof credits === 'number' ? credits : 20)
    : plan === 'pro' ? 999999
    : 0;

  const expiresAt = plan === 'pro'
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)   // 30 days
    : null;

  const sub = await prisma.uKSubscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan,
      credits: creditCount,
      active: true,
      expiresAt,
    },
    update: {
      plan,
      credits: creditCount,
      active: true,
      expiresAt,
    },
  });

  return NextResponse.json({
    success: true,
    subscription: {
      id: sub.id,
      userId: user.id,
      clerkId: user.clerkId,
      email: user.email,
      plan: sub.plan,
      credits: sub.credits,
      active: sub.active,
      expiresAt: sub.expiresAt,
    },
  });
}
