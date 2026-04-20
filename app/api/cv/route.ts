import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const CV_PROMPT = 'Extract information from this CV and return ONLY valid JSON with no markdown or extra text. Use this exact structure: {"name":"full name","email":"email","phone":"phone","location":"city country","title":"current job title","summary":"2 sentence professional summary","skills":["skill1","skill2"],"experience_years":5,"education":"highest qualification","languages":["English"],"experience":[{"title":"exact job title","company":"exact company name","duration":"X years","bullets":["key achievement"]}],"job_search_keywords":["keyword1","keyword2"]}';

export async function POST(request: NextRequest) {
  console.log('=== CV UPLOAD CALLED ===');
  console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);
  console.log('ANTHROPIC_API_KEY length:', process.env.ANTHROPIC_API_KEY?.length);

  try {
    const formData = await request.formData();
    const file = formData.get('cv') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('File received:', file.name, file.size, 'bytes, type:', file.type);

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

    // ── Strategy 1: extract text with pdf-parse, send as plain text ──────────
    let pdfText = '';
    try {
      // Dynamic require avoids ESM/CJS import conflicts at build time
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
      const parsed = await pdfParse(buffer);
      pdfText = (parsed.text || '').trim();
      console.log('pdf-parse extracted', pdfText.length, 'chars from', parsed.numpages, 'pages');
    } catch (parseErr: any) {
      console.warn('pdf-parse failed:', parseErr.message, '— will use document API');
    }

    let response;

    if (pdfText.length >= 100) {
      // Enough text — send directly, no document API needed
      console.log('Using text extraction path');
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `${CV_PROMPT}\n\nCV TEXT:\n${pdfText.substring(0, 10000)}`,
        }],
      });
    } else {
      // Fallback: send raw PDF via Anthropic document API (handles scanned/image PDFs)
      console.log('Using document API fallback (text too short or extraction failed)');
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

    console.log('Claude response received');

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude');

    const cleanText = content.text.replace(/```json|```/g, '').trim();
    console.log('Response preview:', cleanText.substring(0, 120));

    const cvData = JSON.parse(cleanText);
    console.log('CV parsed successfully for:', cvData.name);

    return NextResponse.json({ success: true, cvData });

  } catch (error: any) {
    console.error('CV upload error:', error?.message, 'status:', error?.status);

    if (error?.message?.includes('not valid') || error?.message?.includes('Invalid PDF')) {
      return NextResponse.json(
        { error: 'Could not read this PDF. Try re-exporting it from Word or Google Docs.' },
        { status: 400 }
      );
    }
    if (error?.message?.includes('JSON') || error?.message?.includes('parse')) {
      return NextResponse.json(
        { error: 'AI could not extract CV data. Please ensure your CV has clear text sections.' },
        { status: 500 }
      );
    }
    if (error?.status === 401) {
      return NextResponse.json({ error: 'API configuration error. Contact support.' }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Failed to process CV. Please try again.', details: error?.message },
      { status: 500 }
    );
  }
}
