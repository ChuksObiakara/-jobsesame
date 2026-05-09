export const dynamic = 'force-dynamic';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { prisma } = await import('@/app/lib/prisma');
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress || '';
  const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ');

  // Ensure user exists in DB
  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: {
      clerkId: userId,
      email,
      name,
      credits: 3,
      referralCode: Buffer.from(userId).toString('base64').slice(0, 8).toUpperCase(),
    },
    include: { ukSubscription: true },
  });

  if (user.ukSubscription) {
    return NextResponse.json(
      { error: 'Trial already used', subscription: user.ukSubscription },
      { status: 400 },
    );
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const sub = await prisma.uKSubscription.create({
    data: {
      userId: user.id,
      plan: 'trial',
      credits: 999,
      active: true,
      expiresAt,
    },
  });

  return NextResponse.json({ success: true, subscription: sub, expiresAt });
}
