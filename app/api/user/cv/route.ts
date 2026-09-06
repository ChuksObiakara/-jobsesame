import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { referralCodeFor } from '@/app/lib/referral-code';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ cv: null });
    const { prisma } = await import('@/app/lib/prisma');
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ cv: null });
    const cv = await prisma.cV.findUnique({ where: { userId: user.id } });
    return NextResponse.json({ cv });
  } catch (error: any) {
    return NextResponse.json({ cv: null });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { cvData } = await request.json();
    const { prisma } = await import('@/app/lib/prisma');
    // Use upsert (not findUnique + conditional create) so this is race-safe
    // against /api/user/sync, which the dashboard fires on every mount
    // without awaiting it. Both routes create the same brand-new user row
    // for a first-time signup; with findUnique + create, whichever request
    // lands second sees the row as already-missing (read-before-write race),
    // tries to create it again, and throws a unique-constraint error on
    // referralCode/clerkId — which silently discarded every CV upload for a
    // new account that uploaded quickly after landing on the dashboard,
    // since the client only logs this failure and never surfaces it.
    const referralCode = referralCodeFor(userId);
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: { clerkId: userId, email: cvData.email || '', credits: 3, referralCode },
    });
    const cv = await prisma.cV.upsert({
      where: { userId: user.id },
      update: { ...cvData, skills: cvData.skills || [], languages: cvData.languages || [], experience: cvData.experience || [] },
      create: { userId: user.id, ...cvData, skills: cvData.skills || [], languages: cvData.languages || [], experience: cvData.experience || [] },
    });
    return NextResponse.json({ success: true, cv });
  } catch (error: any) {
    console.error('CV save error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
