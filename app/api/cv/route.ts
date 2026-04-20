import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const CV_PROMPT =
  'Extract information from this CV and return ONLY valid JSON with no markdown or extra text. Use this exact structure:\n{"name":"full name","email":"email","phone":"phone","location":"city country","title":"current job title","summary":"2 sentence professional summary","skills":["skill1","skill2"],"experience_years":5,"education":"highest qualification","languages":["English"],"experience":[{"title":"exact job title","company":"exact company name","duration":"X years","bullets":["key achievement"]}],"job_search_keywords":["keyword1","keyword2"]}';

export async function POST(request: NextRequest) {
  console.log('=== CV UPLOAD CALLED ===');
  console.log('API key present:', !!process.env.ANTHROPIC_API_KEY, 'len:', process.env.ANTHROPIC_API_KEY?.length);

  try {
    const formData = await request.formData();
    const file = formData.get('cv') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('File:', file.name, file.size, 'bytes, type:', file.type);

    const isPdf =
      file.type === 'application/pdf' ||
      file.type === 'application/octet-stream' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 });
    }

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 15MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // ── Strategy 1: extract text via internal pdf-parse (no test-file side-effect) ──
    let pdfText = '';
    try {
      // Use internal module directly to avoid the ENOENT test-data loading bug in pdf-parse@1.x
      const pdfParseInternal = require('pdf-parse/lib/pdf-parse.js') as (
        buf: Buffer
      ) => Promise<{ text: string; numpages: number }>;
      const parsed = await pdfParseInternal(buffer);
      pdfText = (parsed.text || '').trim();
      console.log('pdf-parse extracted', pdfText.length, 'chars,', parsed.numpages, 'pages');
    } catch (parseErr: any) {
      console.warn('pdf-parse failed:', parseErr.message);
    }

    let response;

    if (pdfText.length >= 100) {
      // Sufficient text — send to Claude as plain text (fastest, most reliable)
      console.log('Path: text extraction →', pdfText.length, 'chars');
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `${CV_PROMPT}\n\nCV TEXT:\n${pdfText.substring(0, 10000)}`,
        }],
      });
    } else {
      // Fallback: send raw PDF via document API (handles scanned/image PDFs)
      console.log('Path: document API (text too short:', pdfText.length, ')');
      const base64 = buffer.toString('base64');
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            } as any,
            { type: 'text', text: CV_PROMPT },
          ],
        }],
      });
    }

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude');

    const rawText = content.text.replace(/```json|```/g, '').trim();
    console.log('Claude response preview:', rawText.substring(0, 120));

    const cvData = JSON.parse(rawText);
    console.log('Parsed successfully:', cvData.name);

    return NextResponse.json({ success: true, cvData });

  } catch (error: any) {
    const msg = error?.message || '';
    const status = error?.status;
    console.error('CV upload error — message:', msg, '| status:', status, '| type:', error?.error?.type);

    if (msg.includes('not valid') || msg.includes('Invalid PDF') || msg.includes('bad XRef')) {
      return NextResponse.json(
        { error: 'Could not read this PDF. Try re-exporting it from Word or Google Docs as a new PDF.' },
        { status: 400 }
      );
    }
    if (msg.includes('JSON') || msg.includes('Unexpected token') || msg.includes('parse')) {
      return NextResponse.json(
        { error: 'AI could not extract data from your CV. Ensure the PDF has selectable text (not a scanned image).' },
        { status: 500 }
      );
    }
    if (status === 401) {
      return NextResponse.json({ error: 'API configuration error. Contact support.' }, { status: 500 });
    }
    if (status === 529 || msg.includes('overloaded')) {
      return NextResponse.json({ error: 'AI is busy right now. Please try again in a moment.' }, { status: 503 });
    }

    return NextResponse.json(
      { error: 'Failed to process CV. Please try again.', details: msg },
      { status: 500 }
    );
  }
}
