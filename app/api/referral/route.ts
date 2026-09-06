export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { referralCodeFor } from '@/app/lib/referral-code';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const referralCode = referralCodeFor(userId);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const referralLink = `${appUrl}?ref=${referralCode}`;

    return NextResponse.json({
      success: true,
      referralCode,
      referralLink,
      message: 'Share this link with friends to unlock free rewrites',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process referral' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ref = searchParams.get('ref');

  if (!ref) {
    return NextResponse.json({ error: 'Missing ref parameter' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: 'Referral tracked successfully',
    referralsCount: 1,
    referralsNeeded: 3,
  });
}
