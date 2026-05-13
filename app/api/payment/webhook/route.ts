export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature') || '';
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      console.error('Webhook: PAYSTACK_SECRET_KEY not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Verify Paystack webhook signature
    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // Only process successful charges
    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true });
    }

    const txData = event.data;
    const reference: string = txData?.reference || '';
    const email: string = txData?.customer?.email || '';

    if (!reference) return NextResponse.json({ error: 'No reference' }, { status: 400 });

    // Reference format: jobsesame_${plan}_${timestamp}
    const parts = reference.split('_');
    const plan = parts[1] as string | undefined;

    const { prisma } = await import('@/app/lib/prisma');

    // Find user by email (webhook has no session cookie)
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error('Webhook: user not found for email', email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Idempotency: skip if already processed
    const existing = await prisma.payment.findUnique({ where: { reference } });
    if (existing?.status === 'paid') {
      return NextResponse.json({ received: true, skipped: true });
    }

    await prisma.payment.upsert({
      where: { reference },
      update: { status: 'paid', paystackRef: String(txData.id ?? '') },
      create: {
        userId: user.id,
        reference,
        amount: txData.amount,
        currency: txData.currency || 'ZAR',
        plan: plan || 'unknown',
        status: 'paid',
        paystackRef: String(txData.id ?? ''),
      },
    });

    if (plan === 'pro') {
      const proExpiresAt = new Date();
      proExpiresAt.setDate(proExpiresAt.getDate() + 30);
      await prisma.user.update({
        where: { id: user.id },
        data: { isPro: true, proExpiresAt },
      });
    } else if (plan === 'credits') {
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: 10 } },
      });
    }

    console.log(`Webhook processed: ${plan} for ${email}`);
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
