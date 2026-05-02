import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ cv: null });
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
    let user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      const referralCode = Buffer.from(userId).toString('base64').slice(0, 8).toUpperCase();
      user = await prisma.user.create({ data: { clerkId: userId, email: cvData.email || '', credits: 3, referralCode } });
    }
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
