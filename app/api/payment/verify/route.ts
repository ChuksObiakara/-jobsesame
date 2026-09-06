export const dynamic = 'force-dynamic';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Lemon Squeezy confirms a subscription asynchronously via webhook, not via
// a reference we can verify synchronously on the success-page redirect like
// Paystack's flow did. Instead, the success page polls this endpoint, which
// just reports whether the webhook has already flipped this account to Pro.
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prisma } = await import('@/app/lib/prisma');
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isPro = !!(user.isPro && (!user.proExpiresAt || user.proExpiresAt > new Date()));
    return NextResponse.json({ success: isPro, plan: isPro ? 'pro' : user.plan });
  } catch (error: any) {
    console.error('Payment status check error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Something went wrong' }, { status: 500 });
  }
}
