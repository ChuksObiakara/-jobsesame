export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createLemonSqueezyCheckout } from '@/app/lib/lemonsqueezy';

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

// Pro is the only paid plan — billed monthly in USD via Lemon Squeezy.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!checkRateLimit(userId, 5)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { plan } = await req.json();

    if (plan !== 'pro') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: 'No email found for account' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.jobsesame.co';
    const redirectUrl = `${baseUrl}/payment/success`;

    const checkoutUrl = await createLemonSqueezyCheckout({
      email,
      redirectUrl,
      custom: { clerk_user_id: userId, plan: 'pro' },
    });

    return NextResponse.json({ authorizationUrl: checkoutUrl });
  } catch (err: any) {
    console.error('Payment checkout error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
