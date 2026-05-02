import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ applications: [] });
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ applications: [] });
    const applications = await prisma.application.findMany({ where: { userId: user.id }, orderBy: { appliedAt: 'desc' } });
    return NextResponse.json({ applications });
  } catch (error: any) {
    return NextResponse.json({ applications: [] });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const application = await prisma.application.create({
      data: { userId: user.id, jobTitle: body.jobTitle, company: body.company, location: body.location, jobUrl: body.jobUrl, jobSource: body.jobSource, matchScore: body.matchScore },
    });
    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { applicationId, status } = await request.json();
    const application = await prisma.application.update({ where: { id: applicationId }, data: { status } });
    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
