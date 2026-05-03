import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress || '';
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
    const referralCode = Buffer.from(userId).toString('base64').slice(0, 8).toUpperCase();
    const { prisma } = await import('@/app/lib/prisma');
    const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
    const dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: { email, name },
      create: { clerkId: userId, email, name, credits: 3, referralCode },
    });

    // Fire welcome email only on first signup (not on subsequent syncs)
    if (!existing && email) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobsesame.co.za';
      fetch(`${baseUrl}/api/welcome-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, userId }),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, user: dbUser, isNewUser: !existing });
  } catch (error: any) {
    console.error('User sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
