import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(userId: string, maxRequests: number): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 3600000 });
    return true;
  }
  if (userLimit.count >= maxRequests) return false;
  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (userId && !checkRateLimit(userId, 10)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again in an hour.' }, { status: 429 });
    }

    console.log('CV route called');
    const formData = await request.formData();
    const file = formData.get('cv') as File;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    console.log('File received:', file.name, file.size);

    const isPdf =
      file.type === 'application/pdf' ||
      file.type === 'application/octet-stream' ||
      file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: 'File too large. Maximum 15MB.' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('Parsing PDF...');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
    const pdfData = await pdfParse(buffer);
    const pdfText = (pdfData.text || '').trim();
    console.log('PDF text length:', pdfText.length);

    if (!pdfText || pdfText.length < 50) {
      return NextResponse.json(
        { error: 'Could not read PDF. Please ensure it is a text-based PDF not a scanned image.' },
        { status: 400 }
      );
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    console.log('Calling Claude...');
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Extract CV information from this text and return ONLY valid JSON no markdown no extra text:\n\n${pdfText.substring(0, 8000)}\n\nReturn this exact JSON structure:\n{"name":"full name","email":"email or empty string","phone":"phone or empty string","location":"city country","title":"current job title","summary":"2 sentence professional summary","skills":["skill1","skill2","skill3"],"experience_years":0,"education":"highest qualification","languages":["English"],"experience":[{"title":"exact job title","company":"exact company name","duration":"dates or years","bullets":["achievement 1","achievement 2"]}],"job_search_keywords":["keyword1","keyword2"]}`,
      }],
    });

    console.log('Claude responded');
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const clean = text.replace(/```json|```/g, '').trim();
    const cvData = JSON.parse(clean);
    console.log('Parsed CV for:', cvData.name);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      await fetch(`${baseUrl}/api/user/cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': request.headers.get('Authorization') || '' },
        body: JSON.stringify({ cvData }),
      });
    } catch (e) { console.log('CV save to DB skipped:', e); }

    return NextResponse.json({ success: true, cvData });

  } catch (error: any) {
    console.error('CV error:', error?.message, error?.status);

    const msg = error?.message || '';
    if (msg.includes('JSON') || msg.includes('Unexpected token') || msg.includes('parse')) {
      return NextResponse.json(
        { error: 'AI could not extract data from your CV. Ensure the PDF has selectable text (not a scanned image).' },
        { status: 500 }
      );
    }
    if (error?.status === 401) {
      return NextResponse.json({ error: 'API configuration error. Contact support.' }, { status: 500 });
    }
    if (error?.status === 529 || msg.includes('overloaded')) {
      return NextResponse.json({ error: 'AI is busy right now. Please try again in a moment.' }, { status: 503 });
    }

    return NextResponse.json({ error: error?.message || 'Failed to process CV' }, { status: 500 });
  }
}
