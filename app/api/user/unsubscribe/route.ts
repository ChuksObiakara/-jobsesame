export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  const { prisma } = await import('@/app/lib/prisma');

  // Token-based path — no login required (for email unsubscribe links)
  const token = req.nextUrl.searchParams.get('token');
  if (token) {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
      if (!payload.email || !payload.exp || Date.now() > payload.exp) {
        return NextResponse.json({ error: 'Invalid or expired unsubscribe link' }, { status: 400 });
      }
      await prisma.user.updateMany({ where: { email: payload.email }, data: { emailOptOut: true } });
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: 'Invalid unsubscribe token' }, { status: 400 });
    }
  }

  // Clerk-auth path
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json(
      { error: 'Please sign in or use the unsubscribe link from your email' },
      { status: 401 },
    );
  }

  try {
    await prisma.user.update({ where: { clerkId }, data: { emailOptOut: true } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Unsubscribe error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
