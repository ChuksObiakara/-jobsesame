export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { prisma } = await import('@/app/lib/prisma');
    await prisma.user.update({
      where: { clerkId },
      data: { emailOptOut: true },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Unsubscribe error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
