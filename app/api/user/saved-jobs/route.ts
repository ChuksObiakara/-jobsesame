import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ savedJobs: [] });
    const { prisma } = await import('@/app/lib/prisma');
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ savedJobs: [] });
    const savedJobs = await prisma.savedJob.findMany({ where: { userId: user.id }, orderBy: { savedAt: 'desc' } });
    return NextResponse.json({ savedJobs });
  } catch (error: any) {
    return NextResponse.json({ savedJobs: [] });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { prisma } = await import('@/app/lib/prisma');
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const savedJob = await prisma.savedJob.create({
      data: { userId: user.id, jobTitle: body.jobTitle, company: body.company, location: body.location, jobUrl: body.jobUrl, jobData: body.jobData },
    });
    return NextResponse.json({ success: true, savedJob });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { jobId } = await request.json();
    const { prisma } = await import('@/app/lib/prisma');
    await prisma.savedJob.delete({ where: { id: jobId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
