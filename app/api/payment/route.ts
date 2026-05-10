export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(userId: string, max: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 3_600_000 });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

const PLAN_AMOUNTS: Record<string, Record<string, number>> = {
  credits: { ZAR: 9900, USD: 599 },
  pro:     { ZAR: 24900, USD: 1399 },
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!checkRateLimit(userId, 5)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { plan, currency } = await req.json();

    if (!plan || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: 'No email found for account' }, { status: 400 });
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
