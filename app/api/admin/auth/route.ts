export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const correct = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Jobsesame2024Admin';
  if (password !== correct) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
