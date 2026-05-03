export const dynamic = 'force-dynamic';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();
    if (!reference) return NextResponse.json({ error: 'No reference provided' }, { status: 400 });

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const data = await res.json();

    if (!data.status || data.data?.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment not verified', paystackStatus: data.data?.status },
        { status: 400 }
      );
    }

    // Reference format: jobsesame_${plan}_${timestamp}
    const plan = reference.split('_')[1] as string | undefined;

    const { prisma } = await import('@/app/lib/prisma');
    const { userId } = await auth();
    let user = userId ? await prisma.user.findUnique({ where: { clerkId: userId } }) : null;

    if (!user) {
      const email: string | undefined = data.data?.customer?.email;
      if (email) user = await prisma.user.findUnique({ where: { email } });
    }

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await prisma.payment.upsert({
      where: { reference },
      update: { status: 'paid' },
      create: {
        userId: user.id,
        reference,
        amount: data.data.amount,
        currency: data.data.currency || 'ZAR',
        plan: plan || 'unknown',
        status: 'paid',
        paystackRef: String(data.data.id ?? ''),
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

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error('Payment verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
