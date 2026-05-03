export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Jobsesame2024Admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pw = searchParams.get('pw') || req.headers.get('x-admin-password') || '';
  if (pw !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { prisma } = await import('@/app/lib/prisma');
    const [userCount, applicationCount, cvCount, savedJobCount, paymentData, todayApps] = await Promise.all([
      prisma.user.count(),
      prisma.application.count(),
      prisma.cV.count(),
      prisma.savedJob.count(),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'success' } }),
      prisma.application.count({
        where: { appliedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);

    const paymentTotal = paymentData._sum.amount || 0;
    const revenueZAR = (paymentTotal / 100).toFixed(2);

    return NextResponse.json({
      userCount,
      applicationCount,
      cvCount,
      savedJobCount,
      paymentTotal,
      revenueZAR,
      todayApplicationCount: todayApps,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
