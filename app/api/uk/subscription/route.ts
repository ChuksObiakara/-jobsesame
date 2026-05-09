export const dynamic = 'force-dynamic';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ active: false, plan: null, credits: 0, expiresAt: null, hasSubscription: false, trialDaysLeft: null }, { status: 401 });
  }

  const { prisma } = await import('@/app/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { ukSubscription: true },
  });

  if (!user) {
    return NextResponse.json({ active: false, plan: null, credits: 0, expiresAt: null, hasSubscription: false, trialDaysLeft: null });
  }

  const sub = user.ukSubscription;

  // No subscription at all — first-time UK user
  if (!sub) {
    return NextResponse.json({ active: false, plan: null, credits: 0, expiresAt: null, hasSubscription: false, trialDaysLeft: null });
  }

  // Auto-expire trial if past expiresAt
  if (sub.active && sub.expiresAt && new Date() > sub.expiresAt) {
    await prisma.uKSubscription.update({
      where: { id: sub.id },
      data: { active: false },
    });
    return NextResponse.json({ active: false, plan: sub.plan, credits: 0, expiresAt: sub.expiresAt, hasSubscription: true, trialDaysLeft: 0 });
  }

  // Calculate days left for trial
  let trialDaysLeft: number | null = null;
  if (sub.plan === 'trial' && sub.active && sub.expiresAt) {
    const msLeft = new Date(sub.expiresAt).getTime() - Date.now();
    trialDaysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  }

  return NextResponse.json({
    active: sub.active,
    subscribed: sub.active,
    plan: sub.plan,
    credits: sub.credits,
    expiresAt: sub.expiresAt,
    hasSubscription: true,
    trialDaysLeft,
  });
}

// ── POST: manually activate (admin/testing) ───────────────────────────────────
export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const body = await req.json();
  const { password, userId: targetUserId, plan, credits } = body;

  if (!adminPassword || !password || password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  if (!targetUserId || !plan) {
    return NextResponse.json({ error: 'userId and plan are required' }, { status: 400 });
  }

  const validPlans = ['free', 'credits', 'pro', 'trial'];
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: `plan must be one of: ${validPlans.join(', ')}` }, { status: 400 });
  }

  const { prisma } = await import('@/app/lib/prisma');
  const user = await prisma.user.findFirst({
    where: targetUserId.startsWith('user_') ? { clerkId: targetUserId } : { id: targetUserId },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const creditCount = plan === 'credits' ? (typeof credits === 'number' ? credits : 20)
    : plan === 'pro' ? 999999
    : plan === 'trial' ? 999
    : 0;

  const expiresAt = plan === 'pro' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : plan === 'trial' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    : null;

  const sub = await prisma.uKSubscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, plan, credits: creditCount, active: true, expiresAt },
    update: { plan, credits: creditCount, active: true, expiresAt },
  });

  return NextResponse.json({ success: true, subscription: { ...sub, clerkId: user.clerkId, email: user.email } });
}
