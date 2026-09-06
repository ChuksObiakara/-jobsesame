export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyLemonSqueezySignature } from '@/app/lib/lemonsqueezy';

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-signature');

    if (!verifyLemonSqueezySignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventName: string = event?.meta?.event_name || '';
    const customData: Record<string, string> = event?.meta?.custom_data || {};
    const clerkUserId: string | undefined = customData.clerk_user_id;

    const attrs = event?.data?.attributes || {};
    const subscriptionId: string = String(event?.data?.id ?? '');
    const email: string = attrs.user_email || '';
    const status: string = attrs.status || '';
    const renewsAt: string | null = attrs.renews_at || null;
    const endsAt: string | null = attrs.ends_at || null;

    // Only subscription_* events carry a subscription id we care about here.
    if (!eventName.startsWith('subscription_')) {
      return NextResponse.json({ received: true });
    }

    const { prisma } = await import('@/app/lib/prisma');

    let user = clerkUserId
      ? await prisma.user.findUnique({ where: { clerkId: clerkUserId } })
      : null;
    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } });
    }
    if (!user) {
      console.error('Lemon Squeezy webhook: user not found', { clerkUserId, email, eventName });
      return NextResponse.json({ received: true, skipped: true });
    }

    // One Payment row per subscription, keyed by a unique reference. The
    // `paystackRef` column is reused (pre-dates the Lemon Squeezy migration)
    // to store the Lemon Squeezy subscription id.
    const reference = `ls_sub_${subscriptionId}`;
    await prisma.payment.upsert({
      where: { reference },
      update: { status },
      create: {
        userId: user.id,
        reference,
        amount: 2500,
        currency: 'USD',
        plan: 'pro',
        status,
        paystackRef: subscriptionId,
      },
    });

    const grantAccess = () => {
      const proExpiresAt = renewsAt ? new Date(renewsAt) : addDays(new Date(), 30);
      return prisma.user.update({
        where: { id: user!.id },
        data: { isPro: true, proExpiresAt, plan: 'pro' },
      });
    };

    const revokeAccess = () =>
      prisma.user.update({
        where: { id: user!.id },
        data: { isPro: false, proExpiresAt: null },
      });

    // Access stays on until the period ends — mirrors the existing lazy
    // expiry check in /api/credits (isPro flips false once proExpiresAt passes).
    const scheduleAccessEnd = () =>
      prisma.user.update({
        where: { id: user!.id },
        data: endsAt ? { proExpiresAt: new Date(endsAt) } : {},
      });

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_payment_success':
      case 'subscription_payment_recovered':
        await grantAccess();
        break;

      case 'subscription_updated':
        if (status === 'active' || status === 'on_trial') {
          await grantAccess();
        } else if (status === 'cancelled') {
          await scheduleAccessEnd();
        } else if (status === 'expired' || status === 'unpaid') {
          await revokeAccess();
        }
        // status === 'past_due' → still in Lemon Squeezy's dunning/retry
        // window, leave access as-is until it resolves or expires.
        break;

      case 'subscription_cancelled':
        await scheduleAccessEnd();
        break;

      case 'subscription_expired':
      case 'subscription_payment_failed':
        await revokeAccess();
        break;

      default:
        break;
    }

    console.log(`Lemon Squeezy webhook processed: ${eventName} (${status}) for user ${user.id}`);
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Lemon Squeezy webhook error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Webhook error' }, { status: 500 });
  }
}
