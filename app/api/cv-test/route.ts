import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  return NextResponse.json({
    model: 'claude-sonnet-4-6',
    apiKeyLength: apiKey.length,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 12) + '...' : 'NOT SET',
    envLoaded: apiKey.length > 0,
  });
}
