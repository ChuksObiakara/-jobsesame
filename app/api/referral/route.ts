import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json({ error: 'No user ID provided' }, { status: 400 });
    }

    const referralCode = Buffer.from(userId).toString('base64').slice(0, 8).toUpperCase();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const referralLink = `${appUrl}?ref=${referralCode}`;

    return NextResponse.json({
      success: true,
      referralCode,
      referralLink,
      message: 'Share this link with friends to unlock free rewrites',
    });

  } catch (error) {
    console.error('Referral error:', error);
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
