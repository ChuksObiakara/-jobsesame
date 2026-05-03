export const dynamic = 'force-dynamic';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ active: false, plan: null, credits: 0 }, { status: 401 });

  const { prisma } = await import('@/app/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { ukSubscription: true },
  });

  if (!user) return NextResponse.json({ active: false, plan: null, credits: 0 });

  const sub = user.ukSubscription;
  if (!sub || !sub.active) return NextResponse.json({ active: false, plan: null, credits: 0 });

  return NextResponse.json({
    active: true,
    plan: sub.plan,
    credits: sub.credits,
    expiresAt: sub.expiresAt,
  });
}
