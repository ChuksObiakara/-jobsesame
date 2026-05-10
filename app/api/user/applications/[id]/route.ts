export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const VALID_STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { status } = await req.json();
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { prisma } = await import('@/app/lib/prisma');
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const existing = await prisma.application.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const application = await prisma.application.update({
      where: { id: params.id },
      data: { status },
    });
    return NextResponse.json({ success: true, application });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
