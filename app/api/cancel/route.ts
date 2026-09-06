export const dynamic = 'force-dynamic';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { cancelLemonSqueezySubscription } from '@/app/lib/lemonsqueezy';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prisma } = await import('@/app/lib/prisma');
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Find the most recent Lemon Squeezy subscription reference for this
    // user (paystackRef is reused to hold the Lemon Squeezy subscription id).
    const latestSub = await prisma.payment.findFirst({
      where: { userId: user.id, reference: { startsWith: 'ls_sub_' } },
      orderBy: { createdAt: 'desc' },
    });

    if (latestSub?.paystackRef) {
      try {
        await cancelLemonSqueezySubscription(latestSub.paystackRef);
      } catch (err: any) {
        console.error('Lemon Squeezy cancel error:', err?.message);
        return NextResponse.json({ error: 'Could not cancel subscription with our payment provider. Please try again or contact support.' }, { status: 502 });
      }
      // Lemon Squeezy's webhook (subscription_cancelled) will set proExpiresAt
      // to the end of the current billing period; access stays on until then.
      return NextResponse.json({ success: true });
    }

    // No Lemon Squeezy subscription on record (e.g. a legacy/manual Pro
    // grant) — just revoke access immediately.
    await prisma.user.update({
      where: { id: user.id },
      data: { isPro: false, proExpiresAt: null },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
