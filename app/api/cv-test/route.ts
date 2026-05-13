import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const auth = req.headers.get('authorization');
  if (!adminPassword || auth !== `Bearer ${adminPassword}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  return NextResponse.json({
    model: 'claude-sonnet-4-6',
    apiKeyLength: apiKey.length,
    envLoaded: apiKey.length > 0,
  });
}
