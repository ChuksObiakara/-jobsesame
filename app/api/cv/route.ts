import { NextRequest, NextResponse } from 'next/server';
import { createMessage } from '@/app/lib/anthropic-retry';
import { auth } from '@clerk/nextjs/server';
import { extractText, getDocumentProxy } from 'unpdf';
import { referralCodeFor } from '@/app/lib/referral-code';
import { toCvRecord } from '@/app/lib/cv-data';

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

    console.log('Parsing PDF...');
    // unpdf wraps a current, maintained pdfjs-dist build — pdf-parse's frozen
    // ~2019 internal parser can't read the compressed xref streams modern PDF
    // writers (Word, Google Docs, LibreOffice, qpdf) emit by default, and was
    // rejecting effectively every real CV with "bad XRef entry".
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text: extracted } = await extractText(pdf, { mergePages: true });
    const pdfText = (extracted || '').trim();
    console.log('PDF text length:', pdfText.length);

    if (!pdfText || pdfText.length < 50) {
      return NextResponse.json(
        { error: 'Could not read PDF. Please ensure it is a text-based PDF not a scanned image.' },
        { status: 400 }
      );
    }

    console.log('Calling Claude...');
    const response = await createMessage({
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

    if (userId) {
      try {
        const { prisma } = await import('@/app/lib/prisma');
        // upsert, not findUnique + conditional create — race-safe against
        // /api/user/sync, which the dashboard fires on every mount without
        // awaiting it. See app/lib/referral-code.ts for why referralCode
        // also had to change: the old generator collided across almost all
        // users, so this create kept failing on a unique-constraint error
        // and silently dropping the CV save.
        const user = await prisma.user.upsert({
          where: { clerkId: userId },
          update: {},
          create: { clerkId: userId, email: cvData.email || '', credits: 3, referralCode: referralCodeFor(userId) },
        });
        // toCvRecord maps the Claude extraction's snake_case field names
        // (experience_years) to the Prisma schema's camelCase columns
        // (experienceYears) and drops fields the schema doesn't have
        // (job_search_keywords) — spreading cvData directly threw
        // "Unknown argument" and silently discarded every CV save.
        const cvRecord = toCvRecord(cvData);
        await prisma.cV.upsert({
          where: { userId: user.id },
          update: cvRecord,
          create: { userId: user.id, ...cvRecord },
        });
      } catch (e) { console.log('CV save to DB skipped:', e); }
    }

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
    return NextResponse.json({ error: error?.message || 'Failed to process CV' }, { status: 500 });
  }
}
