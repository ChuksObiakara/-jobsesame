export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

const PLAN_AMOUNTS: Record<string, Record<string, number>> = {
  credits: { ZAR: 9900, USD: 599 },
  pro:     { ZAR: 24900, USD: 1399 },
};

export async function POST(req: NextRequest) {
  try {
    const { email, plan, currency } = await req.json();

    if (!email || !plan || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const resolvedCurrency = currency === 'ZAR' ? 'ZAR' : 'USD';
    const amount = PLAN_AMOUNTS[plan]?.[resolvedCurrency];

    if (!amount) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const reference = `jobsesame_${plan}_${Date.now()}`;
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://jobsesame.co.za'}/payment/success`;

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        currency: resolvedCurrency,
        reference,
        callback_url: callbackUrl,
      }),
    });

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message || 'Payment initialisation failed' }, { status: 400 });
    }

    return NextResponse.json({ authorizationUrl: data.data.authorization_url });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
