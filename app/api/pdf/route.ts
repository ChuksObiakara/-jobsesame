export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { buildCvPdf, buildCoverLetterPdf } from '@/app/lib/pdf';

// Generates CVs and cover letters as real PDF downloads. This is a server
// route (rather than client-side jsPDF + Blob) specifically so the response
// carries Content-Disposition: attachment — the one download mechanism every
// browser, including iOS/mobile Safari, honours reliably. See app/lib/pdf.ts
// for why the old client-side approach silently failed on mobile.

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(userId: string, max: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 3_600_000 });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[\r\n"]/g, '').replace(/[^a-zA-Z0-9 _.-]/g, '_').trim();
  return (cleaned.endsWith('.pdf') ? cleaned : `${cleaned}.pdf`).slice(0, 150) || 'document.pdf';
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!checkRateLimit(userId, 40)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const form = await req.formData();
    const kind = String(form.get('kind') || '');
    const fileName = sanitizeFileName(String(form.get('fileName') || 'document.pdf'));
    const payloadRaw = form.get('payload');
    if (typeof payloadRaw !== 'string') {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(payloadRaw);
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    let bytes: Uint8Array;
    if (kind === 'cv') {
      bytes = buildCvPdf(payload as Parameters<typeof buildCvPdf>[0]);
    } else if (kind === 'cover-letter') {
      bytes = buildCoverLetterPdf(payload as Parameters<typeof buildCoverLetterPdf>[0]);
    } else {
      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
    }

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
