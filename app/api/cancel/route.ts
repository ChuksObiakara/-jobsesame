export const dynamic = 'force-dynamic';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { prisma } = await import('@/app/lib/prisma');
    await prisma.user.updateMany({
      where: { clerkId: userId },
      data: { isPro: false, proExpiresAt: null },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
